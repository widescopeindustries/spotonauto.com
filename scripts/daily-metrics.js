#!/usr/bin/env node
/**
 * Daily Metrics Report for alloemmanuals.com
 *
 * Tracks the metrics that matter for a new domain:
 * - GSC: impressions, clicks, position, indexed page count
 * - GA4: organic sessions, total sessions, users, engagement time, key events
 * - Trends: MoM/WoW growth, day-over-day changes
 *
 * Usage:
 *   node scripts/daily-metrics.js              # Today's report
 *   node scripts/daily-metrics.js --save       # Save to seo-reports/
 *   node scripts/daily-metrics.js --history 7  # Show last 7 days
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const KEY_PATH = path.join(__dirname, '..', 'credentials', 'google-service-account.json');
const GA_PROPERTY_ID = '537013586';
const GSC_SITE_URL = 'sc-domain:alloemmanuals.com';
const OUTPUT_DIR = path.join(__dirname, 'seo-reports');
const MASTER_CSV = path.join(OUTPUT_DIR, 'daily-metrics-master.csv');

// ─── Helpers ────────────────────────────────────────────────────────────

function fmt(n, digits = 0) {
  return Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function addDays(dateStr, days) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function getArg(name, fallback = null) {
  const exact = `--${name}`;
  const match = process.argv.find((arg) => arg === exact || arg.startsWith(`${exact}=`));
  if (!match) return fallback;
  if (match.startsWith(`${exact}=`)) return match.slice(exact.length + 1) || fallback;
  const idx = process.argv.indexOf(exact);
  const next = process.argv[idx + 1];
  if (!next || next.startsWith('--')) return fallback;
  return next;
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

async function buildGaClient() {
  const credentials = JSON.parse(fs.readFileSync(KEY_PATH, 'utf8'));
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
  });
  return google.analyticsdata({ version: 'v1beta', auth });
}

async function buildGscClient() {
  const credentials = JSON.parse(fs.readFileSync(KEY_PATH, 'utf8'));
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });
  return google.searchconsole({ version: 'v1', auth });
}

// ─── GA4 Pulls ───────────────────────────────────────────────────────────

async function ga4Overview(analyticsdata, startDate, endDate) {
  const res = await analyticsdata.properties.runReport({
    property: `properties/${GA_PROPERTY_ID}`,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      metrics: [
        { name: 'sessions' },
        { name: 'activeUsers' },
        { name: 'newUsers' },
        { name: 'averageSessionDuration' },
        { name: 'screenPageViews' },
        { name: 'bounceRate' },
      ],
    },
  });
  const row = res.data.rows?.[0];
  if (!row) return null;
  const vals = row.metricValues;
  return {
    sessions: Number(vals[0].value),
    activeUsers: Number(vals[1].value),
    newUsers: Number(vals[2].value),
    avgEngagementSec: Math.round(Number(vals[3].value)),
    pageViews: Number(vals[4].value),
    bounceRate: (Number(vals[5].value) * 100).toFixed(1),
  };
}

async function ga4Organic(analyticsdata, startDate, endDate) {
  const res = await analyticsdata.properties.runReport({
    property: `properties/${GA_PROPERTY_ID}`,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      metrics: [
        { name: 'sessions' },
        { name: 'activeUsers' },
        { name: 'screenPageViews' },
      ],
      dimensionFilter: {
        filter: {
          fieldName: 'sessionMedium',
          stringFilter: { value: 'organic', matchType: 'EXACT' },
        },
      },
    },
  });
  const row = res.data.rows?.[0];
  if (!row) return { sessions: 0, activeUsers: 0, pageViews: 0 };
  const vals = row.metricValues;
  return {
    sessions: Number(vals[0].value),
    activeUsers: Number(vals[1].value),
    pageViews: Number(vals[2].value),
  };
}

async function ga4Channels(analyticsdata, startDate, endDate) {
  const res = await analyticsdata.properties.runReport({
    property: `properties/${GA_PROPERTY_ID}`,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'sessionDefaultChannelGroup' }],
      metrics: [{ name: 'sessions' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 10,
    },
  });
  return (res.data.rows || []).map((row) => ({
    channel: row.dimensionValues[0].value,
    sessions: Number(row.metricValues[0].value),
  }));
}

async function ga4TopPages(analyticsdata, startDate, endDate) {
  const res = await analyticsdata.properties.runReport({
    property: `properties/${GA_PROPERTY_ID}`,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'pageTitle' }, { name: 'pagePath' }],
      metrics: [{ name: 'screenPageViews' }],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 10,
    },
  });
  return (res.data.rows || []).map((row) => ({
    title: row.dimensionValues[0].value,
    path: row.dimensionValues[1].value,
    views: Number(row.metricValues[0].value),
  }));
}

async function ga4Events(analyticsdata, startDate, endDate) {
  const res = await analyticsdata.properties.runReport({
    property: `properties/${GA_PROPERTY_ID}`,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'eventName' }],
      metrics: [{ name: 'eventCount' }],
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      limit: 15,
    },
  });
  return (res.data.rows || []).map((row) => ({
    event: row.dimensionValues[0].value,
    count: Number(row.metricValues[0].value),
  }));
}

async function ga4Countries(analyticsdata, startDate, endDate) {
  const res = await analyticsdata.properties.runReport({
    property: `properties/${GA_PROPERTY_ID}`,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'country' }],
      metrics: [{ name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      limit: 10,
    },
  });
  return (res.data.rows || []).map((row) => ({
    country: row.dimensionValues[0].value,
    users: Number(row.metricValues[0].value),
  }));
}

// ─── GSC Pulls ───────────────────────────────────────────────────────────

async function gscDaily(searchconsole, startDate, endDate) {
  const res = await searchconsole.searchanalytics.query({
    siteUrl: GSC_SITE_URL,
    requestBody: { startDate, endDate, dimensions: ['date'], rowLimit: 1000 },
  });
  return (res.data.rows || []).map((row) => ({
    date: row.keys[0],
    impressions: row.impressions,
    clicks: row.clicks,
    ctr: (row.ctr * 100).toFixed(1),
    position: row.position.toFixed(1),
  }));
}

async function gscTopQueries(searchconsole, startDate, endDate) {
  const res = await searchconsole.searchanalytics.query({
    siteUrl: GSC_SITE_URL,
    requestBody: {
      startDate,
      endDate,
      dimensions: ['query'],
      rowLimit: 10,
      orderBys: [{ dimension: { dimensionName: 'clicks' }, desc: true }],
    },
  });
  return (res.data.rows || []).map((row) => ({
    query: row.keys[0],
    clicks: row.clicks,
    impressions: row.impressions,
    position: row.position.toFixed(1),
  }));
}

async function gscTopPages(searchconsole, startDate, endDate) {
  const res = await searchconsole.searchanalytics.query({
    siteUrl: GSC_SITE_URL,
    requestBody: {
      startDate,
      endDate,
      dimensions: ['page'],
      rowLimit: 10,
      orderBys: [{ dimension: { dimensionName: 'clicks' }, desc: true }],
    },
  });
  return (res.data.rows || []).map((row) => ({
    page: row.keys[0].replace('https://alloemmanuals.com', ''),
    clicks: row.clicks,
    impressions: row.impressions,
    position: row.position.toFixed(1),
  }));
}

// ─── History / Trends ───────────────────────────────────────────────────

function loadMasterCsv() {
  if (!fs.existsSync(MASTER_CSV)) return [];
  const lines = fs.readFileSync(MASTER_CSV, 'utf8').trim().split('\n');
  const headers = lines[0].split(',');
  return lines.slice(1).map((line) => {
    const vals = line.split(',');
    const obj = {};
    headers.forEach((h, i) => (obj[h] = vals[i]));
    return obj;
  });
}

function calcGrowth(current, previous) {
  if (!previous || Number(previous) === 0) return null;
  return (((Number(current) - Number(previous)) / Number(previous)) * 100).toFixed(1);
}

// ─── Main ────────────────────────────────────────────────────────────────

async function main() {
  const endDate = addDays(todayStr(), -1); // yesterday (GA4/GSC data lags)
  const startDate = endDate;
  const prevDate = addDays(endDate, -1);
  const weekAgo = addDays(endDate, -7);

  const analyticsdata = await buildGaClient();
  const searchconsole = await buildGscClient();

  console.log(`\n╔══════════════════════════════════════════════════════════════╗`);
  console.log(`║        alloemmanuals.com — Daily Metrics Report             ║`);
  console.log(`╚══════════════════════════════════════════════════════════════╝`);
  console.log(`\n  Date: ${startDate}`);
  console.log(`  Domain age: ~5 days (launched ~2026-05-07)\n`);

  // ── GA4 ──
  const overview = await ga4Overview(analyticsdata, startDate, endDate);
  const organic = await ga4Organic(analyticsdata, startDate, endDate);
  const channels = await ga4Channels(analyticsdata, startDate, endDate);
  const topPages = await ga4TopPages(analyticsdata, startDate, endDate);
  const events = await ga4Events(analyticsdata, startDate, endDate);
  const countries = await ga4Countries(analyticsdata, startDate, endDate);

  // Previous day for growth
  const prevOverview = await ga4Overview(analyticsdata, prevDate, prevDate).catch(() => null);
  const prevOrganic = await ga4Organic(analyticsdata, prevDate, prevDate).catch(() => null);

  console.log('=== GA4 OVERVIEW ===\n');
  if (overview) {
    const sessGrowth = calcGrowth(overview.sessions, prevOverview?.sessions);
    const orgGrowth = calcGrowth(organic.sessions, prevOrganic?.sessions);
    console.log(`  Total sessions:      ${fmt(overview.sessions)}${sessGrowth !== null ? ` (${sessGrowth > 0 ? '+' : ''}${sessGrowth}%)` : ''}`);
    console.log(`  Organic sessions:    ${fmt(organic.sessions)}${orgGrowth !== null ? ` (${orgGrowth > 0 ? '+' : ''}${orgGrowth}%)` : ''}`);
    console.log(`  Active users:        ${fmt(overview.activeUsers)}`);
    console.log(`  New users:           ${fmt(overview.newUsers)}`);
    console.log(`  Page views:          ${fmt(overview.pageViews)}`);
    console.log(`  Avg engagement:      ${fmt(overview.avgEngagementSec)}s`);
    console.log(`  Bounce rate:         ${overview.bounceRate}%`);
  } else {
    console.log('  No GA4 data yet.\n');
  }

  console.log('\n=== CHANNELS ===\n');
  if (channels.length) {
    channels.forEach((c) => console.log(`  ${c.channel.padEnd(20)} ${fmt(c.sessions).padStart(6)} sessions`));
  } else {
    console.log('  No channel data.\n');
  }

  console.log('\n=== TOP PAGES ===\n');
  if (topPages.length) {
    topPages.forEach((p) => console.log(`  ${p.views.toString().padStart(3)} views  ${p.path}`));
  } else {
    console.log('  No page data.\n');
  }

  console.log('\n=== TOP EVENTS ===\n');
  if (events.length) {
    events.forEach((e) => console.log(`  ${e.event.padEnd(25)} ${fmt(e.count).padStart(4)}`));
  } else {
    console.log('  No events.\n');
  }

  console.log('\n=== TOP COUNTRIES ===\n');
  if (countries.length) {
    countries.forEach((c) => console.log(`  ${c.country.padEnd(18)} ${fmt(c.users).padStart(3)} users`));
  } else {
    console.log('  No geo data.\n');
  }

  // ── GSC ──
  const gscDailyRows = await gscDaily(searchconsole, startDate, endDate);
  const gscQueries = await gscTopQueries(searchconsole, startDate, endDate);
  const gscPages = await gscTopPages(searchconsole, startDate, endDate);

  console.log('\n=== GSC SEARCH PERFORMANCE ===\n');
  if (gscDailyRows.length) {
    const row = gscDailyRows[0];
    console.log(`  Impressions:  ${fmt(row.impressions)}`);
    console.log(`  Clicks:       ${fmt(row.clicks)}`);
    console.log(`  CTR:          ${row.ctr}%`);
    console.log(`  Avg position: ${row.position}`);
  } else {
    console.log('  No GSC data yet (common for new domains).\n');
  }

  console.log('\n=== TOP QUERIES (GSC) ===\n');
  if (gscQueries.length) {
    gscQueries.forEach((q) => console.log(`  ${q.clicks} clk | ${q.impressions} imp | pos ${q.position}  "${q.query.substring(0, 50)}"`));
  } else {
    console.log('  No query data yet.\n');
  }

  console.log('\n=== TOP PAGES (GSC) ===\n');
  if (gscPages.length) {
    gscPages.forEach((p) => console.log(`  ${p.clicks} clk | ${p.impressions} imp | pos ${p.position}  ${p.page.substring(0, 55)}`));
  } else {
    console.log('  No page data yet.\n');
  }

  // ── Save ──
  if (hasFlag('save')) {
    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    const summaryLine = [
      startDate,
      overview?.sessions || 0,
      overview?.activeUsers || 0,
      overview?.newUsers || 0,
      organic.sessions,
      overview?.pageViews || 0,
      overview?.avgEngagementSec || 0,
      gscDailyRows[0]?.impressions || 0,
      gscDailyRows[0]?.clicks || 0,
      gscDailyRows[0]?.position || 0,
    ].join(',');

    const headers = [
      'date',
      'ga_sessions',
      'ga_users',
      'ga_new_users',
      'ga_organic_sessions',
      'ga_page_views',
      'ga_avg_engagement_sec',
      'gsc_impressions',
      'gsc_clicks',
      'gsc_position',
    ].join(',');

    if (!fs.existsSync(MASTER_CSV)) {
      fs.writeFileSync(MASTER_CSV, headers + '\n');
    }
    fs.appendFileSync(MASTER_CSV, summaryLine + '\n');
    console.log(`\n✅ Saved to ${MASTER_CSV}`);

    const dailyJson = {
      date: startDate,
      ga4: overview
        ? {
            sessions: overview.sessions,
            users: overview.activeUsers,
            newUsers: overview.newUsers,
            organicSessions: organic.sessions,
            pageViews: overview.pageViews,
            avgEngagementSec: overview.avgEngagementSec,
            bounceRate: overview.bounceRate,
            channels,
            topPages,
            events,
            countries,
          }
        : null,
      gsc: {
        daily: gscDailyRows[0] || null,
        topQueries: gscQueries,
        topPages: gscPages,
      },
    };

    const jsonPath = path.join(OUTPUT_DIR, `daily-metrics-${startDate}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(dailyJson, null, 2));
    console.log(`✅ Saved to ${jsonPath}`);
  }

  console.log('\n' + '═'.repeat(62));
  console.log('Done.\n');
}

main().catch((err) => {
  console.error('Error:', err.message);
  if (err.message?.includes('403') || err.message?.includes('Permission')) {
    console.error('\nCheck that the service account has access to:');
    console.error(`  GA4 property: ${GA_PROPERTY_ID}`);
    console.error(`  GSC property: ${GSC_SITE_URL}`);
  }
  process.exit(1);
});
