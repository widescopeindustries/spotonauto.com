#!/usr/bin/env node
/**
 * Daily SEO monitor for alloemmanuals.com
 * Pulls GSC, BWT, and GA4 organic split, appends to JSONL logs,
 * and prints a compact recovery summary.
 *
 * Run manually:
 *   node scripts/seo-daily-monitor.mjs
 *
 * Or via cron once per day (e.g. 08:57):
 *   57 8 * * * cd /home/lyndon/projects/spotonauto.com && /usr/bin/node scripts/seo-daily-monitor.mjs >> scripts/seo-reports/monitor.log 2>&1
 */
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import https from 'https';

const REPORTS_DIR = 'scripts/seo-reports';
const GSC_LOG = path.join(REPORTS_DIR, 'monitor-gsc.jsonl');
const BWT_LOG = path.join(REPORTS_DIR, 'monitor-bwt.jsonl');
const GA4_LOG = path.join(REPORTS_DIR, 'monitor-ga4.jsonl');
const SUMMARY_LOG = path.join(REPORTS_DIR, 'monitor-summary.jsonl');

const GSC_KEY = 'credentials/google-service-account.json';
const GSC_SITE = 'sc-domain:alloemmanuals.com';
const GA4_PROPERTY = 'properties/537013586';
const BWT_API_KEY = 'ed56683793774b0896e6a680bd7559d7';
const BWT_SITE = 'https://alloemmanuals.com';

const today = new Date().toISOString().slice(0, 10);
const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

function ensureDir() {
  if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

function appendJsonl(file, obj) {
  fs.appendFileSync(file, JSON.stringify(obj) + '\n');
}

async function gscDaily(site, startDate, endDate) {
  const credentials = JSON.parse(fs.readFileSync(GSC_KEY, 'utf8'));
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });
  const searchconsole = google.searchconsole({ version: 'v1', auth });
  const all = [];
  let startRow = 0;
  for (;;) {
    const res = await searchconsole.searchanalytics.query({
      siteUrl: site,
      requestBody: { startDate, endDate, dimensions: ['date'], rowLimit: 25000, startRow },
    });
    const rows = res.data.rows || [];
    all.push(...rows);
    if (rows.length < 25000) break;
    startRow += 25000;
  }
  return all.map((r) => ({
    date: r.keys[0],
    clicks: r.clicks,
    impressions: r.impressions,
    ctr: r.ctr,
    position: r.position,
  }));
}

async function ga4OrganicBySource(startDate, endDate) {
  const credentials = JSON.parse(fs.readFileSync(GSC_KEY, 'utf8'));
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
  });
  const ga4 = google.analyticsdata({ version: 'v1beta', auth: await auth.getClient() });
  const res = await ga4.properties.runReport({
    property: GA4_PROPERTY,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'sessionSource' }],
      metrics: [{ name: 'sessions' }, { name: 'totalUsers' }],
      dimensionFilter: {
        filter: { fieldName: 'sessionMedium', stringFilter: { matchType: 'EXACT', value: 'organic' } },
      },
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 100,
    },
  });
  return (res.data.rows || []).map((r) => ({
    source: r.dimensionValues[0].value,
    sessions: Number(r.metricValues[0].value),
    users: Number(r.metricValues[1].value),
  }));
}

function bingGet(path) {
  return new Promise((resolve, reject) => {
    https.get(
      {
        hostname: 'ssl.bing.com',
        path: `/webmaster/api.svc/json${path}&apikey=${BWT_API_KEY}`,
        headers: { 'Content-Type': 'application/json' },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch {
            resolve({ status: res.statusCode, data: body });
          }
        });
      },
    ).on('error', reject);
  });
}

async function bwtFeeds() {
  const res = await bingGet(`/GetFeeds?siteUrl=${encodeURIComponent(BWT_SITE)}`);
  const feeds = res.data?.d || [];
  return feeds.map((f) => ({
    url: f.Url,
    status: f.Status,
    urlCount: f.UrlCount,
    lastCrawled: f.LastCrawled,
  }));
}

