#!/usr/bin/env python3
"""Bot Gate Monitor - Fast version using grep pre-filter."""
import json
import re
import subprocess
import sys
from datetime import datetime, timedelta, timezone
from collections import Counter

LOG_FILE = "/var/log/nginx/access.log"
OUTPUT_FILE = "/opt/bot-gate-monitor/report.json"

BOT_PATTERNS = [
    "meta-external", "chatgpt-user", "gptbot", "oai-searchbot", "openai",
    "claudebot", "claude-web", "anthropic", "perplexitybot", "amazonbot",
    "cohere", "bytespider", "tollbot", "grok", "mistral", "facebookbot",
    "meta-webindexer", "meta-externalfetcher", "applebot-extended"
]
SEARCH_PATTERNS = ["googlebot", "bingbot", "duckduckbot", "applebot/", "yandexbot", "baiduspider"]
BOT_RE = re.compile(r"(" + r"|".join(BOT_PATTERNS) + r")", re.IGNORECASE)
SEARCH_RE = re.compile(r"(" + r"|".join(SEARCH_PATTERNS) + r")", re.IGNORECASE)

CF_NETS = [
    (0xAD31F300, 20), (0x6715F400, 22), (0x6716C800, 22), (0x671F0400, 22),
    (0x8D654000, 18), (0x6CA2C000, 18), (0xBE5DF000, 20), (0xBC727000, 20),
    (0xC5EAF000, 22), (0xC6298000, 17), (0xA29E0000, 15), (0x68100000, 13),
    (0x68180000, 14), (0xAC400000, 13), (0x83004800, 22),
]

def ip_to_int(ip):
    parts = ip.split(".")
    return (int(parts[0]) << 24) + (int(parts[1]) << 16) + (int(parts[2]) << 8) + int(parts[3])

def is_cf(ip):
    try:
        ip_int = ip_to_int(ip)
        for base, cidr in CF_NETS:
            mask = (0xFFFFFFFF << (32 - cidr)) & 0xFFFFFFFF
            if (ip_int & mask) == (base & mask):
                return True
    except Exception:
        pass
    return False

LOG_RE = re.compile(
    r'^(?P<ip>[\d\.]+)\s+-\s+-\s+\[(?P<time>[^\]]+)\]\s+'
    r'"(?P<method>\w+)\s+(?P<path>\S+)\s+HTTP/[^"]+"\s+'
    r'(?P<status>\d+)\s+(?P<bytes>\d+)\s+"[^"]*"\s+'
    r'"(?P<ua>[^"]*)"'
)

def parse_time(ts):
    return datetime.strptime(ts.split()[0], "%d/%b/%Y:%H:%M:%S").replace(tzinfo=timezone.utc)

def main():
    now = datetime.now(timezone.utc)
    day_ago = now - timedelta(hours=24)
    hour_ago = now - timedelta(hours=1)

    grep_pat = "|".join(BOT_PATTERNS)
    result = subprocess.run(
        ["grep", "-i", "-E", grep_pat, LOG_FILE],
        capture_output=True, text=True, errors="replace"
    )
    lines = result.stdout.strip().split("\n") if result.stdout else []

    reqs = []
    tollbit = []
    leaked = []

    for line in lines:
        if not line:
            continue
        m = LOG_RE.match(line)
        if not m:
            continue
        dt = parse_time(m.group("time"))
        if dt < day_ago:
            continue
        ua = m.group("ua")
        ip = m.group("ip")
        status = int(m.group("status"))
        is_bot = bool(BOT_RE.search(ua))
        is_search = bool(SEARCH_RE.search(ua))
        is_tollbit = "tollbot" in ua.lower()
        is_cf_ip = is_cf(ip)

        r = {"time": dt.isoformat(), "ip": ip, "path": m.group("path"), "status": status, "ua": ua, "is_cf": is_cf_ip}
        reqs.append(r)

        if is_tollbit:
            tollbit.append(r)
        elif is_bot and not is_search:
            if status not in (301, 302, 307, 308, 444):
                leaked.append(r)

    bots = [r for r in reqs if BOT_RE.search(r["ua"]) and not SEARCH_RE.search(r["ua"])]
    hour_bots = [r for r in bots if datetime.fromisoformat(r["time"]) >= hour_ago]

    def summarize(items):
        if not items:
            return {}
        return {
            "total": len(items),
            "statuses": dict(Counter(r["status"] for r in items).most_common(10)),
            "top_uas": dict(Counter(r["ua"][:80] for r in items).most_common(10)),
            "top_paths": dict(Counter(r["path"][:120] for r in items).most_common(10)),
            "top_ips": dict(Counter(r["ip"] for r in items).most_common(10)),
            "origin_breakdown": dict(Counter("cloudflare" if r["is_cf"] else "direct" for r in items).most_common()),
        }

    report = {
        "generated_at": now.isoformat(),
        "hour": summarize(hour_bots),
        "day": summarize(bots),
        "tollbit": {
            "total_24h": len(tollbit),
            "last_hit": tollbit[-1]["time"] if tollbit else None,
        },
        "leakage": {
            "count_24h": len(leaked),
            "recent": [
                {"time": r["time"], "ip": r["ip"], "path": r["path"], "status": r["status"], "ua": r["ua"][:60]}
                for r in leaked[-20:]
            ],
        },
        "all_traffic_day": {
            "total": len(reqs),
            "bots": len(bots),
            "search": len([r for r in reqs if SEARCH_RE.search(r["ua"])]),
            "tollbit": len(tollbit),
        }
    }

    with open(OUTPUT_FILE, "w") as f:
        json.dump(report, f, indent=2)

    print(f"Done. Bots: {len(bots)}, Leaked: {len(leaked)}, Tollbit: {len(tollbit)}")

if __name__ == "__main__":
    main()
