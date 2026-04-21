/**
 * SpotOn Auto - Tool Intent Affiliate Scoreboard (GA4)
 *
 * Tracks affiliate click performance for /tools pages, with emphasis on
 * tool-intent module subtags (tool-intent-*, tool-spec-*, tool-supplies).
 *
 * Usage:
 *   node scripts/tool-intent-scoreboard.js
 *   node scripts/tool-intent-scoreboard.js --start 2026-04-01 --end 2026-04-18
 *   node scripts/tool-intent-scoreboard.js --top 40 --export
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const KEY_PATH = path.join(__dirname, '..', 'credentials', 'google-service-account.json');
const GA_PROPERTY_ID = '520432705';
const TOOL_PATH_PREFIX = '/tools/';

function getArg(name, fallback = null) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return fallback;
  return process.argv[idx + 1] || fallback;
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

function addDays(dateStr, days) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function fmt(n, digits = 0) {
  return Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function pct(n, d) {
  if (!d) return 0;
  return (n / d) * 100;
}

function printTable(rows, columns) {
  if (!rows.length) {
    console.log('  No rows\n');
    return;
  }

  const widths = {};
  for (const col of columns) {
    widths[col] = Math.max(col.length, ...rows.map((row) => String(row[col] ?? '').length));
  }

  const header = columns.map((col) => String(col).padEnd(widths[col])).join(' | ');
  const divider = columns.map((col) => '-'.repeat(widths[col])).join('-+-');
  console.log('  ' + header);
  console.log('  ' + divider);
  for (const row of rows) {
    console.log('  ' + columns.map((col) => String(row[col] ?? '').padEnd(widths[col])).join(' | '));
  }
  console.log('');
}

function buildAndFilter(expressions) {
  const valid = expressions.filter(Boolean);
  if (!valid.length) return undefined;
  if (valid.length === 1) return valid[0];
  return { andGroup: { expressions: valid } };
}

function isOptionalDimensionError(err) {
  const msg = String(err?.message || err || '');
  return (
    msg.includes('customEvent:') ||
    msg.includes('Unknown name') ||
    msg.includes('unrecognized') ||
    msg.includes('Invalid value')
  );
}

function moduleFromSubtag(subtag) {
  const raw = String(subtag || '').trim();
  if (!raw || raw === '(not set)' || raw === '(unavailable)') return 'unknown';
  if (raw.startsWith('tool-intent-')) return 'tool-intent';
  if (raw.startsWith('tool-spec-')) return 'tool-spec';
  if (raw.startsWith('tool-supplies')) return 'tool-supplies';
  return 'other';
}

async function buildClient() {
  if (!fs.existsSync(KEY_PATH)) {
    throw new Error(`Credentials file not found at ${KEY_PATH}`);
  }

  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_PATH,
    scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
  });

  return google.analyticsdata({ version: 'v1beta', auth });
}

async function runReport(analyticsdata, requestBody) {
  const response = await analyticsdata.properties.runReport({
    property: `properties/${GA_PROPERTY_ID}`,
    requestBody,
  });
  return response.data.rows || [];
}

async function getToolSessions(analyticsdata, startDate, endDate) {
  const rows = await runReport(analyticsdata, {
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'pagePath' }],
    metrics: [{ name: 'sessions' }],
    dimensionFilter: {
      filter: {
        fieldName: 'pagePath',
        stringFilter: { value: TOOL_PATH_PREFIX, matchType: 'BEGINS_WITH' },
      },
    },
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: 2000,
  });

  const sessionsByPath = new Map();
  for (const row of rows) {
    const pagePath = row.dimensionValues?.[0]?.value || '(not set)';
    const sessions = Number(row.metricValues?.[0]?.value || 0);
    sessionsByPath.set(pagePath, sessions);
  }

  return sessionsByPath;
}

async function getToolAffiliateClicks(analyticsdata, startDate, endDate) {
  const baseFilter = buildAndFilter([
    {
      filter: {
        fieldName: 'eventName',
        stringFilter: { value: 'affiliate_click' },
      },
    },
    {
      filter: {
        fieldName: 'pagePath',
        stringFilter: { value: TOOL_PATH_PREFIX, matchType: 'BEGINS_WITH' },
      },
    },
  ]);

  try {
    const rows = await runReport(analyticsdata, {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'pagePath' }, { name: 'customEvent:subtag' }],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: baseFilter,
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      limit: 5000,
    });

    return { rows, hasSubtag: true };
  } catch (err) {
    if (!isOptionalDimensionError(err)) throw err;
    const rows = await runReport(analyticsdata, {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: baseFilter,
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      limit: 5000,
    });
    return { rows, hasSubtag: false };
  }
}

function toCsv(rows, columns) {
  const header = columns.join(',');
  const body = rows.map((row) => columns.map((col) => JSON.stringify(row[col] ?? '')).join(','));
  return [header, ...body].join('\n');
}

async function main() {
  const today = new Date().toISOString().slice(0, 10);
  const endDate = getArg('end', addDays(today, -1));
  const startDate = getArg('start', addDays(endDate, -6));
  const topLimit = Math.max(1, Number(getArg('top', '30')));
  const shouldExport = hasFlag('export');

  const analyticsdata = await buildClient();
  const [sessionsByPath, clickResult] = await Promise.all([
    getToolSessions(analyticsdata, startDate, endDate),
    getToolAffiliateClicks(analyticsdata, startDate, endDate),
  ]);

  const clicksByPath = new Map();
  const clicksByPathSubtag = new Map();
  const moduleTotals = new Map();

  for (const row of clickResult.rows) {
    const pagePath = row.dimensionValues?.[0]?.value || '(not set)';
    const subtag = clickResult.hasSubtag
      ? row.dimensionValues?.[1]?.value || '(not set)'
      : '(unavailable)';
    const clicks = Number(row.metricValues?.[0]?.value || 0);

    clicksByPath.set(pagePath, (clicksByPath.get(pagePath) || 0) + clicks);

    const subtagKey = `${pagePath}::${subtag}`;
    clicksByPathSubtag.set(subtagKey, (clicksByPathSubtag.get(subtagKey) || 0) + clicks);

    const module = moduleFromSubtag(subtag);
    moduleTotals.set(module, (moduleTotals.get(module) || 0) + clicks);
  }

  const allPaths = new Set([...sessionsByPath.keys(), ...clicksByPath.keys()]);
  const pageRows = [...allPaths]
    .map((pagePath) => {
      const sessions = sessionsByPath.get(pagePath) || 0;
      const clicks = clicksByPath.get(pagePath) || 0;

      let topSubtag = '(not set)';
      let topSubtagClicks = 0;
      for (const [key, value] of clicksByPathSubtag.entries()) {
        const [pathKey, subtag] = key.split('::');
        if (pathKey !== pagePath) continue;
        if (value > topSubtagClicks) {
          topSubtag = subtag;
          topSubtagClicks = value;
        }
      }

      return {
        page: pagePath,
        sessions,
        clicks,
        clicks_per_100_sessions: pct(clicks, sessions),
        top_subtag: topSubtag,
      };
    })
    .filter((row) => row.clicks > 0 || row.sessions > 0)
    .sort((a, b) => {
      if (b.clicks !== a.clicks) return b.clicks - a.clicks;
      return b.clicks_per_100_sessions - a.clicks_per_100_sessions;
    });

  const moduleRows = [...moduleTotals.entries()]
    .map(([module, clicks]) => ({ module, clicks }))
    .sort((a, b) => b.clicks - a.clicks);

  const totalSessions = [...sessionsByPath.values()].reduce((sum, n) => sum + n, 0);
  const totalClicks = [...clicksByPath.values()].reduce((sum, n) => sum + n, 0);
  const toolIntentClicks = moduleTotals.get('tool-intent') || 0;
  const toolSpecClicks = moduleTotals.get('tool-spec') || 0;
  const toolSuppliesClicks = moduleTotals.get('tool-supplies') || 0;

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║      SpotOn Auto - Tool Intent Affiliate Scoreboard         ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  console.log(`  Period: ${startDate} to ${endDate}`);
  console.log(`  Property: ${GA_PROPERTY_ID}`);
  console.log(`  Subtag dimension available: ${clickResult.hasSubtag ? 'yes' : 'no (fallback mode)'}\n`);

  console.log('=== SUMMARY ===\n');
  console.log(`  Tool page sessions: ${fmt(totalSessions)}`);
  console.log(`  Affiliate clicks on /tools/: ${fmt(totalClicks)}`);
  console.log(`  Clicks / 100 sessions: ${fmt(pct(totalClicks, totalSessions), 2)}`);
  console.log(`  tool-intent clicks: ${fmt(toolIntentClicks)}`);
  console.log(`  tool-spec clicks: ${fmt(toolSpecClicks)}`);
  console.log(`  tool-supplies clicks: ${fmt(toolSuppliesClicks)}\n`);

  console.log('=== CLICKS BY MODULE ===\n');
  printTable(
    moduleRows.map((row) => ({ module: row.module, clicks: fmt(row.clicks) })),
    ['module', 'clicks'],
  );

  console.log(`=== TOP TOOL PAGES (${topLimit}) ===\n`);
  printTable(
    pageRows.slice(0, topLimit).map((row) => ({
      page: row.page,
      sessions: fmt(row.sessions),
      clicks: fmt(row.clicks),
      clicks_per_100_sessions: fmt(row.clicks_per_100_sessions, 2),
      top_subtag: row.top_subtag,
    })),
    ['page', 'sessions', 'clicks', 'clicks_per_100_sessions', 'top_subtag'],
  );

  if (shouldExport) {
    const outDir = path.join(__dirname, 'seo-reports');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const stamp = `${startDate}_to_${endDate}`;
    const csvPath = path.join(outDir, `tool-intent-scoreboard-${stamp}.csv`);
    const jsonPath = path.join(outDir, `tool-intent-scoreboard-${stamp}.json`);

    const exportRows = pageRows.map((row) => ({
      page: row.page,
      sessions: row.sessions,
      clicks: row.clicks,
      clicks_per_100_sessions: Number(row.clicks_per_100_sessions.toFixed(4)),
      top_subtag: row.top_subtag,
    }));

    fs.writeFileSync(
      csvPath,
      toCsv(exportRows, ['page', 'sessions', 'clicks', 'clicks_per_100_sessions', 'top_subtag']),
      'utf8',
    );

    fs.writeFileSync(
      jsonPath,
      JSON.stringify(
        {
          period: { startDate, endDate },
          summary: {
            totalSessions,
            totalClicks,
            clicksPer100Sessions: Number((pct(totalClicks, totalSessions) * 100).toFixed(4)),
            toolIntentClicks,
            toolSpecClicks,
            toolSuppliesClicks,
            hasSubtagDimension: clickResult.hasSubtag,
          },
          modules: moduleRows,
          pages: exportRows,
        },
        null,
        2,
      ),
      'utf8',
    );

    console.log(`Exported CSV: ${csvPath}`);
    console.log(`Exported JSON: ${jsonPath}`);
  }
}

main().catch((err) => {
  console.error('Tool intent scoreboard failed:', err.message || err);
  process.exit(1);
});
