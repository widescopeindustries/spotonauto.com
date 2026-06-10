#!/usr/bin/env python3
"""Bot Gate Monitor - Parses nginx logs to track AI bot traffic."""
import gzip
import json
import os
import re
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from collections import Counter

LOG_DIR = Path("/var/log/nginx")
OUTPUT_DIR = Path("/opt/bot-gate-monitor")
OUTPUT_FILE = OUTPUT_DIR / "report.json"

# AI bot patterns
BOT_PATTERNS = [
    r"meta-externalagent", r"meta-externalfetcher", r"meta-webindexer", r"facebookbot",
    r"chatgpt-user", r"gptbot", r"oai-searchbot", r"openai",
    r"claudebot", r"claude-web", r"claude-user", r"claude-searchbot", r"anthropic",
    r"perplexitybot", r"perplexity-user",
    r"amazonbot", r"amazonadbot", r"amzn-searchbot", r"alexamediabot",
    r"applebot-extended",
    r"cohere", r"bytespider", r"youbot", r"diffbot", r"ccbot",
    r"timpibot", r"imagesiftbot", r"omgili", r"omgilibot", r"petalbot",
    r"ahrefsbot", r"semrushbot", r"dotbot", r"mj12bot",
    r"grok", r"x\.ai", r"mistral",
    r"turnitin", r"copyscape",
]
BOT_RE = re.compile(r"(" + r"|".join(BOT_PATTERNS) + r")", re.IGNORECASE)

# Search engine patterns (allowed)
SEARCH_PATTERNS = [r"googlebot", r"bingbot", r"duckduckbot", r"applebot/", r"yandexbot", r"baiduspider"]
SEARCH_RE = re.compile(r"(" + r"|".join(SEARCH_PATTERNS) + r")", re.IGNORECASE)

# Cloudflare IP ranges
CF_NETS = [
    (17324548, 20), (10321244, 22), (10322200, 22), (1033104, 22),
    (14110164, 18), (108162192, 18), (19093240, 20), (18811496, 20),
    (197234240, 22), (19841128, 17), (1621580, 15), (104160, 13),
    (104240, 14), (172640, 13), (131072, 22),
]

def ip_to_int(ip: str) -> int:
    parts = ip.split(".")
    return (int(parts[0]) << 24) + (int(parts[1]) << 16) + (int(parts[2]) << 8) + int(parts[3])

def is_cloudflare_ip(ip: str) -> bool:
    try:
        ip_int = ip_to_int(ip)
        for base, cidr in CF_NETS:
            mask = (0xFFFFFFFF << (32 - cidr)) & 0xFFFFFFFF
            if (ip_int & mask) == (base & mask):
                return True
    except Exception:
        pass
    return False

NGINX_LOG_RE = re.compile(
    r'^(?P<ip>[\d\.]+)\s+-\s+-\s+\[(?P<time>[^\]]+)\]\s+'
    r'"(?P<method>\w+)\s+(?P<path>\S+)\s+HTTP/[^"]+"\s+'
    r'(?P<status>\d+)\s+(?P<bytes>\d+)\s+"[^"]*"\s+'
    r'"(?P<ua>[^"]*)"'
)

def parse_time(ts: str) -> datetime:
    dt = datetime.strptime(ts.split()[0], "%d/%b/%Y:%H:%M:%S")
    return dt.replace(tzinfo=timezone.utc)

def read_logs(since: datetime):
    files = []
    for p in sorted(LOG_DIR.glob("access.log*"), reverse=True):
        files.append(p)
    for p in sorted(LOG_DIR.glob("access.log.*.gz"), reverse=True)[:3]:
        files.append(p)

    for fpath in files:
        opener = gzip.open if str(fpath).endswith(".gz") else open
        try:
            with opener(fpath, "rt", errors="replace") as f:
                for line in f:
                    m = NGINX_LOG_RE.match(line)
                    if not m:
                        continue
                    dt = parse_time(m.group("time"))
                    if dt < since:
                        continue
                    yield {
                        "ip": m.group("ip"),
                        "time": dt.isoformat(),
                        "method": m.group("method"),
                        "path": m.group("path"),
                        "status": int(m.group("status")),
                        "bytes": int(m.group("bytes")),
                        "ua": m.group("ua"),
                    }
        except Exception as e:
            print(f"Warn: {fpath}: {e}", file=sys.stderr)

def classify(req: dict) -> dict:
    ua = req["ua"]
    ip = req["ip"]
    req["is_cf"] = is_cloudflare_ip(ip)
    req["is_bot"] = bool(BOT_RE.search(ua))
    req["is_search"] = bool(SEARCH_RE.search(ua))
    req["is_tollbit"] = "tollbot" in ua.lower()
    return req

def main():
    now = datetime.now(timezone.utc)
    hour_ago = now - timedelta(hours=1)
    day_ago = now - timedelta(hours=24)

    hour_requests = []
    day_requests = []
    tollbit_hits = []
    leaked = []

    for req in read_logs(day_ago):
        req = classify(req)
        if req["time"] >= hour_ago.isoformat():
            hour_requests.append(req)
        day_requests.append(req)

        if req["is_tollbit"]:
            tollbit_hits.append(req)
        elif req["is_bot"] and not req["is_search"]:
            if req["status"] not in (301, 302, 307, 308, 444):
                leaked.append(req)

    bot_day = [r for r in day_requests if r["is_bot"] and not r["is_search"]]
    bot_hour = [r for r in hour_requests if r["is_bot"] and not r["is_search"]]

    def summarize(reqs):
        if not reqs:
            return {}
        statuses = Counter(r["status"] for r in reqs)
        uas = Counter(r["ua"][:80] for r in reqs)
        paths = Counter(r["path"][:120] for r in reqs)
        ips = Counter(r["ip"] for r in reqs)
        cf_vs_direct = Counter("cloudflare" if r["is_cf"] else "direct" for r in reqs)
        return {
            "total": len(reqs),
            "statuses": dict(statuses.most_common(10)),
            "top_uas": dict(uas.most_common(10)),
            "top_paths": dict(paths.most_common(10)),
            "top_ips": dict(ips.most_common(10)),
            "origin_breakdown": dict(cf_vs_direct.most_common()),
        }

    report = {
        "generated_at": now.isoformat(),
        "hour": summarize(bot_hour),
        "day": summarize(bot_day),
        "tollbit": {
            "total_24h": len(tollbit_hits),
            "last_hit": tollbit_hits[-1]["time"] if tollbit_hits else None,
        },
        "leakage": {
            "count_24h": len(leaked),
            "recent": [
                {"time": r["time"], "ip": r["ip"], "path": r["path"], "status": r["status"], "ua": r["ua"][:60]}
                for r in leaked[-20:]
            ],
        },
        "all_traffic_day": {
            "total": len(day_requests),
            "bots": len(bot_day),
            "search": len([r for r in day_requests if r["is_search"]]),
            "tollbit": len(tollbit_hits),
        }
    }

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, "w") as f:
        json.dump(report, f, indent=2)

    print(f"Report written to {OUTPUT_FILE}")
    print(f"  24h bot hits: {len(bot_day)}")
    print(f"  24h leaked:   {len(leaked)}")
    print(f"  Tollbit hits: {len(tollbit_hits)}")

if __name__ == "__main__":
    main()
