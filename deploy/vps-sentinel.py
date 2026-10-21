#!/usr/bin/env python3
"""
VPS Sentinel — Automated Health Watchdog & Maintenance System
Handles:
  1. Lightweight Watchdog (--watchdog, runs every 15 min):
     - Checks all listening ports, systemd services, and LMDB backend.
     - Auto-restarts any crashed service immediately.
     - Does not restart an active service merely because a saturated TCP accept
       queue delays a single connection probe.
     - Monitors root disk space (triggers auto-purge if > 80%).
     - Detects and kills runaway Postgres queries (> 15 minutes).
  2. Deep Maintenance Audit (--deep, runs daily at 3:00 AM):
     - Vacuums systemd journal logs to 1GB.
     - Cleans stale Next.js build caches across all web projects.
     - Audits SSL expiration dates across all Let's Encrypt certs.
     - Aggregates last 24h traffic, bot volume, and HTTP status codes.
     - Writes status to /var/log/vps-health-status.json.
"""

import sys, os, time, json, socket, subprocess, re
from datetime import datetime
from collections import Counter

LOG_FILE = "/var/log/vps-sentinel.log"
STATUS_JSON = "/var/log/vps-health-status.json"

SERVICES = [
    {"name": "nginx", "port": 80, "type": "system"},
    {"name": "postgresql@16-main", "port": 5432, "type": "db"},
    {"name": "alloemmanuals-web", "port": 3002, "type": "app"},
    {"name": "aialwaysanswer-web", "port": 3004, "type": "app"},
    {"name": "solarinstallerstx-web", "port": 3005, "type": "app"},
    {"name": "fixsepticnow-web", "port": 3006, "type": "app"},
    {"name": "easttexasstump-web", "port": 3007, "type": "app"},
    {"name": "allhvacspecs-web", "port": 3008, "type": "app"},
    {"name": "alloemmanuals-content-worker", "port": None, "type": "worker"},
]

def log(msg):
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line)
    try:
        with open(LOG_FILE, "a") as f:
            f.write(line + "\n")
    except:
        pass

def check_port(port, host="127.0.0.1", timeout=2.0):
    if not port:
        return True
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(timeout)
    try:
        s.connect((host, port))
        s.close()
        return True
    except:
        return False

def port_is_listening(port):
    """Confirm the kernel still has a listening socket for the service.

    A busy application can time out a short connect probe even though its
    process and listening socket are healthy. Treat that condition as degraded
    rather than restarting a live service and dropping in-flight requests.
    """
    if not port:
        return True
    try:
        result = subprocess.run(
            ["ss", "-H", "-ltn", "sport", "=", f":{port}"],
            capture_output=True,
            text=True,
            timeout=5,
        )
        return result.returncode == 0 and bool(result.stdout.strip())
    except (OSError, subprocess.SubprocessError):
        return False

