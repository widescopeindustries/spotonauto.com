import glob, gzip, re
from datetime import datetime
from collections import defaultdict

log_pattern = re.compile(
    r'(?P<ip>\S+) \S+ \S+ \[(?P<time>[^\]]+)\] "(?P<request>[^"]*)" (?P<status>\d+) (?P<size>\S+)'
)

hourly_stats = defaultdict(lambda: {"200": 0, "redirects": 0, "other": 0})

for f_path in glob.glob("/var/log/nginx/access.log*"):
    is_gz = f_path.endswith(".gz")
    open_func = gzip.open if is_gz else open
    mode = "rt" if is_gz else "r"
    try:
        with open_func(f_path, mode, encoding="utf-8", errors="ignore") as f:
            for line in f:
                if "tollbot" in line.lower():
                    m = log_pattern.match(line)
                    if m:
                        data = m.groupdict()
                        status = data["status"]
                        time_str = data["time"].split()[0]
                        dt = datetime.strptime(time_str, "%d/%b/%Y:%H:%M:%S")
                        
                        hour_str = dt.strftime("%Y-%m-%d %H:00")
                        
                        if status == "200":
                            hourly_stats[hour_str]["200"] += 1
                        elif status in ("301", "302", "307", "308"):
                            hourly_stats[hour_str]["redirects"] += 1
                        else:
                            hourly_stats[hour_str]["other"] += 1
    except Exception as e:
        pass

for hour_str in sorted(hourly_stats.keys()):
    stats = hourly_stats[hour_str]
    total = stats["200"] + stats["redirects"] + stats["other"]
    print(f"{hour_str} -> 200 OK: {stats['200']:,} | Redirects: {stats['redirects']:,} | Total: {total:,}")
