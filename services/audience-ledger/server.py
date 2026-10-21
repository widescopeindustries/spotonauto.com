#!/usr/bin/env python3
"""Independent, best-effort audience evidence ledger. Never a human verifier."""
import base64
import datetime as dt
import hmac
import html
import json
import os
import re
import sqlite3
import threading
import time
import uuid
from contextlib import contextmanager
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlsplit, unquote
from zoneinfo import ZoneInfo

ET = ZoneInfo('America/New_York')
BOT = re.compile(r'bot|crawler|spider|scraper|headless|puppeteer|selenium|playwright|lighthouse|phantomjs', re.I)
RETAILERS = {'amazon.com', 'amzn.to', 'partsgeek.com', 'tirerack.com', 'advanceautoparts.com', 'autozone.com', 'oreillyauto.com', 'walmart.com', 'ebay.com', 'rockauto.com', 'homedepot.com', 'lowes.com', 'topdon.us'}
SCHEMA = '''CREATE TABLE IF NOT EXISTS events (
event_id TEXT PRIMARY KEY, received REAL NOT NULL, run_id TEXT NOT NULL,
view_id TEXT NOT NULL, type TEXT NOT NULL, pathname TEXT NOT NULL, nav TEXT,
visible_ms INTEGER NOT NULL, interactions INTEGER NOT NULL, webdriver INTEGER NOT NULL,
bot_declared INTEGER NOT NULL, country TEXT NOT NULL, device TEXT NOT NULL,
consent TEXT NOT NULL, dest_host TEXT, affiliate_tag TEXT, mv_loaded INTEGER NOT NULL,
ad_kind TEXT, unit TEXT);
CREATE INDEX IF NOT EXISTS events_received ON events(received);
CREATE INDEX IF NOT EXISTS events_view ON events(view_id);
CREATE UNIQUE INDEX IF NOT EXISTS events_page_anchor ON events(view_id) WHERE type='page';
CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY,value TEXT NOT NULL);'''

def utc_iso(value):
    return dt.datetime.fromtimestamp(value, dt.timezone.utc).isoformat()

def country(headers):
    value = headers.get('CF-IPCountry', '').upper()
    return value if re.fullmatch('[A-Z]{2}', value) and value not in {'XX', 'T1'} else 'unknown'

def opted_out(headers):
    return headers.get('Sec-GPC') == '1' or headers.get('DNT') == '1'

def policy(headers):
    code = country(headers)
    return {'version': 1, 'country': code, 'regional_aggregate_allowed': code == 'US' and not opted_out(headers),
            'requires_publisher_consent': code != 'US', 'opted_out': opted_out(headers)}

def safe_path(value):
    if not isinstance(value, str) or len(value) > 1000:
        raise ValueError('invalid pathname')
    value = value.split('?', 1)[0].split('#', 1)[0]
    decoded = unquote(value)
    if (not value.startswith('/') or value.startswith('//') or '\\' in decoded
            or re.search(r'[\x00-\x1f\x7f@]', decoded)
            or re.search(r'/(?:account|login|signin|checkout|reset|verify|auth|api)(?:/|$)', decoded, re.I)
            or re.search(r'\b[A-HJ-NPR-Z0-9]{17}\b', decoded, re.I)):
        raise ValueError('private or invalid pathname')
    return value

def valid_uuid(value):
    if not isinstance(value, str) or len(value) != 36:
        raise ValueError('invalid event identity')
    return str(uuid.UUID(value))

def integer(value, maximum):
    if type(value) is not int or not 0 <= value <= maximum:
        raise ValueError('invalid numeric field')
    return value