async function bwtCrawlStats() {
  const res = await bingGet(`/GetCrawlStats?siteUrl=${encodeURIComponent(BWT_SITE)}`);
  const rows = res.data?.d || [];
  const last = rows[rows.length - 1] || {};
  return {
    days: rows.length,
    lastDate: last.Date,
    lastCrawledPages: last.CrawledPages,
    lastCrawlErrors: last.CrawlErrors,
    lastCode2xx: last.Code2xx,
    lastCode4xx: last.Code4xx,
    lastCode5xx: last.Code5xx,
    lastInIndex: last.InIndex,
    totalCrawledPages: rows.reduce((s, r) => s + (r.CrawledPages || 0), 0),
    totalCrawlErrors: rows.reduce((s, r) => s + (r.CrawlErrors || 0), 0),
    totalCode4xx: rows.reduce((s, r) => s + (r.Code4xx || 0), 0),
  };
}

const AI_CITATIONS_LOG = path.join(REPORTS_DIR, 'monitor-ai-citations.jsonl');
const AI_CITATIONS_AUDIT_GLOB = path.join(REPORTS_DIR, 'ai-citations-audit-*.json');

function fetchStatus(targetUrl, depth = 0) {
  return new Promise((resolve) => {
    if (depth > 2) {
      resolve({ status: 'too-many-redirects', finalUrl: targetUrl, noindex: false });
      return;
    }
    const full = targetUrl.startsWith('http') ? targetUrl : `${BWT_SITE}${targetUrl}`;
    const req = https.get(
      full,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Bingbot/2.0; +http://www.bing.com/bingbot.htm)',
          Accept: 'text/html',
        },
        timeout: 15000,
      },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const loc = res.headers.location.startsWith('http')
            ? new URL(res.headers.location).pathname
            : res.headers.location;
          fetchStatus(loc, depth + 1).then((sub) =>
            resolve({
              status: sub.status,
              finalUrl: sub.finalUrl,
              noindex: sub.noindex,
            })
          );
          return;
        }
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            finalUrl: targetUrl,
            noindex: /noindex/i.test(body),
          });
        });
      }
    );
    req.on('timeout', () => {
      req.destroy();
      resolve({ status: 'timeout', finalUrl: targetUrl, noindex: false });
    });
    req.on('error', (err) => resolve({ status: `error: ${err.message}`, finalUrl: targetUrl, noindex: false }));
  });
}

function latestAiCitationsAudit() {
  if (!fs.existsSync(REPORTS_DIR)) return null;
  const files = fs
    .readdirSync(REPORTS_DIR)
    .filter((f) => f.startsWith('ai-citations-audit-') && f.endsWith('.json'))
    .sort()
    .reverse();
  return files[0] ? path.join(REPORTS_DIR, files[0]) : null;
}

async function aiCitationsWatch() {
  const auditFile = latestAiCitationsAudit();
  if (!auditFile) {
    return { checked: 0, non200: [], noindexed: [], error: 'No ai-citations-audit file found' };
  }

  const audit = JSON.parse(fs.readFileSync(auditFile, 'utf8'));
  const urls = [];
  for (const r of audit.results || []) {
    if (r.mappedUrl && !urls.find((u) => u.url === r.mappedUrl)) {
      urls.push({ url: r.mappedUrl, query: r.query, citations: r.citations, pct: r.pct });
    }
  }

  const checked = [];
  for (const u of urls) {
    const status = await fetchStatus(u.url);
    checked.push({ ...u, status });
  }

  const non200 = checked.filter((c) => c.status.status !== 200);
  const noindexed = checked.filter((c) => c.status.noindex);

  const entry = {
    runAt: new Date().toISOString(),
    auditFile,
    totalChecked: checked.length,
    non200Count: non200.length,
    noindexedCount: noindexed.length,
    non200: non200.map((c) => ({ url: c.url, query: c.query, status: c.status.status, finalUrl: c.status.finalUrl })),
    noindexed: noindexed.map((c) => ({ url: c.url, query: c.query, status: c.status.status })),
  };
  appendJsonl(AI_CITATIONS_LOG, entry);

  return entry;
}

