/**
 * SpotOn Auto - Knowledge Graph Scoreboard
 *
 * Compact GA4 scorecard for graph performance, plus recommended ordering overrides.
 *
 * Usage:
 *   node scripts/graph-scoreboard.js
 *   node scripts/graph-scoreboard.js --start 2026-03-01 --end 2026-03-31 --export
 *   node scripts/graph-scoreboard.js --input scripts/seo-reports/knowledge-graph-overrides-recommended-2026-03-01-to-2026-03-31.json --apply-live
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const KEY_PATH = path.join(__dirname, '..', 'credentials', 'google-service-account.json');
const GA_PROPERTY_ID = '520432705';
const LIVE_OVERRIDE_PATH = path.join(__dirname, '..', 'src', 'data', 'knowledge-graph-overrides.json');
const DEFAULT_SURFACE_BASE = {
  repair: { manual: 90, spec: 80, tool: 60, wiring: 50, dtc: 40, repair: 30 },
  code: { manual: 90, repair: 80, wiring: 70, dtc: 50, tool: 30, spec: 20 },
  wiring: { manual: 90, repair: 75, dtc: 70, wiring: 50, tool: 30, spec: 20 },
};

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

function loadJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function normalizeOverridesPayload(payload) {
  if (payload && payload.recommendedOverrides) {
    return payload.recommendedOverrides;
  }
  return payload;
}

function writeLiveOverrides(recommendedOverrides, meta = {}) {
  const outDir = path.join(__dirname, 'seo-reports');
  fs.mkdirSync(outDir, { recursive: true });

  if (fs.existsSync(LIVE_OVERRIDE_PATH)) {
    const backupStamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(outDir, `knowledge-graph-overrides-backup-${backupStamp}.json`);
    fs.copyFileSync(LIVE_OVERRIDE_PATH, backupPath);
    console.log(`Backed up live overrides to ${backupPath}`);
  }

  fs.writeFileSync(LIVE_OVERRIDE_PATH, JSON.stringify(recommendedOverrides, null, 2) + '\n');
  console.log(`Applied live overrides to ${LIVE_OVERRIDE_PATH}`);

  if (meta.startDate && meta.endDate) {
    console.log(`Applied overrides generated from ${meta.startDate} to ${meta.endDate}`);
  }
  console.log('');
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
  const shouldApplyLive = hasFlag('apply-live');
  const inputPath = getArg('input');
  const graphFilter = buildGraphFilter();

  let scoreRows = [];
  let recommendedOverrides = { surfaces: {} };

  if (inputPath) {
    const resolvedInput = path.isAbsolute(inputPath) ? inputPath : path.join(process.cwd(), inputPath);
    if (!fs.existsSync(resolvedInput)) {
      throw new Error(`Input file not found at ${resolvedInput}`);
    }
    const payload = normalizeOverridesPayload(loadJsonFile(resolvedInput));
    recommendedOverrides = payload;
    console.log(`Loaded recommended overrides from ${resolvedInput}\n`);
  } else {
    const analyticsdata = await buildClient();
    const rows = await runReport(analyticsdata, {
      dateRanges: [{ startDate, endDate }],
      dimensions: [
        { name: 'eventName' },
        { name: 'customEvent:graph_surface' },
        { name: 'customEvent:graph_group' },
      ],
      metrics: [{ name: 'eventCount' }],
      ...(graphFilter ? { dimensionFilter: graphFilter } : {}),
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

    scoreRows = Object.values(grouped)
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

    recommendedOverrides = buildRecommendedOverrides(scoreRows);
  }

  console.log(`\n╔══════════════════════════════════════════════════════════════╗`);
  console.log(`║        SpotOn Auto - Knowledge Graph Scoreboard            ║`);
  console.log(`╚══════════════════════════════════════════════════════════════╝`);
  console.log(`\n  Period: ${startDate} to ${endDate}`);
  console.log(`  Property: ${GA_PROPERTY_ID}\n`);
  if (parseFilterPairs().length || getArg('graph-surface') || getArg('graph-group') || getArg('graph-target-kind') || getArg('graph-label') || getArg('task') || getArg('system')) {
    const filters = [
      ...parseFilterPairs().map(([key, value]) => `${key}=${value}`),
      getArg('graph-surface', null) ? `graph_surface=${getArg('graph-surface', null)}` : null,
      getArg('graph-group', null) ? `graph_group=${getArg('graph-group', null)}` : null,
      getArg('graph-target-kind', null) ? `graph_target_kind=${getArg('graph-target-kind', null)}` : null,
      getArg('graph-label', null) ? `graph_label=${getArg('graph-label', null)}` : null,
      getArg('task', null) ? `task=${getArg('task', null)}` : null,
      getArg('system', null) ? `system=${getArg('system', null)}` : null,
    ].filter(Boolean);
    console.log(`  Active filters: ${filters.join(' | ')}\n`);
  }

  if (scoreRows.length > 0) {
    console.log('=== GROUP SCORECARD ===\n');
    printTable(scoreRows.map((row) => ({
      surface: row.surface,
      group: row.group,
      impressions: row.impressions,
      clicks: row.clicks,
      ctr: row.ctr,
      score: row.score,
    })), ['surface', 'group', 'impressions', 'clicks', 'ctr', 'score']);
  }

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

  if (shouldApplyLive) {
    writeLiveOverrides(recommendedOverrides, { startDate, endDate });
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
    console.error('  task');
    console.error('  system');
  }
  process.exit(1);
});
