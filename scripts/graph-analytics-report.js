/**
 * SpotOn Auto - Knowledge Graph Analytics Report (GA4)
 *
 * Usage:
 *   node scripts/graph-analytics-report.js
 *   node scripts/graph-analytics-report.js --start 2026-03-01 --end 2026-03-31
 *   node scripts/graph-analytics-report.js --export
 *
 * Required GA4 custom dimensions (event-scoped):
 *   - graph_surface
 *   - graph_group
 *   - graph_target_kind
 *   - graph_label
 *   - task
 *   - system
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const KEY_PATH = path.join(__dirname, '..', 'credentials', 'google-service-account.json');
const GA_PROPERTY_ID = '520432705';

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

function getArg(name, fallback = null) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return fallback;
  return process.argv[idx + 1] || fallback;
}

function getAllArgValues(name) {
  const values = [];
  for (let i = 0; i < process.argv.length; i += 1) {
    if (process.argv[i] !== `--${name}`) continue;
    const value = process.argv[i + 1];
    if (value && !value.startsWith('--')) values.push(value);
  }
  return values;
}

function parseCsv(value) {
  return String(value || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

function parseFilterPairs() {
  const pairs = [];
  for (const raw of getAllArgValues('filter')) {
    const idx = raw.indexOf('=');
    if (idx === -1) continue;
    const key = raw.slice(0, idx).trim();
    const value = raw.slice(idx + 1).trim();
    if (!key || !value) continue;
    pairs.push([key, value]);
  }
  return pairs;
}

function buildAndFilter(expressions) {
  const validExpressions = expressions.filter(Boolean);
  if (!validExpressions.length) return undefined;
  if (validExpressions.length === 1) return validExpressions[0];
  return { andGroup: { expressions: validExpressions } };
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

function buildGraphFilter() {
  const expressions = [{
    filter: {
      fieldName: 'eventName',
      inListFilter: {
        values: ['knowledge_graph_impression', 'knowledge_graph_click'],
      },
    },
  }];

  for (const [key, value] of parseFilterPairs()) {
    const values = parseCsv(value);
    expressions.push({
      filter: {
        fieldName: `customEvent:${key}`,
        ...(values.length > 1
          ? { inListFilter: { values } }
          : { stringFilter: { value: values[0] } }),
      },
    });
  }

  for (const [flagName, paramName] of [
    ['graph-surface', 'graph_surface'],
    ['graph-group', 'graph_group'],
    ['graph-target-kind', 'graph_target_kind'],
    ['graph-label', 'graph_label'],
    ['task', 'task'],
    ['system', 'system'],
  ]) {
    const value = getArg(flagName, null);
    if (!value) continue;
    const values = parseCsv(value);
    expressions.push({
      filter: {
        fieldName: `customEvent:${paramName}`,
        ...(values.length > 1
          ? { inListFilter: { values } }
          : { stringFilter: { value: values[0] } }),
      },
    });
  }

  return buildAndFilter(expressions);
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

async function main() {
  const today = new Date().toISOString().slice(0, 10);
  const endDate = getArg('end', addDays(today, -1));
  const startDate = getArg('start', addDays(endDate, -6));
  const shouldExport = hasFlag('export');
  const analyticsdata = await buildClient();
  const graphFilter = buildGraphFilter();

  const [eventCounts, bySurfaceGroup, topClicks] = await Promise.all([
    runReport(analyticsdata, {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'eventName' }],
      metrics: [{ name: 'eventCount' }],
      ...(graphFilter ? { dimensionFilter: graphFilter } : {}),
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
    }),
    runReport(analyticsdata, {
      dateRanges: [{ startDate, endDate }],
      dimensions: [
        { name: 'eventName' },
        { name: 'customEvent:graph_surface' },
        { name: 'customEvent:graph_group' },
      ],
      metrics: [{ name: 'eventCount' }],
      ...(graphFilter ? { dimensionFilter: graphFilter } : {}),
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      limit: 100,
    }),
    runReport(analyticsdata, {
      dateRanges: [{ startDate, endDate }],
      dimensions: [
        { name: 'customEvent:graph_surface' },
        { name: 'customEvent:graph_group' },
        { name: 'customEvent:graph_target_kind' },
        { name: 'customEvent:graph_label' },
      ],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: buildAndFilter([
        {
          filter: {
            fieldName: 'eventName',
            stringFilter: { value: 'knowledge_graph_click' },
          },
        },
        graphFilter,
      ]),
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      limit: 50,
    }),
  ]);

  let byContextTaskSystem = [];
  try {
    byContextTaskSystem = await runReport(analyticsdata, {
      dateRanges: [{ startDate, endDate }],
      dimensions: [
        { name: 'customEvent:graph_surface' },
        { name: 'customEvent:graph_group' },
        { name: 'customEvent:task' },
        { name: 'customEvent:system' },
      ],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: buildAndFilter([
        {
          filter: {
            fieldName: 'eventName',
            inListFilter: { values: ['knowledge_graph_impression', 'knowledge_graph_click'] },
          },
        },
        graphFilter,
      ]),
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      limit: 50,
    });
  } catch (err) {
    if (!isOptionalDimensionError(err)) throw err;
  }

  const counts = Object.fromEntries(eventCounts.map((row) => [
    row.dimensionValues?.[0]?.value,
    Number(row.metricValues?.[0]?.value || 0),
  ]));

  const grouped = {};
  for (const row of bySurfaceGroup) {
    const eventName = row.dimensionValues?.[0]?.value || '';
    const surface = row.dimensionValues?.[1]?.value || '(not set)';
    const group = row.dimensionValues?.[2]?.value || '(not set)';
    const count = Number(row.metricValues?.[0]?.value || 0);
    const key = `${surface}::${group}`;
    if (!grouped[key]) grouped[key] = { surface, group, impressions: 0, clicks: 0 };
    if (eventName === 'knowledge_graph_impression') grouped[key].impressions += count;
    if (eventName === 'knowledge_graph_click') grouped[key].clicks += count;
  }

  const surfaceRows = Object.values(grouped)
    .map((row) => ({
      surface: row.surface,
      group: row.group,
      impressions: fmt(row.impressions),
      clicks: fmt(row.clicks),
      ctr: `${pct(row.clicks, row.impressions).toFixed(1)}%`,
    }))
    .sort((a, b) => Number(b.clicks.replace(/,/g, '')) - Number(a.clicks.replace(/,/g, '')));

  const topClickRows = topClicks.map((row) => ({
    surface: row.dimensionValues?.[0]?.value || '(not set)',
    group: row.dimensionValues?.[1]?.value || '(not set)',
    target: row.dimensionValues?.[2]?.value || '(not set)',
    label: row.dimensionValues?.[3]?.value || '(not set)',
    clicks: fmt(row.metricValues?.[0]?.value || 0),
  }));

  console.log(`\n╔══════════════════════════════════════════════════════════════╗`);
  console.log(`║      SpotOn Auto - Knowledge Graph Analytics Report         ║`);
  console.log(`╚══════════════════════════════════════════════════════════════╝`);
  console.log(`\n  Period: ${startDate} to ${endDate}`);
  console.log(`  Property: ${GA_PROPERTY_ID}\n`);

  console.log('=== EVENT TOTALS ===\n');
  console.log(`  knowledge_graph_impression: ${fmt(counts.knowledge_graph_impression || 0)}`);
  console.log(`  knowledge_graph_click: ${fmt(counts.knowledge_graph_click || 0)}`);
  console.log(`  overall CTR: ${pct(counts.knowledge_graph_click || 0, counts.knowledge_graph_impression || 0).toFixed(1)}%\n`);

  console.log('=== BY SURFACE / GROUP ===\n');
  printTable(surfaceRows, ['surface', 'group', 'impressions', 'clicks', 'ctr']);

  console.log('=== TOP CLICKED GRAPH PATHS ===\n');
  printTable(topClickRows, ['surface', 'group', 'target', 'clicks', 'label']);

  if (byContextTaskSystem.length) {
    const contextRows = byContextTaskSystem.map((row) => ({
      surface: row.dimensionValues?.[0]?.value || '(not set)',
      group: row.dimensionValues?.[1]?.value || '(not set)',
      task: row.dimensionValues?.[2]?.value || '(not set)',
      system: row.dimensionValues?.[3]?.value || '(not set)',
      clicks: fmt(row.metricValues?.[0]?.value || 0),
    }));

    console.log('=== GRAPH CONTEXT BY TASK / SYSTEM ===\n');
    printTable(contextRows, ['surface', 'group', 'task', 'system', 'clicks']);
  }

  if (shouldExport) {
    const outPath = path.join(
      __dirname,
      'seo-reports',
      `graph-analytics-${startDate}-to-${endDate}.json`,
    );
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify({
      startDate,
      endDate,
      totals: counts,
      bySurfaceGroup: surfaceRows,
      topClicks: topClickRows,
    }, null, 2));
    console.log(`Exported report to ${outPath}\n`);
  }
}

main().catch((err) => {
  console.error('Error:', err.message);
  if (String(err.message || '').includes('customEvent:')) {
    console.error('\nGA4 custom dimensions are required for the graph report.');
    console.error('Register these event-scoped custom dimensions in GA4:');
    console.error('  graph_surface');
    console.error('  graph_group');
    console.error('  graph_target_kind');
    console.error('  graph_label');
    console.error('  task');
    console.error('  system');
  }
  process.exit(1);
});