async function main() {
  ensureDir();
  const runAt = new Date().toISOString();

  // AI Citations watch (runs first so it doesn't depend on API credentials)
  const aiWatch = await aiCitationsWatch();

  // GSC: last 30 days daily
  const gscEnd = yesterday;
  const gscStart = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const gscRows = await gscDaily(GSC_SITE, gscStart, gscEnd);
  const gscTotal = gscRows.reduce((a, b) => ({ clicks: a.clicks + b.clicks, impressions: a.impressions + b.impressions }), { clicks: 0, impressions: 0 });
  const gscYesterday = gscRows.find((r) => r.date === yesterday) || { clicks: 0, impressions: 0 };
  const gsc7d = gscRows.filter((r) => r.date >= sevenDaysAgo).reduce((a, b) => ({ clicks: a.clicks + b.clicks, impressions: a.impressions + b.impressions }), { clicks: 0, impressions: 0 });
  const gscEntry = { runAt, period: `${gscStart}..${gscEnd}`, total: gscTotal, yesterday: gscYesterday, last7d: gsc7d, daily: gscRows };
  appendJsonl(GSC_LOG, gscEntry);

  // GA4 organic split
  const ga4Rows = await ga4OrganicBySource(gscStart, gscEnd);
  const ga4Google = ga4Rows.find((r) => r.source === 'google') || { sessions: 0 };
  const ga4Bing = ga4Rows.find((r) => r.source === 'bing') || { sessions: 0 };
  const ga4Total = ga4Rows.reduce((s, r) => s + r.sessions, 0);
  appendJsonl(GA4_LOG, { runAt, period: `${gscStart}..${gscEnd}`, total: ga4Total, google: ga4Google.sessions, bing: ga4Bing.sessions, sources: ga4Rows });

  // BWT
  const feeds = await bwtFeeds();
  const crawl = await bwtCrawlStats();
  appendJsonl(BWT_LOG, { runAt, feeds, crawl });

  const summary = {
    runAt,
    google: {
      gsc30dClicks: gscTotal.clicks,
      gsc30dImpressions: gscTotal.impressions,
      gscYesterdayClicks: gscYesterday.clicks,
      ga4OrganicSessions30d: ga4Google.sessions,
    },
    bing: {
      ga4OrganicSessions30d: ga4Bing.sessions,
      bwtLastDayCrawledPages: crawl.lastCrawledPages,
      bwtLastDayInIndex: crawl.lastInIndex,
      bwtLastDayCode4xx: crawl.lastCode4xx,
      bwtFailedFeeds: feeds.filter((f) => f.status !== 'Success').length,
    },
    aiCitations: {
      totalChecked: aiWatch.totalChecked,
      non200Count: aiWatch.non200Count,
      noindexedCount: aiWatch.noindexedCount,
    },
  };
  appendJsonl(SUMMARY_LOG, summary);

  console.log(`SEO monitor run: ${runAt}`);
  console.log('');
  console.log('AI Citations watch');
  if (aiWatch.error) {
    console.log(`  Error: ${aiWatch.error}`);
  } else {
    console.log(`  URLs checked:      ${aiWatch.totalChecked}`);
    console.log(`  Non-200:           ${aiWatch.non200Count}`);
    console.log(`  Noindexed:         ${aiWatch.noindexedCount}`);
    for (const c of aiWatch.non200.slice(0, 5)) {
      console.log(`    ${c.status}  ${c.url}  (${c.query})`);
    }
    if (aiWatch.non200.length > 5) console.log(`    ... and ${aiWatch.non200.length - 5} more`);
  }
  console.log('');
  console.log('Google (last 30d)');
  console.log(`  GSC clicks:        ${gscTotal.clicks.toLocaleString()}`);
  console.log(`  GSC impressions:   ${gscTotal.impressions.toLocaleString()}`);
  console.log(`  GSC yesterday:     ${gscYesterday.clicks} clicks / ${gscYesterday.impressions} imp`);
  console.log(`  GA4 organic sess:  ${ga4Google.sessions.toLocaleString()}`);
  console.log('');
  console.log('Bing (last 30d)');
  console.log(`  GA4 organic sess:  ${ga4Bing.sessions.toLocaleString()}`);
  console.log(`  BWT last crawled:  ${crawl.lastCrawledPages?.toLocaleString() || 0} pages`);
  console.log(`  BWT last in-index: ${crawl.lastInIndex?.toLocaleString() || 0}`);
  console.log(`  BWT last 4xx:      ${crawl.lastCode4xx?.toLocaleString() || 0}`);
  console.log(`  BWT failed feeds:  ${summary.bing.bwtFailedFeeds}`);
  console.log('');
  console.log('Logs written:');
  console.log(`  ${GSC_LOG}`);
  console.log(`  ${GA4_LOG}`);
  console.log(`  ${BWT_LOG}`);
  console.log(`  ${AI_CITATIONS_LOG}`);
  console.log(`  ${SUMMARY_LOG}`);
}

main().catch((err) => {
  console.error('Monitor failed:', err.message);
  process.exit(1);
});