def run_watchdog():
    log("WATCHDOG: Starting 15-minute heartbeat check...")
    issues = []
    
    # 1. Check services
    for svc in SERVICES:
        name = svc["name"]
        port = svc["port"]
        
        res = subprocess.run(["systemctl", "is-active", name], capture_output=True, text=True)
        is_active = res.stdout.strip() == "active"
        port_connectable = check_port(port) if port else True
        port_listening = port_is_listening(port) if port else True
        port_ok = port_connectable or port_listening

        if is_active and port and not port_connectable and port_listening:
            log(
                f"WARNING: {name} port {port} connect probe timed out, "
                "but the socket is still listening; restart suppressed"
            )
        
        if not is_active or not port_ok:
            issue_msg = (
                f"SERVICE DOWN: {name} (active={is_active}, "
                f"port_{port}_connectable={port_connectable}, "
                f"port_{port}_listening={port_listening})"
            )
            log(f"⚠️ {issue_msg}. Attempting restart...")
            subprocess.run(["systemctl", "restart", name], capture_output=True)
            time.sleep(2)
            res2 = subprocess.run(["systemctl", "is-active", name], capture_output=True, text=True)
            if res2.stdout.strip() == "active":
                log(f"✅ Successfully auto-recovered {name}")
            else:
                log(f"❌ Failed to restart {name}")
                issues.append(issue_msg)

    # 2. Check LMDB
    lmdb_ok = check_port(8080)
    if not lmdb_ok:
        log("⚠️ LMDB backend (port 8080) unreachable!")
        issues.append("LMDB port 8080 down")
        
    # 3. Check Disk Usage
    st = os.statvfs("/")
    free_gb = (st.f_bavail * st.f_frsize) / (1024**3)
    total_gb = (st.f_blocks * st.f_frsize) / (1024**3)
    pct_used = ((total_gb - free_gb) / total_gb) * 100
    
    if pct_used > 80.0 or free_gb < 15.0:
        log(f"🚨 DISK SPACE WARNING: {pct_used:.1f}% used ({free_gb:.1f} GB free). Triggering auto-purge...")
        subprocess.run(["journalctl", "--vacuum-size=500M"], capture_output=True)
        subprocess.run(["rm", "-rf", "/root/spotonauto.com/.next/cache"], capture_output=True)
        subprocess.run(["truncate", "-s", "0", "/var/log/syslog.1"], capture_output=True)
        issues.append(f"Disk high: {pct_used:.1f}%")

    # 4. Check Runaway Postgres Queries (> 10 minutes)
    try:
        psql_cmd = [
            "su", "-", "postgres", "-c",
            "psql -d spotonauto -t -A -c \"SELECT pid, extract(epoch from (clock_timestamp() - query_start)) FROM pg_stat_activity WHERE state != idle AND pid != pg_backend_pid();\""
        ]
        res = subprocess.run(psql_cmd, capture_output=True, text=True)
        for line in res.stdout.strip().splitlines():
            if "|" in line:
                pid, elapsed = line.split("|", 1)
                try:
                    if float(elapsed) > 600.0:  # > 10 minutes
                        log(f"⚠️ Terminating runaway Postgres query on PID {pid} (running for {int(float(elapsed))}s)...")
                        subprocess.run(["su", "-", "postgres", "-c", f"psql -d spotonauto -c \"SELECT pg_terminate_backend({pid});\""], capture_output=True)
                except:
                    pass
    except Exception as e:
        log(f"Postgres query check error: {e}")

    if not issues:
        log("WATCHDOG: All services healthy, ports responding, disk healthy.")
    else:
        log(f"WATCHDOG: Completed with {len(issues)} alert(s): " + ", ".join(issues))