def validate(event):
    if not isinstance(event, dict) or type(event.get('v')) is not int or event.get('v') != 1:
        raise ValueError('invalid version')
    allowed = {'v', 'event_id', 'run_id', 'view_id', 'type', 'pathname', 'nav', 'visible_ms', 'interactions', 'webdriver', 'dest_host', 'affiliate_tag', 'mv_loaded', 'ad_kind', 'unit'}
    if set(event) - allowed:
        raise ValueError('unknown fields')
    result = {key: valid_uuid(event.get(key)) for key in ('event_id', 'run_id', 'view_id')}
    kind = event.get('type')
    if kind not in {'page', 'evidence', 'affiliate', 'ad'}:
        raise ValueError('invalid event type')
    result.update(type=kind, pathname=safe_path(event.get('pathname')))
    nav = event.get('nav')
    if nav is not None and nav not in {'initial', 'spa', 'restore'}:
        raise ValueError('invalid navigation')
    result['nav'] = nav
    result['visible_ms'] = integer(event.get('visible_ms', 0), 3600000)
    result['interactions'] = integer(event.get('interactions', 0), 15)
    for key in ('webdriver', 'mv_loaded'):
        if type(event.get(key, False)) is not bool:
            raise ValueError('invalid boolean')
        result[key] = int(event.get(key, False))
    host = event.get('dest_host')
    if host is not None and host not in RETAILERS:
        raise ValueError('invalid retailer')
    tag = event.get('affiliate_tag')
    if tag is not None and (not isinstance(tag, str) or not re.fullmatch(r'[A-Za-z0-9_-]{1,80}', tag)):
        raise ValueError('invalid affiliate tag')
    ad_kind = event.get('ad_kind')
    if ad_kind is not None and ad_kind not in {'requested', 'rendered', 'viewable'}:
        raise ValueError('invalid ad kind')
    unit = event.get('unit')
    if unit is not None and unit != 'mediavine':
        raise ValueError('invalid ad unit')
    if kind == 'ad' and (not ad_kind or not unit):
        raise ValueError('missing ad evidence')
    if kind == 'affiliate' and not host:
        raise ValueError('missing retailer')
    result.update(dest_host=host, affiliate_tag=tag, ad_kind=ad_kind, unit=unit)
    return result

