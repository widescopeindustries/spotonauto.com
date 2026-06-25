#!/usr/bin/env node
/**
 * Daily Metrics CLI for alloemmanuals.com
 *
 * Aggregates traffic, SEO, revenue, performance, bot/AI activity,
 * infrastructure, and affiliate signals into a single daily report.
 *
 * Usage:
 *   node scripts/daily-metrics.mjs           # yesterday (default)
 *   node scripts/daily-metrics.mjs --today   # today so far
 *   node scripts/daily-metrics.mjs 2026-06-23 # specific date
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';
import https from 'https';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const REPORTS_DIR = path.join(PROJECT_ROOT, 'reports');

const VPS_HOST = 'root@116.202.210.109';
const LOG_FILE = '/var/log/nginx/access.log';
const DB_URL = process.env.DATABASE_URL || 'postgresql://spotonauto:spotonauto2026@127.0.0.1:5432/spotonauto';
const CF_ZONE_ID = process.env.CF_ZONE_ID || '39bc783c4300814591558911c805facc';
const CF_EMAIL = process.env.CF_EMAIL;
const CF_KEY = process.env.CF_KEY;
const GA_PROPERTY_ID = '537013586';
const GSC_SITE_URL = 'sc-domain:alloemmanuals.com';
const KEY_PATH = path.join(PROJECT_ROOT, 'credentials', 'google-service-account.json');

const IS_VPS = fs.existsSync(LOG_FILE);

// ─── Helpers ───────────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function dateArg() {
  const explicit = process.argv.find((a) => /^\d{4}-\d{2}-\d{2}$/.test(a));
  if (explicit) return explicit;
  if (process.argv.includes('--today')) return todayStr();
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

function nginxDate(dateStr) {
  const [y, m, d] = dateStr.split('-');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[Number(m) - 1];
  return `${d}/${month}/${y}`;
}

function fmt(n, digits = 0) {
  return Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function fmtBytes(bytes) {
  const gb = bytes / 1024 / 1024 / 1024;
  if (gb >= 1) return `${gb.toFixed(2)} GB`;
  const mb = bytes / 1024 / 1024;
  if (mb >= 1) return `${mb.toFixed(2)} MB`;
  return `${(bytes / 1024).toFixed(2)} KB`;
}

function run(cmd, { maxBuffer = 100 * 1024 * 1024, timeout = 120000 } = {}) {
  const actualCmd = IS_VPS
    ? cmd
    : `ssh -o ConnectTimeout=10 ${VPS_HOST} '${cmd.replace(/'/g, "'\\''")}'`;
  try {
    return execSync(actualCmd, { encoding: 'utf8', maxBuffer, timeout }).trim();
  } catch (err) {
    if (err.stderr) process.stderr.write(err.stderr);
    throw new Error(`Command failed: ${actualCmd.slice(0, 200)}\n${err.message}`);
  }
}

function runSql(sql) {
  return run(`psql "${DB_URL}" -c "${sql.replace(/"/g, '\\"')}"`);
}

// ─── Nginx Log Collector ───────────────────────────────────────────────────

function nginxLogPipe(dateStr) {
  const marker = nginxDate(dateStr);
  const logs = [
    '/var/log/nginx/access.log',
    '/var/log/nginx/access.log.1',
    ...Array.from({ length: 20 }, (_, i) => `/var/log/nginx/access.log.${i + 2}.gz`),
  ].join(' ');
  return `zgrep -h "${marker}" ${logs} 2>/dev/null`;
}

function collectNginx(dateStr) {
  const pipe = nginxLogPipe(dateStr);

  const total = Number(run(`${pipe} | wc -l`));
  if (total === 0) {
    return { total: 0, note: `No nginx log entries found for ${dateStr}` };
  }

  const statusCmd = `${pipe} | awk '{print $9}' | sort | uniq -c | sort -rn`;
  const statusesRaw = run(statusCmd);
  const statuses = {};
  let status200 = 0;
  let status301 = 0;
  let status302 = 0;
  let status307 = 0;
  let status308 = 0;
  let status400 = 0;
  let status403 = 0;
  let status404 = 0;
  let status444 = 0;
  let status499 = 0;
  let status500 = 0;
  let status502 = 0;
  let status503 = 0;
  let status504 = 0;

  for (const line of statusesRaw.split('\n')) {
    const m = line.trim().match(/^(\d+)\s+(.+)$/);
    if (!m) continue;
    const count = Number(m[1]);
    const code = m[2].replace(/"/g, '').trim();
    statuses[code] = (statuses[code] || 0) + count;
    if (code === '200') status200 += count;
    else if (code === '301') status301 += count;
    else if (code === '302') status302 += count;
    else if (code === '307') status307 += count;
    else if (code === '308') status308 += count;
    else if (code === '400') status400 += count;
    else if (code === '403') status403 += count;
    else if (code === '404') status404 += count;
    else if (code === '444') status444 += count;
    else if (code === '499') status499 += count;
    else if (code === '500') status500 += count;
    else if (code === '502') status502 += count;
    else if (code === '503') status503 += count;
    else if (code === '504') status504 += count;
  }

  const bytes = Number(run(`${pipe} | awk '{sum+=$10} END {print sum+0}'`));
  const uniques = Number(run(`${pipe} | awk '{print $1}' | sort -u | wc -l`));

  const top404Cmd = `${pipe} | awk '$9 == "404" {print $7}' | sort | uniq -c | sort -rn | head -10`;
  const top404Raw = run(top404Cmd);
  const top404s = top404Raw.split('\n').filter(Boolean).map((line) => {
    const m = line.trim().match(/^(\d+)\s+(.+)$/);
    return m ? { path: m[2].trim(), count: Number(m[1]) } : null;
  }).filter(Boolean);

  const botPatterns = [
    'meta-external', 'chatgpt-user', 'gptbot', 'oai-searchbot', 'openai',
    'claudebot', 'claude-web', 'anthropic', 'perplexitybot', 'amazonbot',
    'cohere', 'bytespider', 'tollbot', 'grok', 'mistral', 'facebookbot',
    'meta-webindexer', 'meta-externalfetcher', 'applebot-extended',
  ];
  const searchPatterns = ['googlebot', 'bingbot', 'duckduckbot', 'applebot/', 'yandexbot', 'baiduspider'];
  const botPat = botPatterns.join('|');
  const botCmd = `${pipe} | grep -i -E "${botPat}" | wc -l`;
  const botHits = Number(run(botCmd));
  const bot200Cmd = `${pipe} | grep -i -E "${botPat}" | awk '$9 == "200" {sum+=$10; n++} END {print n+0, sum+0}'`;
  const [bot200Count, bot200Bytes] = run(bot200Cmd).split(/\s+/).map(Number);

  const searchCmd = `${pipe} | grep -i -E "${searchPatterns.join('|')}" | wc -l`;
  const searchBotHits = Number(run(searchCmd));

  const paywall402Cmd = `${pipe} | awk '$9 == "402" {print $7}' | wc -l`;
  const paywall402 = Number(run(paywall402Cmd));

  return {
    total,
    uniques,
    bytes,
    status200,
    status301,
    status302,
    status307,
    status308,
    status400,
    status403,
    status404,
    status444,
    status499,
    status500,
    status502,
    status503,
    status504,
    statuses,
    top404s,
    botHits,
    bot200Count,
    bot200Bytes,
    searchBotHits,
    paywall402,
  };
}

// ─── Postgres Collector ────────────────────────────────────────────────────

function collectPostgres() {
  const dbSize = runSql("SELECT pg_size_pretty(pg_database_size(current_database())) AS s;");
  const sizeMb = Number(runSql("SELECT pg_database_size(current_database())/1024/1024 AS s;").split('\n').filter(l => /^\s*\d+/.test(l))[0]?.trim());

  const customers = Number(runSql('SELECT COUNT(*) FROM api_customers;').split('\n').filter(l => /^\s*\d+/.test(l))[0]?.trim());
  const transactions = Number(runSql('SELECT COUNT(*) FROM api_credit_transactions;').split('\n').filter(l => /^\s*\d+/.test(l))[0]?.trim());
  const revenueCentsRaw = runSql("SELECT COALESCE(SUM(amount_cents),0) FROM api_credit_transactions WHERE type IN ('charge','purchase');").split('\n').filter(l => /^\s*\d+/.test(l))[0]?.trim();
  const revenueCents = Number(revenueCentsRaw);

  const todayRevenueCentsRaw = runSql("SELECT COALESCE(SUM(amount_cents),0) FROM api_credit_transactions WHERE type IN ('charge','purchase') AND created_at >= CURRENT_DATE;").split('\n').filter(l => /^\s*\d+/.test(l))[0]?.trim();
  const todayRevenueCents = Number(todayRevenueCentsRaw);

  const manualEmbeddings = Number(runSql('SELECT COUNT(*) FROM manual_embeddings;').split('\n').filter(l => /^\s*\d+/.test(l))[0]?.trim());
  const repairProfiles = Number(runSql('SELECT COUNT(*) FROM vehicle_repair_profiles;').split('\n').filter(l => /^\s*\d+/.test(l))[0]?.trim());

  return {
    dbSizePretty: dbSize.split('\n').find(l => /^\s*\d/.test(l))?.trim() || 'unknown',
    sizeMb,
    apiCustomers: customers,
    apiTransactions: transactions,
    revenueCents,
    revenueDollars: revenueCents / 100,
    todayRevenueCents,
    todayRevenueDollars: todayRevenueCents / 100,
    manualEmbeddings,
    repairProfiles,
  };
}

// ─── Cloudflare Collector ──────────────────────────────────────────────────

function cfGql(query) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query });
    const req = https.request({
      hostname: 'api.cloudflare.com',
      path: '/client/v4/graphql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'X-Auth-Email': CF_EMAIL,
        'X-Auth-Key': CF_KEY,
      },
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } catch (e) { reject(new Error('Invalid JSON: ' + body.slice(0, 200))); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function collectCloudflare(dateStr) {
  if (!CF_EMAIL || !CF_KEY) {
    return { error: 'CF_EMAIL/CF_KEY not set' };
  }

  const query = `{
    viewer {
      zones(filter: { zoneTag: "${CF_ZONE_ID}" }) {
        httpRequests1dGroups(
          limit: 1,
          filter: { date_geq: "${dateStr}", date_leq: "${dateStr}" }
        ) {
          dimensions { date }
          sum { requests pageViews bytes threats cachedBytes }
          uniq { uniques }
        }
      }
    }
  }`;

  const res = await cfGql(query);
  if (res.errors) {
    return { error: JSON.stringify(res.errors) };
  }
  const group = res.data?.viewer?.zones?.[0]?.httpRequests1dGroups?.[0];
  if (!group) return { error: 'No Cloudflare data for date' };

  const s = group.sum;
  const totalBytes = s.bytes || 0;
  const cachedBytes = s.cachedBytes || 0;
  const cacheRatio = totalBytes > 0 ? cachedBytes / totalBytes : 0;

  return {
    requests: s.requests || 0,
    pageViews: s.pageViews || 0,
    bytes: totalBytes,
    threats: s.threats || 0,
    uniques: group.uniq?.uniques || 0,
    cachedBytes,
    uncachedBytes: totalBytes - cachedBytes,
    cacheRatio,
  };
}

// ─── GA4 / GSC Collector ───────────────────────────────────────────────────

async function getGaClient() {
  if (!fs.existsSync(KEY_PATH)) return null;
  const credentials = JSON.parse(fs.readFileSync(KEY_PATH, 'utf8'));
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
  });
  return google.analyticsdata({ version: 'v1beta', auth });
}

async function getGscClient() {
  if (!fs.existsSync(KEY_PATH)) return null;
  const credentials = JSON.parse(fs.readFileSync(KEY_PATH, 'utf8'));
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });
  return google.searchconsole({ version: 'v1', auth });
}

async function collectGa4Gsc(dateStr) {
  const analyticsdata = await getGaClient().catch(() => null);
  const searchconsole = await getGscClient().catch(() => null);

  const out = { ga4: null, gsc: null };

  if (analyticsdata) {
    try {
      const overviewRes = await analyticsdata.properties.runReport({
        property: `properties/${GA_PROPERTY_ID}`,
        requestBody: {
          dateRanges: [{ startDate: dateStr, endDate: dateStr }],
          metrics: [
            { name: 'sessions' },
            { name: 'activeUsers' },
            { name: 'newUsers' },
            { name: 'screenPageViews' },
            { name: 'averageSessionDuration' },
            { name: 'bounceRate' },
          ],
        },
      });
      const row = overviewRes.data.rows?.[0];
      const vals = row?.metricValues;

      const organicRes = await analyticsdata.properties.runReport({
        property: `properties/${GA_PROPERTY_ID}`,
        requestBody: {
          dateRanges: [{ startDate: dateStr, endDate: dateStr }],
          metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
          dimensionFilter: {
            filter: { fieldName: 'sessionMedium', stringFilter: { value: 'organic' } },
          },
        },
      });
      const orgRow = organicRes.data.rows?.[0];

      const eventsRes = await analyticsdata.properties.runReport({
        property: `properties/${GA_PROPERTY_ID}`,
        requestBody: {
          dateRanges: [{ startDate: dateStr, endDate: dateStr }],
          dimensions: [{ name: 'eventName' }],
          metrics: [{ name: 'eventCount' }],
          orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
          limit: 20,
        },
      });

      out.ga4 = {
        sessions: Number(vals?.[0]?.value || 0),
        activeUsers: Number(vals?.[1]?.value || 0),
        newUsers: Number(vals?.[2]?.value || 0),
        pageViews: Number(vals?.[3]?.value || 0),
        avgDurationSec: Math.round(Number(vals?.[4]?.value || 0)),
        bounceRate: Number(vals?.[5]?.value || 0) * 100,
        organicSessions: Number(orgRow?.metricValues?.[0]?.value || 0),
        organicUsers: Number(orgRow?.metricValues?.[1]?.value || 0),
        events: (eventsRes.data.rows || []).map((r) => ({
          event: r.dimensionValues[0].value,
          count: Number(r.metricValues[0].value),
        })),
      };
    } catch (err) {
      out.ga4Error = err.message;
    }
  }

  if (searchconsole) {
    try {
      const dailyRes = await searchconsole.searchanalytics.query({
        siteUrl: GSC_SITE_URL,
        requestBody: { startDate: dateStr, endDate: dateStr, dimensions: ['date'], rowLimit: 1 },
      });
      const daily = dailyRes.data.rows?.[0] || { clicks: 0, impressions: 0, ctr: 0, position: 0 };

      const queriesRes = await searchconsole.searchanalytics.query({
        siteUrl: GSC_SITE_URL,
        requestBody: {
          startDate: dateStr,
          endDate: dateStr,
          dimensions: ['query'],
          rowLimit: 10,
          orderBys: [{ dimension: { dimensionName: 'clicks' }, desc: true }],
        },
      });

      const pagesRes = await searchconsole.searchanalytics.query({
        siteUrl: GSC_SITE_URL,
        requestBody: {
          startDate: dateStr,
          endDate: dateStr,
          dimensions: ['page'],
          rowLimit: 10,
          orderBys: [{ dimension: { dimensionName: 'clicks' }, desc: true }],
        },
      });

      out.gsc = {
        clicks: daily.clicks || 0,
        impressions: daily.impressions || 0,
        ctr: (daily.ctr || 0) * 100,
        position: daily.position || 0,
        topQueries: (queriesRes.data.rows || []).map((r) => ({
          query: r.keys[0],
          clicks: r.clicks,
          impressions: r.impressions,
          ctr: (r.ctr * 100).toFixed(1),
          position: r.position.toFixed(1),
        })),
        topPages: (pagesRes.data.rows || []).map((r) => ({
          page: r.keys[0].replace('https://alloemmanuals.com', ''),
          clicks: r.clicks,
          impressions: r.impressions,
        })),
      };
    } catch (err) {
      out.gscError = err.message;
    }
  }

  return out;
}

// ─── Infrastructure Collector ──────────────────────────────────────────────

function collectInfrastructure() {
  const cacheSize = Number(run('du -sb /var/cache/nginx/alloemmanuals/ 2>/dev/null | cut -f1 || echo 0'));
  const disk = run("df -B1 --output=size,used,avail / | tail -1");
  const [diskTotal, diskUsed, diskFree] = disk.split(/\s+/).map(Number);

  let sslExpiry = null;
  try {
    const expiryStr = run('openssl x509 -in /etc/letsencrypt/live/alloemmanuals.com/fullchain.pem -noout -enddate 2>/dev/null | cut -d= -f2');
    if (expiryStr) {
      const expiry = new Date(expiryStr);
      sslExpiry = expiry.toISOString().slice(0, 10);
    }
  } catch {}

  let serviceStatus = 'unknown';
  try {
    serviceStatus = run('systemctl is-active alloemmanuals-web 2>/dev/null || echo unknown');
  } catch {}

  return { cacheSize, diskTotal, diskUsed, diskFree, sslExpiry, serviceStatus };
}

// ─── Scorecard & Profit Proxy ──────────────────────────────────────────────

const THRESHOLDS = {
  max404Rate: 0.005,          // 0.5% of total requests
  max5xxCount: 0,
  minOrganicCtr: 1.5,         // %
  maxBot200Count: 10000,
  minCacheRatio: 0.30,        // 30%
  minSslDays: 14,
};

function buildScorecard(m) {
  const issues = [];
  const nginx = m.nginx;
  const cf = m.cloudflare;
  const gsc = m.ga4gsc?.gsc;
  const pg = m.postgres;

  const rate404 = nginx.total > 0 ? nginx.status404 / nginx.total : 0;
  const total5xx = (nginx.status500 || 0) + (nginx.status502 || 0) + (nginx.status503 || 0) + (nginx.status504 || 0);

  if (rate404 > THRESHOLDS.max404Rate) {
    issues.push({
      severity: 'high',
      metric: '404 rate',
      value: `${(rate404 * 100).toFixed(2)}%`,
      target: '< 0.5%',
      impact: 'Wasted crawl budget + origin load on broken/non-existent URLs',
    });
  }

  if (total5xx > THRESHOLDS.max5xxCount) {
    issues.push({
      severity: 'high',
      metric: '5xx errors',
      value: total5xx,
      target: '0',
      impact: 'Search engines and users hit broken pages',
    });
  }

  if (gsc && gsc.impressions > 0 && gsc.ctr < THRESHOLDS.minOrganicCtr) {
    issues.push({
      severity: 'medium',
      metric: 'Organic CTR',
      value: `${gsc.ctr.toFixed(2)}%`,
      target: `> ${THRESHOLDS.minOrganicCtr}%`,
      impact: 'Titles/descriptions not compelling enough in search results',
    });
  }

  if (nginx.bot200Count > THRESHOLDS.maxBot200Count) {
    issues.push({
      severity: 'high',
      metric: 'Bot 200 responses',
      value: fmt(nginx.bot200Count),
      target: `< ${fmt(THRESHOLDS.maxBot200Count)}`,
      impact: 'Bandwidth theft by AI scrapers and probes',
    });
  }

  if (cf && cf.cacheRatio < THRESHOLDS.minCacheRatio) {
    issues.push({
      severity: 'medium',
      metric: 'Cloudflare cache ratio',
      value: `${(cf.cacheRatio * 100).toFixed(1)}%`,
      target: `> ${(THRESHOLDS.minCacheRatio * 100).toFixed(0)}%`,
      impact: 'Too many requests hit origin; cache rules or TTL can be tuned',
    });
  }

  if (pg.revenueCents === 0 && nginx.paywall402 > 1000) {
    issues.push({
      severity: 'high',
      metric: 'Unmonetized bot demand',
      value: `${fmt(nginx.paywall402)} 402s`,
      target: '> 0 paying conversions',
      impact: 'High bot demand but $0 AI Training Feed revenue',
    });
  }

  if (m.infrastructure.sslExpiry) {
    const days = Math.ceil((new Date(m.infrastructure.sslExpiry) - new Date()) / (1000 * 60 * 60 * 24));
    if (days < THRESHOLDS.minSslDays) {
      issues.push({
        severity: 'high',
        metric: 'SSL expiry',
        value: `${days} days`,
        target: `> ${THRESHOLDS.minSslDays} days`,
        impact: 'Certificate expires soon; renewal may be broken',
      });
    }
  }

  return { rate404, total5xx, issues };
}

function calculateProfitProxy(m) {
  const gscClicks = m.ga4gsc?.gsc?.clicks || 0;
  const organicSessions = m.ga4gsc?.ga4?.organicSessions || 0;
  const revenueCents = m.postgres.revenueCents;
  const nginx = m.nginx;
  const total5xx = (nginx.status500 || 0) + (nginx.status502 || 0) + (nginx.status503 || 0) + (nginx.status504 || 0);
  const cacheRatio = m.cloudflare?.cacheRatio || 0;

  const score =
    (revenueCents * 10) +
    (gscClicks * 50) +
    (organicSessions * 5) +
    (cacheRatio * 30000) -
    (nginx.status404 * 0.5) -
    (total5xx * 50) -
    (nginx.bot200Count * 0.2);

  return Math.round(score);
}

// ─── Reporting ─────────────────────────────────────────────────────────────

function printReport(m, scorecard, profitProxy) {
  console.log(`\n╔════════════════════════════════════════════════════════════════════════════════════╗`);
  console.log(`║        ALLOEMMANUALS.COM — DAILY METRICS REPORT — ${m.date}         ║`);
  console.log(`╚════════════════════════════════════════════════════════════════════════════════════╝`);
  console.log(`  Generated: ${new Date().toISOString()}`);
  console.log(`  Source: ${IS_VPS ? 'VPS (local logs/DB)' : 'Local repo (SSH to VPS)'}`);

  console.log(`\n=== PROFIT PROXY ===`);
  console.log(`  Score: ${fmt(profitProxy)}`);
  console.log(`  (Revenue*10 + GSC clicks*50 + organic sessions*5 + cacheRatio*30000 - 404s*0.5 - 5xx*50 - bot 200s*0.2)`);

  console.log(`\n=== TRAFFIC (nginx) ===`);
  if (m.nginx.total === 0) {
    console.log(`  ${m.nginx.note || 'No data'}`);
  } else {
    console.log(`  Total requests:   ${fmt(m.nginx.total)}`);
    console.log(`  Unique IPs:       ${fmt(m.nginx.uniques)}`);
    console.log(`  Bandwidth:        ${fmtBytes(m.nginx.bytes)}`);
    console.log(`  200 OK:           ${fmt(m.nginx.status200)} (${((m.nginx.status200 / m.nginx.total) * 100).toFixed(1)}%)`);
    console.log(`  301/302/307/308:  ${fmt(m.nginx.status301 + m.nginx.status302 + m.nginx.status307 + m.nginx.status308)}`);
    console.log(`  400/403:          ${fmt(m.nginx.status400 + m.nginx.status403)}`);
    console.log(`  404 Not Found:    ${fmt(m.nginx.status404)} (${((m.nginx.status404 / m.nginx.total) * 100).toFixed(2)}%)`);
    console.log(`  444 Dropped:      ${fmt(m.nginx.status444)}`);
    console.log(`  499 Client close: ${fmt(m.nginx.status499)}`);
    console.log(`  5xx Errors:       ${fmt(scorecard.total5xx)}`);
    console.log(`  Bot hits:         ${fmt(m.nginx.botHits)}`);
    console.log(`  Search-bot hits:  ${fmt(m.nginx.searchBotHits)}`);
    console.log(`  Bot 200s:         ${fmt(m.nginx.bot200Count)} (${fmtBytes(m.nginx.bot200Bytes)})`);
    console.log(`  Paywall 402s:     ${fmt(m.nginx.paywall402)}`);
  }

  if (m.nginx.top404s?.length) {
    console.log(`\n=== TOP 404 PATHS ===`);
    for (const r of m.nginx.top404s.slice(0, 8)) {
      console.log(`  ${fmt(r.count).padStart(6)}  ${r.path.slice(0, 80)}`);
    }
  }

  if (!m.cloudflare.error) {
    console.log(`\n=== CLOUDFLARE EDGE ===`);
    console.log(`  Requests:         ${fmt(m.cloudflare.requests)}`);
    console.log(`  Page views:       ${fmt(m.cloudflare.pageViews)}`);
    console.log(`  Bandwidth:        ${fmtBytes(m.cloudflare.bytes)}`);
    console.log(`  Cache ratio:      ${(m.cloudflare.cacheRatio * 100).toFixed(1)}%`);
    console.log(`  Threats:          ${fmt(m.cloudflare.threats)}`);
    console.log(`  Uniques:          ${fmt(m.cloudflare.uniques)}`);
  } else {
    console.log(`\n=== CLOUDFLARE EDGE ===`);
    console.log(`  ⚠️  ${m.cloudflare.error}`);
  }

  if (m.ga4gsc?.ga4) {
    const g = m.ga4gsc.ga4;
    console.log(`\n=== GA4 ===`);
    console.log(`  Sessions:         ${fmt(g.sessions)}`);
    console.log(`  Active users:     ${fmt(g.activeUsers)}`);
    console.log(`  New users:        ${fmt(g.newUsers)}`);
    console.log(`  Page views:       ${fmt(g.pageViews)}`);
    console.log(`  Organic sessions: ${fmt(g.organicSessions)}`);
    console.log(`  Avg duration:     ${fmt(g.avgDurationSec)}s`);
    console.log(`  Bounce rate:      ${g.bounceRate.toFixed(1)}%`);
    if (g.events?.length) {
      console.log(`\n  Top events:`);
      for (const e of g.events.slice(0, 8)) {
        console.log(`    ${e.event.padEnd(28)} ${fmt(e.count).padStart(6)}`);
      }
    }
  }

  if (m.ga4gsc?.gsc) {
    const s = m.ga4gsc.gsc;
    console.log(`\n=== GSC ===`);
    console.log(`  Impressions:      ${fmt(s.impressions)}`);
    console.log(`  Clicks:           ${fmt(s.clicks)}`);
    console.log(`  CTR:              ${s.ctr.toFixed(2)}%`);
    console.log(`  Avg position:     ${s.position.toFixed(1)}`);
    if (s.topQueries?.length) {
      console.log(`\n  Top queries:`);
      for (const q of s.topQueries.slice(0, 5)) {
        console.log(`    ${q.clicks} clk | ${q.impressions} imp | ${q.ctr}% CTR | ${q.query.slice(0, 45)}`);
      }
    }
  }

  console.log(`\n=== REVENUE (Postgres) ===`);
  console.log(`  API customers:    ${fmt(m.postgres.apiCustomers)}`);
  console.log(`  Transactions:     ${fmt(m.postgres.apiTransactions)}`);
  console.log(`  Total revenue:    $${m.postgres.revenueDollars.toFixed(2)}`);
  console.log(`  Today revenue:    $${m.postgres.todayRevenueDollars.toFixed(2)}`);

  console.log(`\n=== INFRASTRUCTURE ===`);
  console.log(`  DB size:          ${m.postgres.dbSizePretty}`);
  console.log(`  Manual embeddings:${fmt(m.postgres.manualEmbeddings)}`);
  console.log(`  Repair profiles:  ${fmt(m.postgres.repairProfiles)}`);
  console.log(`  Nginx cache:      ${fmtBytes(m.infrastructure.cacheSize)}`);
  console.log(`  Disk used:        ${fmtBytes(m.infrastructure.diskUsed)} / ${fmtBytes(m.infrastructure.diskTotal)}`);
  console.log(`  SSL expiry:       ${m.infrastructure.sslExpiry || 'unknown'}`);
  console.log(`  Next.js service:  ${m.infrastructure.serviceStatus}`);

  if (scorecard.issues.length) {
    console.log(`\n=== LAGGING METRICS (${scorecard.issues.length}) ===`);
    for (const issue of scorecard.issues.sort((a, b) => (a.severity === 'high' ? -1 : 1))) {
      console.log(`  [${issue.severity.toUpperCase()}] ${issue.metric}: ${issue.value} (target ${issue.target})`);
      console.log(`          → ${issue.impact}`);
    }
  } else {
    console.log(`\n=== LAGGING METRICS ===`);
    console.log(`  No thresholds breached. Site looks healthy.`);
  }

  console.log(`\n${'═'.repeat(84)}\n`);
}

function saveReport(m, scorecard, profitProxy) {
  if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });

  const md = [`# alloemmanuals.com Daily Metrics — ${m.date}`,
    ``,
    `- Generated: ${new Date().toISOString()}`,
    `- Source: ${IS_VPS ? 'VPS (local logs/DB)' : 'Local repo (SSH to VPS)'}`,
    ``,
    `## Profit Proxy`,
    ``,
    `**Score: ${fmt(profitProxy)}**`,
    ``,
    `Formula: Revenue×10 + GSC clicks×50 + organic sessions×5 + cacheRatio×30000 − 404s×0.5 − 5xx×50 − bot 200s×0.2`,
    ``,
    `## Traffic (nginx)`,
    ``,
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Total requests | ${fmt(m.nginx.total)} |`,
    `| Unique IPs | ${fmt(m.nginx.uniques)} |`,
    `| Bandwidth | ${fmtBytes(m.nginx.bytes)} |`,
    `| 200 OK | ${fmt(m.nginx.status200)} (${m.nginx.total ? ((m.nginx.status200 / m.nginx.total) * 100).toFixed(1) : 0}%) |`,
    `| 404 Not Found | ${fmt(m.nginx.status404)} (${m.nginx.total ? ((m.nginx.status404 / m.nginx.total) * 100).toFixed(2) : 0}%) |`,
    `| 444 Dropped | ${fmt(m.nginx.status444)} |`,
    `| 5xx Errors | ${fmt(scorecard.total5xx)} |`,
    `| Bot hits | ${fmt(m.nginx.botHits)} |`,
    `| Search-bot hits | ${fmt(m.nginx.searchBotHits)} |`,
    `| Bot 200s | ${fmt(m.nginx.bot200Count)} (${fmtBytes(m.nginx.bot200Bytes)}) |`,
    `| Paywall 402s | ${fmt(m.nginx.paywall402)} |`,
    ``,
    `### Top 404 paths`,
    ``,
    `| Count | Path |`,
    `|-------|------|`,
    ...(m.nginx.top404s || []).map((r) => `| ${fmt(r.count)} | ${r.path} |`),
    ``,
    `## Cloudflare Edge`,
    ``,
    m.cloudflare.error
      ? `⚠️ ${m.cloudflare.error}`
      : `| Metric | Value |\n|--------|-------|\n| Requests | ${fmt(m.cloudflare.requests)} |\n| Page views | ${fmt(m.cloudflare.pageViews)} |\n| Bandwidth | ${fmtBytes(m.cloudflare.bytes)} |\n| Cache ratio | ${(m.cloudflare.cacheRatio * 100).toFixed(1)}% |\n| Threats | ${fmt(m.cloudflare.threats)} |\n| Uniques | ${fmt(m.cloudflare.uniques)} |`,
    ``,
    `## GA4`,
    ``,
    m.ga4gsc?.ga4
      ? `| Metric | Value |\n|--------|-------|\n| Sessions | ${fmt(m.ga4gsc.ga4.sessions)} |\n| Active users | ${fmt(m.ga4gsc.ga4.activeUsers)} |\n| New users | ${fmt(m.ga4gsc.ga4.newUsers)} |\n| Page views | ${fmt(m.ga4gsc.ga4.pageViews)} |\n| Organic sessions | ${fmt(m.ga4gsc.ga4.organicSessions)} |\n| Avg duration | ${fmt(m.ga4gsc.ga4.avgDurationSec)}s |\n| Bounce rate | ${m.ga4gsc.ga4.bounceRate.toFixed(1)}% |`
      : 'GA4 data unavailable.',
    ``,
    `## GSC`,
    ``,
    m.ga4gsc?.gsc
      ? `| Metric | Value |\n|--------|-------|\n| Impressions | ${fmt(m.ga4gsc.gsc.impressions)} |\n| Clicks | ${fmt(m.ga4gsc.gsc.clicks)} |\n| CTR | ${m.ga4gsc.gsc.ctr.toFixed(2)}% |\n| Avg position | ${m.ga4gsc.gsc.position.toFixed(1)} |`
      : 'GSC data unavailable.',
    ``,
    `## Revenue`,
    ``,
    `| Metric | Value |`,
    `|--------|-------|`,
    `| API customers | ${fmt(m.postgres.apiCustomers)} |`,
    `| Transactions | ${fmt(m.postgres.apiTransactions)} |`,
    `| Total revenue | $${m.postgres.revenueDollars.toFixed(2)} |`,
    `| Today revenue | $${m.postgres.todayRevenueDollars.toFixed(2)} |`,
    ``,
    `## Infrastructure`,
    ``,
    `| Metric | Value |`,
    `|--------|-------|`,
    `| DB size | ${m.postgres.dbSizePretty} |`,
    `| Manual embeddings | ${fmt(m.postgres.manualEmbeddings)} |`,
    `| Repair profiles | ${fmt(m.postgres.repairProfiles)} |`,
    `| Nginx cache | ${fmtBytes(m.infrastructure.cacheSize)} |`,
    `| Disk used | ${fmtBytes(m.infrastructure.diskUsed)} / ${fmtBytes(m.infrastructure.diskTotal)} |`,
    `| SSL expiry | ${m.infrastructure.sslExpiry || 'unknown'} |`,
    `| Next.js service | ${m.infrastructure.serviceStatus} |`,
    ``,
    `## Lagging Metrics`,
    ``,
    ...(scorecard.issues.length
      ? scorecard.issues.flatMap((issue) => [
          `- **[${issue.severity.toUpperCase()}] ${issue.metric}**: ${issue.value} (target ${issue.target})`,
          `  - ${issue.impact}`,
        ])
      : ['No thresholds breached.']),
    ``,
  ].join('\n');

  const outPath = path.join(REPORTS_DIR, `daily-metrics-${m.date}.md`);
  fs.writeFileSync(outPath, md);
  console.log(`✅ Report saved to ${outPath}`);

  const jsonPath = path.join(REPORTS_DIR, `daily-metrics-${m.date}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify({ date: m.date, profitProxy, scorecard, metrics: m }, null, 2));
  console.log(`✅ JSON saved to ${jsonPath}`);
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
  const date = dateArg();
  console.log(`Collecting metrics for ${date}...`);

  const [nginx, postgres, cloudflare, ga4gsc, infrastructure] = await Promise.allSettled([
    collectNginx(date),
    collectPostgres(),
    collectCloudflare(date),
    collectGa4Gsc(date),
    collectInfrastructure(),
  ]);

  const m = {
    date,
    nginx: nginx.status === 'fulfilled' ? nginx.value : { error: nginx.reason?.message },
    postgres: postgres.status === 'fulfilled' ? postgres.value : { error: postgres.reason?.message },
    cloudflare: cloudflare.status === 'fulfilled' ? cloudflare.value : { error: cloudflare.reason?.message },
    ga4gsc: ga4gsc.status === 'fulfilled' ? ga4gsc.value : { error: ga4gsc.reason?.message },
    infrastructure: infrastructure.status === 'fulfilled' ? infrastructure.value : { error: infrastructure.reason?.message },
  };

  if (m.nginx.error) {
    console.error('Nginx collection failed:', m.nginx.error);
  }

  const scorecard = buildScorecard(m);
  const profitProxy = calculateProfitProxy(m);

  printReport(m, scorecard, profitProxy);
  saveReport(m, scorecard, profitProxy);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
