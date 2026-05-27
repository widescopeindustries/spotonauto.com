import re
import gzip
import os
import glob
from collections import Counter, defaultdict
from datetime import datetime

# Path to nginx logs
LOG_DIR = "/var/log/nginx"
LOG_FILES = glob.glob(os.path.join(LOG_DIR, "access.log*"))

# Regex to parse nginx common log format
# format: $remote_addr - $remote_user [$time_local] "$request" $status $body_bytes_sent "$http_referer" "$http_user_agent"
log_pattern = re.compile(
    r'(?P<ip>\S+) \S+ \S+ \[(?P<time>[^\]]+)\] "(?P<request>[^"]*)" (?P<status>\d+) (?P<size>\S+) "(?P<referer>[^"]*)" "(?P<ua>[^"]*)"'
)

# AI bots list to match (lowercase)
AI_BOTS_KEYWORDS = [
    "chatgpt", "gptbot", "oai-searchbot", "claudebot", "claude-web", "claude-searchbot", 
    "anthropic", "perplexitybot", "perplexity-user", "bytespider", "ccbot", "cohere", 
    "amazonbot", "amzn-searchbot", "youbot", "diffbot", "meta-externalagent", 
    "meta-webindexer", "timpibot", "duckassistbot", "applebot"
]

def parse_date(time_str):
    # format: 27/May/2026:00:02:18 +0200
    try:
        dt_str = time_str.split()[0]
        dt = datetime.strptime(dt_str, "%d/%b/%Y:%H:%M:%S")
        return dt.strftime("%Y-%m-%d")
    except Exception:
        return "Unknown"

def get_bot_type(ua):
    ua_lower = ua.lower()
    if "tollbot" in ua_lower:
        return "Tollbit Crawler"
    
    for bot in AI_BOTS_KEYWORDS:
        if bot in ua_lower:
            return bot
    return None

def analyze_logs():
    daily_stats = defaultdict(lambda: {
        "redirects": 0,
        "fetches": 0,
        "bot_breakdown": Counter(),
        "top_pages": Counter()
    })
    
    # Sort files so we process them chronologically
    sorted_files = sorted(LOG_FILES, key=os.path.getmtime)
    
    for file_path in sorted_files:
        print(f"Processing {file_path}...")
        is_gzip = file_path.endswith(".gz")
        open_func = gzip.open if is_gzip else open
        mode = "rt" if is_gzip else "r"
        
        try:
            with open_func(file_path, mode, encoding="utf-8", errors="ignore") as f:
                for line in f:
                    match = log_pattern.match(line)
                    if not match:
                        continue
                    
                    data = match.groupdict()
                    ua = data["ua"]
                    bot_type = get_bot_type(ua)
                    
                    if not bot_type:
                        continue
                    
                    date_str = parse_date(data["time"])
                    status = data["status"]
                    request = data["request"]
                    
                    # Extract path from request (e.g. "GET /path HTTP/1.1")
                    req_parts = request.split()
                    path = req_parts[1] if len(req_parts) > 1 else request
                    
                    if bot_type == "Tollbit Crawler":
                        # Tollbit fetching the content
                        daily_stats[date_str]["fetches"] += 1
                    else:
                        # This is a bot request that we redirect or rewrite to Tollbit
                        # We count all hits from these bots to the main site
                        daily_stats[date_str]["redirects"] += 1
                        daily_stats[date_str]["bot_breakdown"][bot_type] += 1
                        daily_stats[date_str]["top_pages"][path] += 1
        except Exception as e:
            print(f"Error reading {file_path}: {e}")

    # Output stats
    print("\n" + "="*50)
    print("TOLLBIT REDIRECTS & CRAWLER FETCHES SCOREBOARD")
    print("="*50)
    
    sorted_dates = sorted(daily_stats.keys())
    for date in sorted_dates:
        stats = daily_stats[date]
        print(f"\nDate: {date}")
        print(f"  Tollbit Redirects (AI Bots forwarded): {stats['redirects']:,}")
        print(f"  Tollbit Crawler Fetches (Paid crawls): {stats['fetches']:,}")
        
        if stats['redirects'] > 0:
            print("  Top Bots redirected:")
            for bot, count in stats['bot_breakdown'].most_common(5):
                print(f"    - {bot}: {count:,}")
            
            print("  Top Pages requested by bots:")
            for path, count in stats['top_pages'].most_common(3):
                print(f"    - {path}: {count:,}")

if __name__ == "__main__":
    analyze_logs()