class Ledger:
    def __init__(self, path):
        self.path = path
        self.lock = threading.Lock()
        self.last_cleanup = 0
        with self.connection() as db:
            db.executescript(SCHEMA)
            db.execute('INSERT OR IGNORE INTO metadata VALUES (?,?)', ('started', utc_iso(time.time())))
        self.cleanup()

    @contextmanager
    def connection(self):
        db = sqlite3.connect(self.path, timeout=0.25)
        try:
            db.execute('PRAGMA journal_mode=WAL')
            db.execute('PRAGMA busy_timeout=250')
            with db:
                yield db
        finally:
            db.close()

    def cleanup(self):
        now = time.time()
        if now - self.last_cleanup < 3600:
            return
        with self.lock:
            if now - self.last_cleanup < 3600:
                return
            with self.connection() as db:
                db.execute('DELETE FROM events WHERE event_id IN (SELECT event_id FROM events WHERE received < ? LIMIT 100000)', (now - 30 * 86400,))
            self.last_cleanup = now

    def insert(self, events, headers, consent):
        now = time.time()
        ua = headers.get('User-Agent', '')[:1024]
        bot = int(bool(BOT.search(ua)))
        device = 'mobile' if re.search('Mobile|Android|iPhone|iPad', ua, re.I) else ('desktop' if re.search('Windows|Macintosh|Linux|Chrome|Firefox|Safari', ua, re.I) else 'unknown')
        fields = ['event_id', 'received', 'run_id', 'view_id', 'type', 'pathname', 'nav', 'visible_ms', 'interactions', 'webdriver', 'bot_declared', 'country', 'device', 'consent', 'dest_host', 'affiliate_tag', 'mv_loaded', 'ad_kind', 'unit']
        with self.connection() as db:
            for event in events:
                event = dict(event, received=now, bot_declared=bot, country=country(headers), device=device, consent=consent)
                db.execute('INSERT OR IGNORE INTO events (' + ','.join(fields) + ') VALUES (' + ','.join('?' for _ in fields) + ')', [event[key] for key in fields])
        self.cleanup()

    def report(self, start, end):
        low = dt.datetime.combine(start, dt.time.min, ET).timestamp()
        high = dt.datetime.combine(end + dt.timedelta(days=1), dt.time.min, ET).timestamp()
        # Page anchors prevent evidence-only or spoofed event IDs from inflating page counts.
        # Evidence can arrive first; later page anchors join it regardless of receipt order.
        sql = '''WITH views AS (SELECT p.view_id,p.run_id,p.pathname,p.received,p.country,p.device,
          MAX(e.visible_ms) visible_ms,MAX(e.interactions) interactions,MAX(e.webdriver OR e.bot_declared) automated,
          SUM(e.type='affiliate') affiliate,SUM(e.type='ad' AND e.ad_kind='requested') requested,
          SUM(e.type='ad' AND e.ad_kind='rendered') rendered,SUM(e.type='ad' AND e.ad_kind='viewable') viewable
          FROM (SELECT view_id,run_id,pathname,MIN(received) received,country,device FROM events
            WHERE type='page' GROUP BY view_id,run_id,pathname) p
          JOIN events e ON e.view_id=p.view_id AND e.run_id=p.run_id AND e.pathname=p.pathname
          WHERE p.received>=? AND p.received<? GROUP BY p.view_id,p.run_id,p.pathname),
          classified AS (SELECT *,COUNT(*) OVER (PARTITION BY run_id,CAST(received/3600 AS INTEGER)) hourly_views FROM views) '''
        with self.connection() as db:
            db.create_function('et_day',1,lambda stamp:dt.datetime.fromtimestamp(stamp,ET).date().isoformat())
            row = db.execute(sql + '''SELECT COUNT(*),COUNT(DISTINCT run_id),
              COALESCE(SUM(NOT automated AND visible_ms>=10000 AND interactions>0),0),
              COALESCE(SUM(NOT automated AND (visible_ms<10000 OR interactions=0)),0),
              COALESCE(SUM(automated),0),COALESCE(SUM(hourly_views>120),0),
              COALESCE(SUM(affiliate),0),COALESCE(SUM(requested),0),COALESCE(SUM(rendered),0),COALESCE(SUM(viewable),0)
              FROM classified''',(low,high)).fetchone()
            daily_rows = db.execute(sql+'''SELECT et_day(received),COUNT(*),
              SUM(NOT automated AND visible_ms>=10000 AND interactions>0),
              SUM(NOT automated AND (visible_ms<10000 OR interactions=0)),SUM(automated),
              SUM(hourly_views>120),SUM(affiliate) FROM classified GROUP BY et_day(received) ORDER BY et_day(received)''',(low,high)).fetchall()
            daily = {row[0]:row[1] for row in daily_rows}
            daily_details = [dict(zip(('date','pageviews','human_consistent_views','browser_unconfirmed_views','automation_indicated_views','suspect_high_rate_views','affiliate_clicks'),row)) for row in daily_rows]
            countries = dict(db.execute(sql+'SELECT country,COUNT(*) FROM classified GROUP BY country',(low,high)))
            affiliate_rows = db.execute('''SELECT e.dest_host,COALESCE(e.affiliate_tag,''),COUNT(*)
              FROM events e JOIN events p ON p.type='page' AND p.view_id=e.view_id
                AND p.run_id=e.run_id AND p.pathname=e.pathname
              WHERE e.type='affiliate' AND p.received>=? AND p.received<?
              GROUP BY e.dest_host,COALESCE(e.affiliate_tag,'') ORDER BY COUNT(*) DESC''',(low,high)).fetchall()
            started = db.execute("SELECT value FROM metadata WHERE key='started'").fetchone()[0]
        keys = ('pageviews','browser_runs','human_consistent_views','browser_unconfirmed_views','automation_indicated_views',
                'suspect_high_rate_views','affiliate_clicks','observed_ad_requested','observed_ad_rendered','observed_ad_viewable')
        totals = dict(zip(keys,row))
        return {'version': 1, 'timezone': 'America/New_York', 'start': str(start), 'end': str(end), 'collection_started': started,
                'totals': totals, 'daily_pageviews': daily, 'daily': daily_details, 'countries': countries,
                'affiliate_totals': [dict(zip(('dest_host','affiliate_tag','clicks'),row)) for row in affiliate_rows],
                'limitations': 'Consent-restricted observed browser cohort: regional anonymous collection is US-only; other countries require publisher-purpose consent. DNT/GPC visitors are excluded. Runs are document-lifetime random IDs, not people or sessions. Human-consistent evidence is not proof. Header context is not verified identity. Ad counters observe each slot once per page; refreshes are excluded by the client. They are not billable impressions. Analytics blocking and unobserved traffic remain outside these totals.'}

