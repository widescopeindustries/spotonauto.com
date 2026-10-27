#!/usr/bin/env python3
"""Catch a site that is listening but not answering HTTP.

The 15-minute vps-sentinel only opens a TCP connection. On 2026-10-21
alloemmanuals-web was still listening on port 3002 while the homepage
never answered, and Cloudflare then kept the 502 for days.

This runs every minute from systemd. It does not request the public site
while the origin is down, because a 5xx on alloemmanuals.com can stay
cached. After the origin answers again, a cached 502 or 504 is purged.
"""

import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime

LOG_FILE = "/var/log/alloem-http-watch.log"
STATE_PATH = "/var/lib/alloem-http-watch/state.json"
ENV_PATH = "/root/.config/alloem-health.env"
LOCK_PATH = "/var/run/alloem-http-watch.lock"

PROBE_TIMEOUT = 8
# The manuals homepage can take longer than 8s while a crawl is walking it.
# That is a slow answer, not the dead process from 2026-10-21.
HOME_TIMEOUT = 20
STRIKES = 2
RESTART_COOLDOWN = 600
PUBLIC_EVERY = 300
PURGE_COOLDOWN = 1800
RECOVER_WAIT = 25

# Restart these when localhost HTTP fails twice. Public purge is only for
# alloemmanuals, whose page rule caches errors.
CHECKS = [
    {
        "name": "alloemmanuals-web",
        "port": 3002,
        "paths": ["/", "/privacy-policy"],
        "public": [
            "https://alloemmanuals.com/",
            "https://alloemmanuals.com/privacy-policy",
            "https://www.alloemmanuals.com/",
            "https://www.alloemmanuals.com/privacy-policy",
        ],
    },
    {"name": "aialwaysanswer-web", "port": 3004, "paths": ["/"]},
    {"name": "solarinstallerstx-web", "port": 3005, "paths": ["/"]},
    {"name": "fixsepticnow-web", "port": 3006, "paths": ["/"]},
    {"name": "easttexasstump-web", "port": 3007, "paths": ["/"]},
    {"name": "allhvacspecs-web", "port": 3008, "paths": ["/"]},
    {"name": "lmdb-backend", "port": 8080, "paths": ["/"]},
]


def log(msg):
    line = f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {msg}"
    print(line)
    try:
        with open(LOG_FILE, "a", encoding="utf-8") as handle:
            handle.write(line + "\n")
    except OSError:
        pass


def load_state():
    try:
        with open(STATE_PATH, encoding="utf-8") as handle:
            data = json.load(handle)
            if isinstance(data, dict):
                return data
    except (OSError, json.JSONDecodeError):
        pass
    return {}


def save_state(state):
    os.makedirs(os.path.dirname(STATE_PATH), exist_ok=True)
    tmp = STATE_PATH + ".tmp"
    with open(tmp, "w", encoding="utf-8") as handle:
        json.dump(state, handle, indent=2)
    os.replace(tmp, STATE_PATH)


def load_env():
    values = {}
    try:
        with open(ENV_PATH, encoding="utf-8") as handle:
            for line in handle:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, value = line.split("=", 1)
                values[key.strip()] = value.strip().strip('"').strip("'")
    except OSError:
        return {}
    return values


def probe(port, path, timeout=PROBE_TIMEOUT):
    url = f"http://127.0.0.1:{port}{path}"
    started = time.time()
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "alloem-http-watch"})
        with urllib.request.urlopen(req, timeout=timeout) as res:
            body = res.read(64)
            elapsed = time.time() - started
            return res.status == 200 and len(body) > 0, res.status, elapsed
    except Exception as exc:
        return False, type(exc).__name__, time.time() - started


def public_status(url):
    req = urllib.request.Request(url, method="GET", headers={"User-Agent": "alloem-http-watch"})
    try:
        with urllib.request.urlopen(req, timeout=12) as res:
            return res.status
    except urllib.error.HTTPError as exc:
        return exc.code
    except Exception as exc:
        return type(exc).__name__


def restart_service(name):
    log(f"RESTART {name}: localhost HTTP missed {STRIKES} times")
    result = subprocess.run(
        ["systemctl", "restart", name],
        capture_output=True,
        text=True,
        timeout=40,
    )
    if result.returncode != 0:
        err = (result.stderr or result.stdout or "").strip().replace("\n", " ")[:240]
        log(f"RESTART {name} failed: {err or result.returncode}")
        return False
    return True


def wait_until_up(check):
    deadline = time.time() + RECOVER_WAIT
    while time.time() < deadline:
        if origin_ok(check)[0]:
            return True
        time.sleep(2)
    return False


def origin_ok(check):
    details = []
    paths = check["paths"]
    # On the manuals app, restart only when every path fails. A homepage that
    # is slow while the privacy page still answers is a busy process.
    if check["name"] == "alloemmanuals-web" and len(paths) > 1:
        failed = 0
        for path in paths:
            timeout = HOME_TIMEOUT if path == "/" else PROBE_TIMEOUT
            ok, code, elapsed = probe(check["port"], path, timeout)
            details.append(f"{path} {code} {elapsed:.2f}s")
            if not ok:
                failed += 1
        detail = ", ".join(details)
        if failed == 0:
            return True, detail
        if failed < len(paths):
            log(f"SLOW {check['name']}: {detail}")
            return True, detail
        return False, detail
    for path in paths:
        ok, code, elapsed = probe(check["port"], path)
        details.append(f"{path} {code} {elapsed:.2f}s")
        if not ok:
            return False, ", ".join(details)
    return True, ", ".join(details)


