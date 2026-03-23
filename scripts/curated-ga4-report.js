/**
 * SpotOn Auto - Curated GA4 Report
 *
 * A highly filtered GA4 CLI for the repair / wiring / knowledge-graph funnels.
 *
 * Usage:
 *   node scripts/curated-ga4-report.js
 *   node scripts/curated-ga4-report.js --start 2026-03-01 --end 2026-03-22
 *   node scripts/curated-ga4-report.js --organic-only --country-include US
 *   node scripts/curated-ga4-report.js --page-surface repair,wiring --intent-cluster battery
 *
 * Supported filters:
 *   --start YYYY-MM-DD | 14daysAgo | 28daysAgo
 *   --end YYYY-MM-DD | yesterday | today
 *   --days N
 *   --organic-only
 *   --country-include US,CA
 *   --country-exclude SG,IN
 *   --source-include google,bing
 *   --source-exclude (direct),newsletter
 *   --medium-include organic,referral
 *   --medium-exclude cpc,display
 *   --page-surface repair,wiring,codes,symptoms,manual,tools,parts,guides,home
 *   --event-names guide_generated,repair_answer_click
 *   --intent-cluster battery,brakes,lighting
 *   --top 10
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const KEY_PATH = path.join(__dirname, '..', 'credentials', 'google-service-account.json');
const GA_PROPERTY_ID = '520432705';

const DEFAULT_KEY_EVENTS = [
  'guide_generated',
  'guide_step_view',
  'guide_step_expand',
  'guide_completion',
  'repair_page_view',
  'repair_guide_open',
  'repair_answer_impression',
  'repair_answer_click',
  'knowledge_graph_impression',
  'knowledge_graph_click',
  'vehicle_search',
  'manual_retrieval',
  'affiliate_click',
  'shop_all_click',
  'tool_affiliate_click',
  'wiring_seo_view',
  'wiring_cta_click',
  'wiring_diagram_open',
  'wiring_diagram_search',
  'wiring_system_toggle',
  'wiring_diagram_exit',
  'wiring_diagram_interact',
  'diagnostic_start',
  'vin_decode',
  'sign_up',
  'login',
];

const SURFACE_PREFIXES = {
  home: ['/'],
  repair: ['/repair'],
  wiring: ['/wiring'],
  codes: ['/codes'],
  symptoms: ['/symptoms'],
  symptom: ['/symptoms'],
  manual: ['/manual'],
  tools: ['/tools'],
  parts: ['/parts'],
  guides: ['/guides'],
  diagnose: ['/diagnose'],
};

const CUSTOM_DIMENSION_CANDIDATES = [
  'intent_cluster',
  'page_surface',
  'guide_step',
  'guide_step_bucket',
  'guide_step_action',
  'guide_completion_reason',
  'guide_completion_total_steps',
  'guide_completion_viewed_steps',
  'repair_answer_section',
  'repair_answer_target',
  'repair_answer_label',
  'repair_answer_cta_layer',
  'repair_answer_cta_kind',
  'repair_answer_vehicle',
  'repair_answer_task',
  'graph_surface',
  'graph_group',
  'graph_target_kind',
  'graph_label',
  'wiring_search_scope',
  'wiring_search_length_bucket',
  'wiring_search_result_bucket',
  'wiring_system_action',
  'wiring_diagram_action',
  'wiring_exit_kind',
  'entry_surface',
  'entry_destination',
];

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

function getListArg(name) {
  const raw = getArg(name, '');
  if (!raw) return [];
  return String(raw)
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`) || process.argv.includes(`--${name}=true`);
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

  const credentials = JSON.parse(fs.readFileSync(KEY_PATH, 'utf8'));
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
  });

  return google.analyticsdata({ version: 'v1beta', auth });
}

function normalizeDimensionName(name) {
  return String(name || '').trim();
}

function buildSurfacePrefixes(values) {
  const prefixes = [];
  for (const value of values) {
    const normalized = normalizeDimensionName(value).toLowerCase();
    if (!normalized) continue;
    if (normalized.startsWith('/')) {
      prefixes.push(normalized);
      continue;
    }
    if (SURFACE_PREFIXES[normalized]) {
      prefixes.push(...SURFACE_PREFIXES[normalized]);
      continue;
    }
    prefixes.push(`/${normalized}`);
  }
  return prefixes;
}

function andExpressions(expressions) {
  const cleaned = expressions.filter(Boolean);
  if (!cleaned.length) return undefined;
  if (cleaned.length === 1) return cleaned[0];
  return { andGroup: { expressions: cleaned } };
}

function fieldInList(fieldName, values) {
  if (!values.length) return null;
  return {
    filter: {
      fieldName,
      inListFilter: { values },
    },
  };
}

function fieldNotInList(fieldName, values) {
  if (!values.length) return null;
  return {
    notExpression: {
      filter: {
        fieldName,
        inListFilter: { values },
      },
    },
  };
}

function fieldBeginsWith(fieldName, value) {
  if (!value) return null;
  return {
    filter: {
      fieldName,
      stringFilter: {
        matchType: 'BEGINS_WITH',
        value,
      },
    },
  };
}

function fieldEquals(fieldName, value) {
  if (!value) return null;
  return {
    filter: {
      fieldName,
      stringFilter: {
        matchType: 'EXACT',
        value,
      },
    },
  };
}

function buildBaseFilter(args) {
  const expressions = [];
  const pageSurfaces = getListArg('page-surface');
  const countryInclude = getListArg('country-include');
  const countryExclude = getListArg('country-exclude');
  const sourceInclude = getListArg('source-include');
  const sourceExclude = getListArg('source-exclude');
  const mediumInclude = getListArg('medium-include');
  const mediumExclude = getListArg('medium-exclude');
  const eventInclude = getListArg('event-names');
  const eventExclude = getListArg('event-exclude');
  const intentClusters = getListArg('intent-cluster');

  if (args.organicOnly) {
    expressions.push(fieldInList('sessionMedium', ['organic']));
  }
  if (countryInclude.length) expressions.push(fieldInList('countryId', countryInclude));
  if (countryExclude.length) expressions.push(fieldNotInList('countryId', countryExclude));
  if (sourceInclude.length) expressions.push(fieldInList('sessionSource', sourceInclude));
  if (sourceExclude.length) expressions.push(fieldNotInList('sessionSource', sourceExclude));
  if (mediumInclude.length) expressions.push(fieldInList('sessionMedium', mediumInclude));
  if (mediumExclude.length) expressions.push(fieldNotInList('sessionMedium', mediumExclude));

  if (pageSurfaces.length) {
    const prefixes = buildSurfacePrefixes(pageSurfaces);
    const pathExpressions = prefixes.map((prefix) => (
      prefix === '/' ? fieldEquals('pagePath', '/') : fieldBeginsWith('pagePath', prefix)
    )).filter(Boolean);
    if (pathExpressions.length === 1) expressions.push(pathExpressions[0]);
    else if (pathExpressions.length > 1) expressions.push({ orGroup: { expressions: pathExpressions } });
  }

  if (eventInclude.length) expressions.push(fieldInList('eventName', eventInclude));
  if (eventExclude.length) expressions.push(fieldNotInList('eventName', eventExclude));

  return {
    filter: andExpressions(expressions),
    intentClusters,
    pageSurfaces,
  };
}

async function runReport(analyticsdata, requestBody, label) {
  try {
    const response = await analyticsdata.properties.runReport({
      property: `properties/${GA_PROPERTY_ID}`,
      requestBody,
    });
    return response.data.rows || [];
  } catch (err) {
    console.error(`  Skipping ${label}: ${err.message}`);
    return [];
  }
}

async function probeCustomDimensions(analyticsdata) {
  const available = {};

  for (const dim of CUSTOM_DIMENSION_CANDIDATES) {
    try {
      await analyticsdata.properties.runReport({
        property: `properties/${GA_PROPERTY_ID}`,
        requestBody: {
          dateRanges: [{ startDate: '2026-01-01', endDate: '2026-01-02' }],
          dimensions: [
            { name: 'eventName' },
            { name: `customEvent:${dim}` },
          ],
          metrics: [{ name: 'eventCount' }],
          limit: 1,
        },
      });
      available[dim] = true;
    } catch {
      available[dim] = false;
    }
  }

  return available;
}

function pickAvailableIntentDimension(availableDims) {
  const candidates = ['intent_cluster', 'repair_answer_task', 'page_surface', 'entry_surface'];
  return candidates.find((dim) => availableDims[dim]) || null;
}

function classifySurface(pagePath) {
  const pathValue = String(pagePath || '/');
  if (pathValue.startsWith('/repair/')) return 'repair';
  if (pathValue.startsWith('/wiring/')) return 'wiring';
  if (pathValue.startsWith('/codes/')) return 'codes';
  if (pathValue.startsWith('/symptoms/')) return 'symptoms';
  if (pathValue.startsWith('/manual/')) return 'manual';
  if (pathValue.startsWith('/tools/')) return 'tools';
  if (pathValue.startsWith('/parts/')) return 'parts';
  if (pathValue.startsWith('/guides/')) return 'guides';
  if (pathValue.startsWith('/diagnose')) return 'diagnose';
  if (pathValue === '/' || pathValue === '') return 'home';
  return 'other';
}

function summarizeSurfaces(rows) {
  const grouped = {};
  for (const row of rows) {
    const pagePath = row.dimensionValues?.[0]?.value || '';
    const surface = classifySurface(pagePath);
    const sessions = Number(row.metricValues?.[0]?.value || 0);
    const views = Number(row.metricValues?.[1]?.value || 0);
    if (!grouped[surface]) grouped[surface] = { surface, sessions: 0, views: 0, pages: 0 };
    grouped[surface].sessions += sessions;
    grouped[surface].views += views;
    grouped[surface].pages += 1;
  }

  return Object.values(grouped)
    .map((row) => ({
      surface: row.surface,
      pages: fmt(row.pages),
      sessions: fmt(row.sessions),
      views: fmt(row.views),
      views_per_page: row.pages ? fmt(row.views / row.pages, 1) : '0.0',
    }))
    .sort((a, b) => Number(b.views.replace(/,/g, '')) - Number(a.views.replace(/,/g, '')));
}

async function main() {
  const today = new Date().toISOString().slice(0, 10);
  const days = Number(getArg('days', '14'));
  const endDate = getArg('end', 'yesterday') === 'today' ? today : getArg('end', addDays(today, -1));
  const startDate = getArg('start', getArg('days') ? addDays(endDate, -(Math.max(1, days) - 1)) : addDays(endDate, -13));
  const limit = Number(getArg('top', '10'));
  const organicOnly = hasFlag('organic-only');

  const filters = buildBaseFilter({ organicOnly });
  const analyticsdata = await buildClient();
  const availableDims = await probeCustomDimensions(analyticsdata);
  const intentDimension = pickAvailableIntentDimension(availableDims);
  const intentFilterExpr = filters.intentClusters.length && intentDimension
    ? fieldInList(`customEvent:${intentDimension}`, filters.intentClusters)
    : null;

  const keyEventNames = getListArg('event-names').length ? getListArg('event-names') : DEFAULT_KEY_EVENTS;
  const keyEvents = await runReport(analyticsdata, {
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'eventName' }],
    metrics: [{ name: 'eventCount' }],
    dimensionFilter: andExpressions([
      fieldInList('eventName', keyEventNames),
      filters.filter,
      intentFilterExpr,
    ]),
    orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
    limit: 100,
  }, 'key events');

  const repairAnswerRows = await runReport(analyticsdata, {
    dateRanges: [{ startDate, endDate }],
    dimensions: [
      { name: 'eventName' },
      ...(availableDims.repair_answer_section ? [{ name: 'customEvent:repair_answer_section' }] : []),
      ...(availableDims.repair_answer_target ? [{ name: 'customEvent:repair_answer_target' }] : []),
    ],
    metrics: [{ name: 'eventCount' }],
    dimensionFilter: andExpressions([
      fieldInList('eventName', ['repair_answer_impression', 'repair_answer_click']),
      filters.filter,
      intentFilterExpr,
    ]),
    orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
    limit: 100,
  }, 'repair-answer funnel');

  const knowledgeGraphRows = await runReport(analyticsdata, {
    dateRanges: [{ startDate, endDate }],
    dimensions: [
      { name: 'eventName' },
      ...(availableDims.graph_surface ? [{ name: 'customEvent:graph_surface' }] : []),
      ...(availableDims.graph_group ? [{ name: 'customEvent:graph_group' }] : []),
      ...(availableDims.graph_target_kind ? [{ name: 'customEvent:graph_target_kind' }] : []),
    ],
    metrics: [{ name: 'eventCount' }],
    dimensionFilter: andExpressions([
      fieldInList('eventName', ['knowledge_graph_impression', 'knowledge_graph_click']),
      filters.filter,
      intentFilterExpr,
    ]),
    orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
    limit: 100,
  }, 'knowledge-graph funnel');

  const guideProgressDimensions = [
    'eventName',
    ...(availableDims.guide_step_action ? ['customEvent:guide_step_action'] : []),
    ...(availableDims.guide_step ? ['customEvent:guide_step'] : []),
    ...(availableDims.guide_step_bucket ? ['customEvent:guide_step_bucket'] : []),
    ...(availableDims.guide_completion_reason ? ['customEvent:guide_completion_reason'] : []),
  ];

  const guideProgressRows = await runReport(analyticsdata, {
    dateRanges: [{ startDate, endDate }],
    dimensions: guideProgressDimensions.map((name) => ({ name })),
    metrics: [{ name: 'eventCount' }],
    dimensionFilter: andExpressions([
      fieldInList('eventName', ['guide_step_view', 'guide_step_expand', 'guide_completion']),
      filters.filter,
      intentFilterExpr,
    ]),
    orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
    limit: 100,
  }, 'guide progression');

  const wiringInteractionDimensions = [
    'eventName',
    ...(availableDims.wiring_diagram_action ? ['customEvent:wiring_diagram_action'] : []),
    ...(availableDims.wiring_search_scope ? ['customEvent:wiring_search_scope'] : []),
    ...(availableDims.wiring_search_length_bucket ? ['customEvent:wiring_search_length_bucket'] : []),
    ...(availableDims.wiring_search_result_bucket ? ['customEvent:wiring_search_result_bucket'] : []),
    ...(availableDims.wiring_system_action ? ['customEvent:wiring_system_action'] : []),
    ...(availableDims.wiring_exit_kind ? ['customEvent:wiring_exit_kind'] : []),
  ];

  const wiringInteractionRows = await runReport(analyticsdata, {
    dateRanges: [{ startDate, endDate }],
    dimensions: wiringInteractionDimensions.map((name) => ({ name })),
    metrics: [{ name: 'eventCount' }],
    dimensionFilter: andExpressions([
      fieldInList('eventName', ['wiring_diagram_search', 'wiring_system_toggle', 'wiring_diagram_exit', 'wiring_diagram_interact']),
      filters.filter,
      intentFilterExpr,
    ]),
    orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
    limit: 100,
  }, 'wiring interactions');

  const repairCtaDimensions = [
    'eventName',
    ...(availableDims.repair_answer_section ? ['customEvent:repair_answer_section'] : []),
    ...(availableDims.repair_answer_target ? ['customEvent:repair_answer_target'] : []),
    ...(availableDims.repair_answer_cta_layer ? ['customEvent:repair_answer_cta_layer'] : []),
    ...(availableDims.repair_answer_cta_kind ? ['customEvent:repair_answer_cta_kind'] : []),
  ];

  const repairCtaRows = await runReport(analyticsdata, {
    dateRanges: [{ startDate, endDate }],
    dimensions: repairCtaDimensions.map((name) => ({ name })),
    metrics: [{ name: 'eventCount' }],
    dimensionFilter: andExpressions([
      fieldInList('eventName', ['repair_answer_click']),
      filters.filter,
      intentFilterExpr,
    ]),
    orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
    limit: 100,
  }, 'repair CTA layers');

  const pageRows = await runReport(analyticsdata, {
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'pagePath' }],
    metrics: [{ name: 'sessions' }, { name: 'screenPageViews' }],
    dimensionFilter: andExpressions([filters.filter, intentFilterExpr]),
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    limit: 500,
  }, 'surface report');

  const intentRows = intentDimension ? await runReport(analyticsdata, {
    dateRanges: [{ startDate, endDate }],
    dimensions: [
      { name: 'eventName' },
      { name: `customEvent:${intentDimension}` },
    ],
    metrics: [{ name: 'eventCount' }],
    dimensionFilter: andExpressions([
      fieldInList('eventName', ['repair_answer_click', 'knowledge_graph_click', 'guide_generated', 'vehicle_search']),
      filters.filter,
      intentFilterExpr,
    ]),
    orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
    limit: 100,
  }, 'intent cluster report') : [];

  const keyTotals = Object.fromEntries(keyEvents.map((row) => [
    row.dimensionValues?.[0]?.value,
    Number(row.metricValues?.[0]?.value || 0),
  ]));

  const repairTotals = repairAnswerRows.reduce((acc, row) => {
    const eventName = row.dimensionValues?.[0]?.value || '';
    acc[eventName] = (acc[eventName] || 0) + Number(row.metricValues?.[0]?.value || 0);
    return acc;
  }, {});

  const kgTotals = knowledgeGraphRows.reduce((acc, row) => {
    const eventName = row.dimensionValues?.[0]?.value || '';
    acc[eventName] = (acc[eventName] || 0) + Number(row.metricValues?.[0]?.value || 0);
    return acc;
  }, {});

  const guideTotals = guideProgressRows.reduce((acc, row) => {
    const eventName = row.dimensionValues?.[0]?.value || '';
    acc[eventName] = (acc[eventName] || 0) + Number(row.metricValues?.[0]?.value || 0);
    return acc;
  }, {});

  const wiringTotals = wiringInteractionRows.reduce((acc, row) => {
    const eventName = row.dimensionValues?.[0]?.value || '';
    acc[eventName] = (acc[eventName] || 0) + Number(row.metricValues?.[0]?.value || 0);
    return acc;
  }, {});

  const repairCtaTotals = repairCtaRows.reduce((acc, row) => {
    const eventName = row.dimensionValues?.[0]?.value || '';
    acc[eventName] = (acc[eventName] || 0) + Number(row.metricValues?.[0]?.value || 0);
    return acc;
  }, {});

  const repairBySection = {};
  for (const row of repairAnswerRows) {
    const eventName = row.dimensionValues?.[0]?.value || '';
    const section = row.dimensionValues?.[1]?.value || '(not set)';
    const target = row.dimensionValues?.[2]?.value || '(not set)';
    const count = Number(row.metricValues?.[0]?.value || 0);
    const key = `${section}::${target}`;
    if (!repairBySection[key]) repairBySection[key] = { section, target, impressions: 0, clicks: 0 };
    if (eventName === 'repair_answer_impression') repairBySection[key].impressions += count;
    if (eventName === 'repair_answer_click') repairBySection[key].clicks += count;
  }

  const kgByGroup = {};
  for (const row of knowledgeGraphRows) {
    const eventName = row.dimensionValues?.[0]?.value || '';
    const surface = row.dimensionValues?.[1]?.value || '(not set)';
    const group = row.dimensionValues?.[2]?.value || '(not set)';
    const target = row.dimensionValues?.[3]?.value || '(not set)';
    const count = Number(row.metricValues?.[0]?.value || 0);
    const key = `${surface}::${group}::${target}`;
    if (!kgByGroup[key]) kgByGroup[key] = { surface, group, target, impressions: 0, clicks: 0 };
    if (eventName === 'knowledge_graph_impression') kgByGroup[key].impressions += count;
    if (eventName === 'knowledge_graph_click') kgByGroup[key].clicks += count;
  }

  const guideByStep = {};
  const guideProgressIndex = Object.fromEntries(guideProgressDimensions.map((name, index) => [name, index]));
  for (const row of guideProgressRows) {
    const eventName = row.dimensionValues?.[guideProgressIndex.eventName]?.value || '';
    const action = guideProgressIndex['customEvent:guide_step_action'] !== undefined ? row.dimensionValues?.[guideProgressIndex['customEvent:guide_step_action']]?.value || '(not set)' : '(not set)';
    const step = guideProgressIndex['customEvent:guide_step'] !== undefined ? row.dimensionValues?.[guideProgressIndex['customEvent:guide_step']]?.value || '(not set)' : '(not set)';
    const bucket = guideProgressIndex['customEvent:guide_step_bucket'] !== undefined ? row.dimensionValues?.[guideProgressIndex['customEvent:guide_step_bucket']]?.value || '(not set)' : '(not set)';
    const reason = guideProgressIndex['customEvent:guide_completion_reason'] !== undefined ? row.dimensionValues?.[guideProgressIndex['customEvent:guide_completion_reason']]?.value || '(not set)' : '(not set)';
    const count = Number(row.metricValues?.[0]?.value || 0);
    const key = `${action}::${step}::${bucket}::${reason}`;
    if (!guideByStep[key]) guideByStep[key] = { action, step, bucket, reason, count: 0 };
    guideByStep[key].count += count;
  }

  const wiringByAction = {};
  const wiringInteractionIndex = Object.fromEntries(wiringInteractionDimensions.map((name, index) => [name, index]));
  for (const row of wiringInteractionRows) {
    const eventName = row.dimensionValues?.[wiringInteractionIndex.eventName]?.value || '';
    const action = wiringInteractionIndex['customEvent:wiring_diagram_action'] !== undefined ? row.dimensionValues?.[wiringInteractionIndex['customEvent:wiring_diagram_action']]?.value || '(not set)' : '(not set)';
    const scope = wiringInteractionIndex['customEvent:wiring_search_scope'] !== undefined ? row.dimensionValues?.[wiringInteractionIndex['customEvent:wiring_search_scope']]?.value || '(not set)' : '(not set)';
    const lengthBucket = wiringInteractionIndex['customEvent:wiring_search_length_bucket'] !== undefined ? row.dimensionValues?.[wiringInteractionIndex['customEvent:wiring_search_length_bucket']]?.value || '(not set)' : '(not set)';
    const resultBucket = wiringInteractionIndex['customEvent:wiring_search_result_bucket'] !== undefined ? row.dimensionValues?.[wiringInteractionIndex['customEvent:wiring_search_result_bucket']]?.value || '(not set)' : '(not set)';
    const systemAction = wiringInteractionIndex['customEvent:wiring_system_action'] !== undefined ? row.dimensionValues?.[wiringInteractionIndex['customEvent:wiring_system_action']]?.value || '(not set)' : '(not set)';
    const exitKind = wiringInteractionIndex['customEvent:wiring_exit_kind'] !== undefined ? row.dimensionValues?.[wiringInteractionIndex['customEvent:wiring_exit_kind']]?.value || '(not set)' : '(not set)';
    const count = Number(row.metricValues?.[0]?.value || 0);
    const key = `${action}::${scope}::${lengthBucket}::${resultBucket}::${systemAction}::${exitKind}`;
    if (!wiringByAction[key]) wiringByAction[key] = { action, scope, lengthBucket, resultBucket, systemAction, exitKind, count: 0 };
    wiringByAction[key].count += count;
  }

  const repairCtaByLayer = {};
  const repairCtaIndex = Object.fromEntries(repairCtaDimensions.map((name, index) => [name, index]));
  for (const row of repairCtaRows) {
    const eventName = row.dimensionValues?.[repairCtaIndex.eventName]?.value || '';
    const section = repairCtaIndex['customEvent:repair_answer_section'] !== undefined ? row.dimensionValues?.[repairCtaIndex['customEvent:repair_answer_section']]?.value || '(not set)' : '(not set)';
    const target = repairCtaIndex['customEvent:repair_answer_target'] !== undefined ? row.dimensionValues?.[repairCtaIndex['customEvent:repair_answer_target']]?.value || '(not set)' : '(not set)';
    const layer = repairCtaIndex['customEvent:repair_answer_cta_layer'] !== undefined ? row.dimensionValues?.[repairCtaIndex['customEvent:repair_answer_cta_layer']]?.value || '(not set)' : '(not set)';
    const kind = repairCtaIndex['customEvent:repair_answer_cta_kind'] !== undefined ? row.dimensionValues?.[repairCtaIndex['customEvent:repair_answer_cta_kind']]?.value || '(not set)' : '(not set)';
    const count = Number(row.metricValues?.[0]?.value || 0);
    const key = `${section}::${target}::${layer}::${kind}`;
    if (!repairCtaByLayer[key]) repairCtaByLayer[key] = { section, target, layer, kind, clicks: 0 };
    if (eventName === 'repair_answer_click') repairCtaByLayer[key].clicks += count;
  }

  const surfaceRows = summarizeSurfaces(pageRows).slice(0, limit);
  const repairRows = Object.values(repairBySection)
    .map((row) => ({
      section: row.section,
      target: row.target,
      impressions: fmt(row.impressions),
      clicks: fmt(row.clicks),
      ctr: `${pct(row.clicks, row.impressions).toFixed(1)}%`,
    }))
    .sort((a, b) => Number(b.clicks.replace(/,/g, '')) - Number(a.clicks.replace(/,/g, '')))
    .slice(0, limit);

  const kgRows = Object.values(kgByGroup)
    .map((row) => ({
      surface: row.surface,
      group: row.group,
      target: row.target,
      impressions: fmt(row.impressions),
      clicks: fmt(row.clicks),
      ctr: `${pct(row.clicks, row.impressions).toFixed(1)}%`,
    }))
    .sort((a, b) => Number(b.clicks.replace(/,/g, '')) - Number(a.clicks.replace(/,/g, '')))
    .slice(0, limit);

  const intentRowsSummarized = intentRows.map((row) => ({
    event: row.dimensionValues?.[0]?.value || '(not set)',
    intent: row.dimensionValues?.[1]?.value || '(not set)',
    clicks: fmt(row.metricValues?.[0]?.value || 0),
  })).slice(0, limit);

  console.log(`\n╔══════════════════════════════════════════════════════════════╗`);
  console.log(`║            SpotOn Auto - Curated GA4 Report                 ║`);
  console.log(`╚══════════════════════════════════════════════════════════════╝`);
  console.log(`\n  Period: ${startDate} to ${endDate}`);
  console.log(`  Property: ${GA_PROPERTY_ID}`);
  console.log(`  Filters:`);
  console.log(`    organic-only: ${organicOnly ? 'yes' : 'no'}`);
  console.log(`    page-surface: ${filters.pageSurfaces.length ? filters.pageSurfaces.join(', ') : '(all)'}`);
  console.log(`    intent-cluster: ${filters.intentClusters.length ? filters.intentClusters.join(', ') : '(all)'}`);
  console.log(`    intent dimension: ${intentDimension ? `customEvent:${intentDimension}` : '(unavailable)'}`);
  console.log(`    country include/exclude: ${getListArg('country-include').join(', ') || '(all)'}/${getListArg('country-exclude').join(', ') || '(none)'}`);
  console.log(`    source include/exclude: ${getListArg('source-include').join(', ') || '(all)'}/${getListArg('source-exclude').join(', ') || '(none)'}`);
  console.log(`    medium include/exclude: ${getListArg('medium-include').join(', ') || '(all)'}/${getListArg('medium-exclude').join(', ') || '(none)'}\n`);

  console.log('=== KEY EVENTS ===\n');
  printTable(
    keyEventNames
      .map((event) => ({ event, count: fmt(keyTotals[event] || 0) }))
      .sort((a, b) => Number(b.count.replace(/,/g, '')) - Number(a.count.replace(/,/g, ''))),
    ['event', 'count'],
  );

  console.log('=== GUIDE PROGRESSION ===\n');
  console.log(`  guide_step_view: ${fmt(guideTotals.guide_step_view || 0)}`);
  console.log(`  guide_step_expand: ${fmt(guideTotals.guide_step_expand || 0)}`);
  console.log(`  guide_completion: ${fmt(guideTotals.guide_completion || 0)}\n`);
  printTable(
    Object.values(guideByStep)
      .map((row) => ({
        action: row.action,
        step: row.step,
        bucket: row.bucket,
        reason: row.reason,
        count: fmt(row.count),
      }))
      .slice(0, limit),
    ['action', 'step', 'bucket', 'reason', 'count'],
  );

  console.log('=== WIRING INTERACTIONS ===\n');
  console.log(`  wiring_diagram_search: ${fmt(wiringTotals.wiring_diagram_search || 0)}`);
  console.log(`  wiring_system_toggle: ${fmt(wiringTotals.wiring_system_toggle || 0)}`);
  console.log(`  wiring_diagram_exit: ${fmt(wiringTotals.wiring_diagram_exit || 0)}`);
  console.log(`  wiring_diagram_interact: ${fmt(wiringTotals.wiring_diagram_interact || 0)}\n`);
  printTable(
    Object.values(wiringByAction)
      .map((row) => ({
        action: row.action,
        scope: row.scope,
        length_bucket: row.lengthBucket,
        result_bucket: row.resultBucket,
        system_action: row.systemAction,
        exit_kind: row.exitKind,
        count: fmt(row.count),
      }))
      .slice(0, limit),
    ['action', 'scope', 'length_bucket', 'result_bucket', 'system_action', 'exit_kind', 'count'],
  );

  console.log('=== REPAIR CTA LAYERS ===\n');
  console.log(`  repair_answer_click: ${fmt(repairCtaTotals.repair_answer_click || 0)}\n`);
  printTable(
    Object.values(repairCtaByLayer)
      .map((row) => ({
        section: row.section,
        target: row.target,
        layer: row.layer,
        kind: row.kind,
        clicks: fmt(row.clicks),
      }))
      .slice(0, limit),
    ['section', 'target', 'layer', 'kind', 'clicks'],
  );

  console.log('=== REPAIR-ANSWER FUNNEL ===\n');
  console.log(`  repair_answer_impression: ${fmt(repairTotals.repair_answer_impression || 0)}`);
  console.log(`  repair_answer_click: ${fmt(repairTotals.repair_answer_click || 0)}`);
  console.log(`  CTR: ${pct(repairTotals.repair_answer_click || 0, repairTotals.repair_answer_impression || 0).toFixed(1)}%\n`);
  printTable(repairRows, ['section', 'target', 'impressions', 'clicks', 'ctr']);

  console.log('=== KNOWLEDGE-GRAPH FUNNEL ===\n');
  console.log(`  knowledge_graph_impression: ${fmt(kgTotals.knowledge_graph_impression || 0)}`);
  console.log(`  knowledge_graph_click: ${fmt(kgTotals.knowledge_graph_click || 0)}`);
  console.log(`  CTR: ${pct(kgTotals.knowledge_graph_click || 0, kgTotals.knowledge_graph_impression || 0).toFixed(1)}%\n`);
  printTable(kgRows, ['surface', 'group', 'target', 'impressions', 'clicks', 'ctr']);

  console.log('=== TOP SURFACES ===\n');
  printTable(surfaceRows, ['surface', 'pages', 'sessions', 'views', 'views_per_page']);

  console.log('=== TOP INTENTS ===\n');
  if (intentDimension) {
    console.log(`  intent dimension: customEvent:${intentDimension}\n`);
    printTable(intentRowsSummarized, ['event', 'intent', 'clicks']);
  } else {
    console.log('  No intent custom dimension found. Report surfaces only.\n');
  }

  console.log('=== AVAILABLE CUSTOM DIMENSIONS ===\n');
  const availableRows = CUSTOM_DIMENSION_CANDIDATES.map((dim) => ({
    dimension: dim,
    status: availableDims[dim] ? 'available' : 'missing',
  }));
  printTable(availableRows, ['dimension', 'status']);
}

main().catch((err) => {
  console.error('Error:', err.message);
  if (String(err.message || '').includes('403') || String(err.message || '').includes('Permission')) {
    console.error('\nService account likely lacks access to GA4 property ' + GA_PROPERTY_ID);
    console.error('Grant Viewer or Analyst access to the GA4 property.');
  }
  process.exit(1);
});