class Handler(BaseHTTPRequestHandler):
    server_version = 'AudienceLedger/1'
    def log_message(self, *_args):
        pass  # No addresses, URLs, authorization or payloads in service logs.

    def respond(self, status, payload=None, content_type='application/json'):
        data = b'' if payload is None else (json.dumps(payload).encode() if content_type == 'application/json' else payload.encode())
        self.send_response(status)
        self.send_header('Content-Type', content_type + '; charset=utf-8')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-Robots-Tag', 'noindex, nofollow')
        self.send_header('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'")
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        if data:
            self.wfile.write(data)

    def authorized(self):
        password = self.server.admin_password
        if not password:
            self.respond(503, {'error': 'reporting unavailable'})
            return False
        expected = 'Basic ' + base64.b64encode(('lyndon:' + password).encode()).decode()
        if not hmac.compare_digest(self.headers.get('Authorization', '').encode('utf-8'), expected.encode('utf-8')):
            self.send_response(401)
            self.send_header('WWW-Authenticate', 'Basic realm="Private audience report"')
            self.send_header('Cache-Control', 'no-store')
            self.send_header('Content-Length', '0')
            self.end_headers()
            return False
        return True

    def do_GET(self):
        path = urlsplit(self.path)
        if path.path == '/_audience/policy':
            return self.respond(200, policy(self.headers))
        if path.path == '/_audience/health':
            return self.respond(200, {'ok': True, 'version': 1})
        if path.path not in {'/_audience/report', '/_audience/dashboard'}:
            return self.respond(404)
        if not self.authorized():
            return
        try:
            params = parse_qs(path.query)
            today = dt.datetime.now(ET).date()
            days = int(params.get('days', ['7'])[0])
            if not 1 <= days <= 31:
                raise ValueError()
            start = dt.date.fromisoformat(params['start'][0]) if 'start' in params else today-dt.timedelta(days=days-1)
            end = dt.date.fromisoformat(params['end'][0]) if 'end' in params else today
            if not 0 <= (end-start).days <= 30:
                raise ValueError()
            result = self.server.ledger.report(start, end)
        except (ValueError, OverflowError):
            return self.respond(400, {'error': 'invalid date range; maximum 31 days'})
        except sqlite3.Error:
            return self.respond(503, {'error': 'report temporarily unavailable'})
        if path.path.endswith('/report'):
            return self.respond(200, result)
        cells = ''.join('<tr><td>'+html.escape(key.replace('_',' '))+'</td><td>'+str(value)+'</td></tr>' for key,value in result['totals'].items())
        daily_cells = ''.join('<tr>'+''.join('<td>'+html.escape(str(row[key]))+'</td>' for key in ('date','pageviews','human_consistent_views','browser_unconfirmed_views','automation_indicated_views','suspect_high_rate_views','affiliate_clicks'))+'</tr>' for row in result['daily'])
        affiliate_cells = ''.join('<tr>'+''.join('<td>'+html.escape(str(row[key]) or '(none)')+'</td>' for key in ('dest_host','affiliate_tag','clicks'))+'</tr>' for row in result['affiliate_totals'])
        page = '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Private audience ledger</title><style>body{font:17px system-ui;max-width:850px;margin:40px auto;padding:20px;color:#17202a}td{padding:8px 20px;border-bottom:1px solid #ddd}p{line-height:1.6}</style><h1>Audience evidence ledger</h1><p>'+html.escape(str(start)+' through '+str(end)+' · Eastern Time')+'</p><p>Collection started: '+html.escape(result['collection_started'])+'</p><table>'+cells+'</table><p>'+html.escape(result['limitations'])+'</p><p>Zero means no qualifying observations received in this interval. It is not a claim of zero visitors.</p><p><a href="?days=1">Today</a> · <a href="?days=7">7 days</a> · <a href="?days=30">30 days</a></p></html>'
        page = page.replace('</html>','<h2>Daily observations</h2><div style="overflow:auto"><table><tr><th>Date ET</th><th>Views</th><th>Human consistent</th><th>Unconfirmed</th><th>Automation indicated</th><th>High rate</th><th>Affiliate clicks</th></tr>'+daily_cells+'</table></div><h2>Affiliate receipts</h2><table><tr><th>Retailer host</th><th>Tracking tag</th><th>Clicks</th></tr>'+affiliate_cells+'</table><p>Tags describe affiliate programs, not visitor identifiers.</p></html>')
        return self.respond(200, page, 'text/html')

    def do_POST(self):
        self.close_connection = True  # Rejected payloads must not become another request.
        if urlsplit(self.path).path == '/_audience/policy':
            if self.headers.get('Origin') not in self.server.origins or self.headers.get('Sec-Fetch-Site') == 'cross-site':
                return self.respond(403)
            try:
                length = int(self.headers.get('Content-Length', '0'))
                if not 0 <= length <= 1024 or self.headers.get('Transfer-Encoding'):
                    return self.respond(413)
            except ValueError:
                return self.respond(400)
            # No identity or database activity. POST avoids intermediary GET caching.
            # This connection closes, so the unused tiny request body is not reused.
            return self.respond(200, policy(self.headers))
        if urlsplit(self.path).path != '/_audience/events':
            return self.respond(404)
        if opted_out(self.headers):
            return self.respond(204)
        if self.headers.get('Origin') not in self.server.origins or self.headers.get('Sec-Fetch-Site') == 'cross-site':
            return self.respond(403)
        # This is a collector-local transport limit only. It never affects content or ad requests.
        if not self.server.allow_transport(self.client_address[0]):
            return self.respond(429)
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if not 0 < length <= 12288 or self.headers.get('Transfer-Encoding'):
                return self.respond(413)
            if self.headers.get_content_type() not in {'application/json', 'text/plain'}:
                return self.respond(415)
            self.connection.settimeout(2)
            body = json.loads(self.rfile.read(length))
            if not isinstance(body, dict) or type(body.get('v')) is not int or body.get('v') != 1 or set(body)-{'v','consent','events'}:
                raise ValueError()
            consent = body.get('consent')
            if consent not in {'regional_aggregate', 'publisher_granted'}:
                return self.respond(204)
            if consent == 'regional_aggregate' and country(self.headers) != 'US':
                return self.respond(204)
            events = body.get('events')
            if not isinstance(events, list) or not 1 <= len(events) <= 16:
                raise ValueError()
            events = [validate(event) for event in events]
        except (ValueError, TypeError, KeyError, OSError):
            return self.respond(400, {'error': 'invalid event batch'})
        try:
            self.server.ledger.insert(events, self.headers, consent)
        except sqlite3.Error:
            return self.respond(503, {'error': 'collector temporarily unavailable'})
        return self.respond(204)

class Server(ThreadingHTTPServer):
    daemon_threads = True
    request_queue_size = 32
    def __init__(self, address, ledger, password='', origins=None):
        self.ledger, self.admin_password = ledger, password
        base = os.environ.get('PUBLIC_BASE', 'https://alloemmanuals.com').rstrip('/')
        self.origins = set(origins or [base, 'https://www.alloemmanuals.com'])
        self.origins.update(value.strip().rstrip('/') for value in os.environ.get('AUDIENCE_PREVIEW_ORIGINS','').split(',') if value.strip())
        self.buckets, self.bucket_lock = {}, threading.Lock()
        self.slots = threading.BoundedSemaphore(24)
        super().__init__(address, Handler)

    def process_request(self, request, client_address):
        if not self.slots.acquire(blocking=False):
            request.close()
            return
        try:
            super().process_request(request, client_address)
        except Exception:
            self.slots.release()
            raise

    def process_request_thread(self, request, client_address):
        try:
            request.settimeout(3)
            super().process_request_thread(request, client_address)
        finally:
            self.slots.release()

    def handle_error(self, request, client_address):
        # Do not let the stdlib traceback logger print visitor transport addresses.
        print('Audience collector request failed', flush=True)

    def service_actions(self):
        # serve_forever invokes this even with no requests; the ledger guards hourly work.
        try:
            self.ledger.cleanup()
        except sqlite3.Error:
            print('Audience collector retention maintenance delayed', flush=True)

    def allow_transport(self, address):
        # Forwarded visitor addresses are deliberately ignored. Nginx should also cap
        # this exact collector location globally; localhost is a shared proxy transport.
        now = time.monotonic()
        with self.bucket_lock:
            if len(self.buckets) >= 2048 and address not in self.buckets:
                self.buckets = {key:value for key,value in self.buckets.items() if now-value[1]<2}
                if len(self.buckets)>=2048:
                    return False
            tokens, previous = self.buckets.get(address,(80.0,now))
            tokens = min(80.0, tokens + (now-previous)*20)
            self.buckets[address] = (max(0,tokens-1),now)
            return tokens>=1

if __name__ == '__main__':
    db_path = os.environ.get('AUDIENCE_DB', '/var/lib/audience-ledger/events.sqlite3')
    os.makedirs(os.path.dirname(os.path.abspath(db_path)), exist_ok=True)
    server = Server(('127.0.0.1', int(os.environ.get('AUDIENCE_PORT','3016'))), Ledger(db_path), os.environ.get('AUDIENCE_ADMIN_PASSWORD',''))
    server.serve_forever()
