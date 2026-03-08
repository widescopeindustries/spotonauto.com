/**
 * SpotOn Auto - Knowledge Graph Scoreboard
 *
 * Compact GA4 scorecard for graph performance, plus recommended ordering overrides.
 *
 * Usage:
 *   node scripts/graph-scoreboard.js
 *   node scripts/graph-scoreboard.js --start 2026-03-01 --end 2026-03-31 --export
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const KEY_PATH = path.join(__dirname, '..', 'credentials', 'google-service-account.json');
const GA_PROPERTY_ID = '520432705';
const DEFAULT_SURFACE_BASE = {
  repair: { manual: 90, spec: 80, tool: 60, wiring: 50, dtc: 40, repair: 30 },
  code: { manual: 90, repair: 80, wiring: 70, dtc: 50, tool: 30, spec: 20 },
  wiring: { manual: 90, repair: 75, dtc: 70, wiring: 50, tool: 30, spec: 20 },
};

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
  console.log('  ' + columns.map((col) => String(col).padEnd(widths[col])).join(' | '));
  console.log('  ' + columns.map((col) => '-'.repeat(widths[col])).join('-+-'));
  for (const row of rows) {
    console.log('  ' + columns.map((col) => String(row[col] ?? '').padEnd(widths[col])).join(' | '));
  }
  console.log('');
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

function buildRecommendedOverrides(groupRows) {
  const groupedBySurface = {};
  for (const row of groupRows) {
    if (!groupedBySurface[row.surface]) groupedBySurface[row.surface] = [];
    groupedBySurface[row.surface].push(row.raw);
  }

  const surfaces = {};
  for (const [surface, rows] of Object.entries(groupedBySurface)) {
    const sorted = [...rows].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.group.localeCompare(b.group);
    });

    const base = DEFAULT_SURFACE_BASE[surface] || {};
    const groupWeights = {};
    sorted.forEach((row, index) => {
      const baseline = typeof base[row.group] === 'number' ? base[row.group] : 40;
      groupWeights[row.group] = Math.round(baseline + (sorted.length - index) * 5 + row.ctr * 0.5);
    });

    surfaces[surface] = { groupWeights };
  }

  return { surfaces };
}

async function main() {
  const today = new Date().toISOString().slice(0, 10);
  const endDate = getArg('end', addDays(today, -1));
  const startDate = getArg('start', addDays(endDate, -6));
  const shouldExport = hasFlag('export');

  const analyticsdata = await buildClient();
  const rows = await runReport(analyticsdata, {
    dateRanges: [{ startDate, endDate }],
    dimensions: [
      { name: 'eventName' },
      { name: 'customEvent:graph_surface' },
      { name: 'customEvent:graph_group' },
    ],
    metrics: [{ name: 'eventCount' }],
    dimensionFilter: {
      filter: {
        fieldName: 'eventName',
        inListFilter: {
          values: ['knowledge_graph_impression', 'knowledge_graph_click'],
        },
      },
    },
    orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
    limit: 200,
  });

  const grouped = {};
  for (const row of rows) {
    const eventName = row.dimensionValues?.[0]?.value || '';
    const surface = row.dimensionValues?.[1]?.value || '(not set)';
    const group = row.dimensionValues?.[2]?.value || '(not set)';
    const count = Number(row.metricValues?.[0]?.value || 0);
    const key = `${surface}::${group}`;
    if (!grouped[key]) grouped[key] = { surface, group, impressions: 0, clicks: 0 };
    if (eventName === 'knowledge_graph_impression') grouped[key].impressions += count;
    if (eventName === 'knowledge_graph_click') grouped[key].clicks += count;
  }

  const scoreRows = Object.values(grouped)
    .map((row) => {
      const ctr = pct(row.clicks, row.impressions);
      const score = ctr * 10 + Math.log10(row.clicks + 1) * 10;
      return {
        surface: row.surface,
        group: row.group,
        impressions: fmt(row.impressions),
        clicks: fmt(row.clicks),
        ctr: `${ctr.toFixed(1)}%`,
        score: score.toFixed(1),
        raw: { ...row, ctr, score },
      };
    })
    .sort((a, b) => Number(b.score) - Number(a.score));

  const recommendedOverrides = buildRecommendedOverrides(scoreRows);

  console.log(`\n╔══════════════════════════════════════════════════════════════╗`);
  console.log(`║        SpotOn Auto - Knowledge Graph Scoreboard            ║`);
  console.log(`╚══════════════════════════════════════════════════════════════╝`);
  console.log(`\n  Period: ${startDate} to ${endDate}`);
  console.log(`  Property: ${GA_PROPERTY_ID}\n`);

  console.log('=== GROUP SCORECARD ===\n');
  printTable(scoreRows.map((row) => ({
    surface: row.surface,
    group: row.group,
    impressions: row.impressions,
    clicks: row.clicks,
    ctr: row.ctr,
    score: row.score,
  })), ['surface', 'group', 'impressions', 'clicks', 'ctr', 'score']);

  console.log('=== RECOMMENDED OVERRIDES ===\n');
  console.log(JSON.stringify(recommendedOverrides, null, 2));
  console.log('');

  if (shouldExport) {
    const outDir = path.join(__dirname, 'seo-reports');
    fs.mkdirSync(outDir, { recursive: true });

    const scoreboardPath = path.join(outDir, `graph-scoreboard-${startDate}-to-${endDate}.json`);
    fs.writeFileSync(scoreboardPath, JSON.stringify({
      startDate,
      endDate,
      groups: scoreRows.map((row) => ({
        surface: row.surface,
        group: row.group,
        impressions: row.raw.impressions,
        clicks: row.raw.clicks,
        ctr: row.raw.ctr,
        score: row.raw.score,
      })),
      recommendedOverrides,
    }, null, 2));

    const overridePath = path.join(outDir, `knowledge-graph-overrides-recommended-${startDate}-to-${endDate}.json`);
    fs.writeFileSync(overridePath, JSON.stringify(recommendedOverrides, null, 2));

    console.log(`Exported scorecard to ${scoreboardPath}`);
    console.log(`Exported recommended overrides to ${overridePath}\n`);
  }
}

main().catch((err) => {
  console.error('Error:', err.message);
  if (String(err.message || '').includes('customEvent:')) {
    console.error('\nGA4 custom dimensions are required for the graph scorecard.');
    console.error('Register these event-scoped custom dimensions in GA4:');
    console.error('  graph_surface');
    console.error('  graph_group');
    console.error('  graph_target_kind');
    console.error('  graph_label');
  }
  process.exit(1);
});