def run_deep_audit():
    log("DEEP AUDIT: Starting daily maintenance & traffic audit...")
    
    # 1. Vacuum Journals & Cache
    subprocess.run(["journalctl", "--vacuum-size=1G"], capture_output=True)
    subprocess.run(["rm", "-rf", "/root/spotonauto.com/.next/cache"], capture_output=True)
    subprocess.run(["docker", "system", "prune", "-f"], capture_output=True)
    
    # 2. Check SSL Expirations
    ssl_status = {}
    try:
        res = subprocess.run(["certbot", "certificates"], capture_output=True, text=True)
        certs = re.findall(r"Certificate Name: ([\w\.\-]+)\s+.*?\s+Expiry Date: ([\d\-]+ \d+:\d+:\d+).*?VALID: (\d+) days", res.stdout, re.DOTALL)
        for name, exp, days in certs:
            days_left = int(days)
            ssl_status[name] = {"expiry": exp, "days_left": days_left}
            if days_left < 15:
                log(f"⚠️ SSL CERT ALERT: {name} expires in {days_left} days! Triggering renewal...")
                subprocess.run(["certbot", "renew", "--cert-name", name, "--non-interactive"], capture_output=True)
    except Exception as e:
        log(f"SSL check error: {e}")

    # 3. Aggregate Last 24h Traffic from access.log
    traffic = {
        "total_requests": 0,
        "status_codes": {},
        "top_sites": {},
        "bots": {}
    }
    status_counts = Counter()
    site_counts = Counter()
    bot_counts = Counter()
    
    log_file = "/var/log/nginx/access.log"
    if os.path.exists(log_file):
        try:
            with open(log_file, "r", errors="ignore") as f:
                for line in f:
                    traffic["total_requests"] += 1
                    parts = line.split()
                    if len(parts) >= 9:
                        status_counts[parts[8]] += 1
                        url = parts[6]
                        line_lower = line.lower()
                        
                        matched_site = None
                        # Check host if vhost_combined format is present
                        m_host = re.search(r'"([^"]+)"\s*$', line)
                        if m_host:
                            h = m_host.group(1).lower().strip().replace("www.", "")
                            if any(d in h for d in ["allhvacspecs", "alloemmanuals", "whattypeofoil", "whattiresfitmy", "whatwipersfitmy", "whatbulbfitsmy", "solarinstallerstx", "fixsepticnow", "aialwaysanswer", "easttexasstump", "richlandstump", "richlandchamberscabin"]):
                                matched_site = h

                        if not matched_site:
                            if "allhvacspecs" in line_lower or any(url.lower().startswith(b) for b in ['/carrier', '/bryant', '/payne', '/goodman', '/amana', '/daikin', '/janitrol']):
                                matched_site = "allhvacspecs.com"
                            elif url.startswith("/manual/") or url.startswith("/vehicles/") or url.startswith("/repair/") or "alloemmanuals" in line_lower:
                                matched_site = "alloemmanuals.com"
                            elif "whattiresfitmy" in line_lower or url.startswith("/tire"):
                                matched_site = "whattiresfitmy.com"
                            elif "whattypeofoil" in line_lower or url.startswith("/oil"):
                                matched_site = "whattypeofoil.com"
                            elif "whatwipersfitmy" in line_lower or url.startswith("/wiper"):
                                matched_site = "whatwipersfitmy.com"
                            elif "whatbulbfitsmy" in line_lower or url.startswith("/bulb"):
                                matched_site = "whatbulbfitsmy.com"
                            elif "solarinstallerstx" in line_lower or url.startswith("/solar"):
                                matched_site = "solarinstallerstx.com"
                            elif "fixsepticnow" in line_lower or url.startswith("/septic"):
                                matched_site = "fixsepticnow.com"
                            elif "aialwaysanswer" in line_lower or url.startswith("/receptionist"):
                                matched_site = "aialwaysanswer.com"
                            elif "easttexasstump" in line_lower or "richlandstump" in line_lower or url.startswith("/stump"):
                                matched_site = "easttexasstump.com"
                            elif "richlandchamberscabin" in line_lower:
                                matched_site = "richlandchamberscabin.com"

                        if matched_site:
                            site_counts[matched_site] += 1
                            
                        if "bingbot" in line_lower:
                            bot_counts["Bing / Copilot"] += 1
                        elif "gptbot" in line_lower:
                            bot_counts["OpenAI GPTBot"] += 1
                        elif "googlebot" in line_lower:
                            bot_counts["Googlebot"] += 1
                        elif "amazonbot" in line_lower:
                            bot_counts["Amazonbot"] += 1
                        elif "ahrefs" in line_lower:
                            bot_counts["Ahrefs"] += 1
                        elif "semrush" in line_lower:
                            bot_counts["Semrush"] += 1
        except Exception as e:
            log(f"Access log parse error: {e}")

    traffic["status_codes"] = dict(status_counts.most_common(5))
    traffic["top_sites"] = dict(site_counts.most_common(8))
    traffic["bots"] = dict(bot_counts.most_common(6))
    
    # 4. Save Status JSON
    st = os.statvfs("/")
    free_gb = (st.f_bavail * st.f_frsize) / (1024**3)
    total_gb = (st.f_blocks * st.f_frsize) / (1024**3)
    
    report = {
        "timestamp": datetime.now().isoformat(),
        "disk": {
            "total_gb": round(total_gb, 1),
            "free_gb": round(free_gb, 1),
            "percent_used": round(((total_gb - free_gb) / total_gb) * 100, 1)
        },
        "ssl_certificates": ssl_status,
        "traffic_snapshot": traffic
    }
    
    try:
        with open(STATUS_JSON, "w") as f:
            json.dump(report, f, indent=2)
        log("DEEP AUDIT: Completed successfully. Status saved to /var/log/vps-health-status.json")
    except Exception as e:
        log(f"Status save error: {e}")

if __name__ == "__main__":
    if "--deep" in sys.argv:
        run_deep_audit()
    else:
        run_watchdog()