def purge_public(urls):
    env = load_env()
    email = env.get("CLOUDFLARE_API_EMAIL", "")
    key = env.get("CLOUDFLARE_API_KEY", "")
    zone = env.get("CLOUDFLARE_ZONE_ID", "")
    if not email or not key or not zone:
        log("PURGE skipped: /root/.config/alloem-health.env is missing a value")
        return False
    body = json.dumps({"files": urls}).encode()
    req = urllib.request.Request(
        f"https://api.cloudflare.com/client/v4/zones/{zone}/purge_cache",
        data=body,
        method="POST",
        headers={
            "X-Auth-Email": email,
            "X-Auth-Key": key,
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as res:
            payload = json.loads(res.read().decode())
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode(errors="ignore")
        codes = []
        try:
            parsed = json.loads(raw)
            codes = [str(item.get("code")) for item in parsed.get("errors", []) if isinstance(item, dict)]
        except json.JSONDecodeError:
            codes = [str(exc.code)]
        log("PURGE failed: " + ",".join(codes or [str(exc.code)]))
        return False
    except Exception as exc:
        log(f"PURGE failed: {type(exc).__name__}")
        return False
    ok = bool(payload.get("success"))
    log("PURGE " + ("ok" if ok else "rejected") + f" ({len(urls)} urls)")
    return ok


def check_public(check, state, force):
    urls = check.get("public") or []
    if not urls:
        return
    now = time.time()
    last = float(state.get("last_public_check", 0))
    if not force and now - last < PUBLIC_EVERY:
        return
    state["last_public_check"] = now
    bad = []
    for url in urls:
        code = public_status(url)
        log(f"PUBLIC {check['name']} {url} {code}")
        if code in (502, 504):
            bad.append(url)
    if not bad:
        return
    last_purge = float(state.get("last_purge", 0))
    if now - last_purge < PURGE_COOLDOWN:
        log(f"PUBLIC cached error on {len(bad)} url(s); purge still cooling down")
        return
    if purge_public(bad):
        state["last_purge"] = time.time()


def run(check_only):
    state = load_state()
    failures = state.setdefault("failures", {})
    restarts = state.setdefault("last_restart", {})
    now = time.time()
    problems = []

    for check in CHECKS:
        name = check["name"]
        ok, detail = origin_ok(check)
        if ok:
            if int(failures.get(name, 0)) > 0:
                log(f"RECOVERED {name}: {detail}")
            failures[name] = 0
            if name == "alloemmanuals-web":
                check_public(check, state, force=False)
            continue

        failures[name] = int(failures.get(name, 0)) + 1
        log(f"MISS {name} {failures[name]}/{STRIKES}: {detail}")
        problems.append(name)
        if check_only or failures[name] < STRIKES:
            continue
        last = float(restarts.get(name, 0))
        if now - last < RESTART_COOLDOWN:
            log(f"RESTART {name} suppressed; cooldown has {int(RESTART_COOLDOWN - (now - last))}s left")
            continue
        # Count the cooldown from before the restart so a slow boot cannot loop.
        # Save it before the restart call. A hung restart used to skip the
        # save, and the next minute restarted the app again.
        restarts[name] = time.time()
        save_state(state)
        if not restart_service(name):
            continue
        if wait_until_up(check):
            failures[name] = 0
            log(f"RECOVERED {name} after restart")
            if name == "alloemmanuals-web":
                check_public(check, state, force=True)
        else:
            log(f"STILL DOWN {name} after restart")

    state["updated"] = datetime.now().isoformat(timespec="seconds")
    state["problems"] = problems
    save_state(state)
    if problems:
        log("CHECK done with misses: " + ", ".join(problems))
    else:
        log("CHECK ok")


def credentials_ok():
    env = load_env()
    email = env.get("CLOUDFLARE_API_EMAIL", "")
    key = env.get("CLOUDFLARE_API_KEY", "")
    zone = env.get("CLOUDFLARE_ZONE_ID", "")
    if not email or not key or not zone:
        log("CREDENTIALS missing")
        return False
    req = urllib.request.Request(
        f"https://api.cloudflare.com/client/v4/zones/{zone}",
        headers={"X-Auth-Email": email, "X-Auth-Key": key},
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as res:
            payload = json.loads(res.read().decode())
    except Exception as exc:
        log(f"CREDENTIALS failed: {type(exc).__name__}")
        return False
    log("CREDENTIALS " + ("ok" if payload.get("success") else "rejected"))
    return bool(payload.get("success"))


def main():
    check_only = "--check" in sys.argv
    os.makedirs(os.path.dirname(STATE_PATH), exist_ok=True)
    if os.path.exists(LOG_FILE) and os.path.getsize(LOG_FILE) > 5_000_000:
        try:
            os.replace(LOG_FILE, LOG_FILE + ".1")
        except OSError:
            pass
    lock = open(LOCK_PATH, "a", encoding="utf-8")
    try:
        import fcntl
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError:
        log("CHECK skipped; previous run still going")
        return
    except ImportError:
        pass
    if "--credentials" in sys.argv:
        credentials_ok()
    run(check_only)


if __name__ == "__main__":
    main()
