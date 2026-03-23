/**
 * SpotOn Auto - GA4 Analytics Report
 *
 * Pull analytics data from GA4 using the Google Analytics Data API.
 *
 * Usage:
 *   node scripts/analytics-report.js                    # Last 7 days (default)
 *   node scripts/analytics-report.js 28daysAgo today    # Last 28 days
 *   node scripts/analytics-report.js 2026-01-01 2026-02-16  # Custom range
 */

const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

const KEY_PATH = path.join(__dirname, '..', 'credentials', 'google-service-account.json');
const GA_PROPERTY_ID = '520432705';
const KEY_EVENTS = [
  'affiliate_click',
  'guide_generated',
  'guide_step_view',
  'guide_step_expand',
  'guide_completion',
  'manual_retrieval',
  'diagnostic_start',
  'vehicle_search',
  'repair_page_view',
  'repair_guide_open',
  'repair_answer_impression',
  'repair_answer_click',
  'knowledge_graph_impression',
  'knowledge_graph_click',
  'entry_route_click',
  'wiring_seo_view',
  'wiring_cta_click',
  'wiring_diagram_open',
  'wiring_diagram_search',
  'wiring_system_toggle',
  'wiring_diagram_exit',
  'wiring_diagram_interact',
  'vehicle_hub_enter',
  'shop_all_click',
  'tool_affiliate_click',
  'begin_checkout',
  'upgrade_modal_shown',
  'vin_decode',
  'sign_up',
  'login',
];

const OPTIONAL_DIMENSIONS = {
  repairAnswer: ['repair_answer_section', 'repair_answer_target', 'repair_answer_label', 'repair_answer_task'],
  repairCta: ['repair_answer_cta_layer', 'repair_answer_cta_kind'],
  guideProgress: ['guide_step', 'guide_step_bucket', 'guide_step_action', 'guide_completion_reason', 'guide_completion_total_steps', 'guide_completion_viewed_steps'],
  graph: ['graph_surface', 'graph_group', 'graph_target_kind', 'graph_label', 'task', 'system'],
  repairContext: ['page_surface', 'intent_cluster', 'task_slug', 'system_slug', 'code_family', 'task', 'system', 'code'],
  wiring: ['wiring_search_scope', 'wiring_search_length_bucket', 'wiring_search_result_bucket', 'wiring_system_action', 'wiring_diagram_action', 'wiring_exit_kind'],
  behavior: ['manual_mode', 'search_method', 'entry_surface', 'entry_destination'],
};

async function getAuthClient() {
  if (!fs.existsSync(KEY_PATH)) {
    throw new Error(`Credentials file not found at ${KEY_PATH}`);
  }
  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_PATH,
    scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
  });
  return auth.getClient();
}

function getArgValue(name, fallback = null) {
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
    const eq = raw.indexOf('=');
    if (eq === -1) continue;
    const key = raw.slice(0, eq).trim();
    const value = raw.slice(eq + 1).trim();
    if (!key || !value) continue;
    pairs.push([key, value]);
  }
  return pairs;
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

function buildAndFilter(expressions) {
  const validExpressions = expressions.filter(Boolean);
  if (!validExpressions.length) return undefined;
  if (validExpressions.length === 1) return validExpressions[0];
  return { andGroup: { expressions: validExpressions } };
}

function buildSessionFilters(args = {}) {
  const expressions = [];

  if (args.organicOnly) {
    expressions.push({
      filter: {
        fieldName: 'sessionMedium',
        stringFilter: { value: 'organic' },
      },
    });
  }

  if (args.country) {
    expressions.push({
      filter: {
        fieldName: 'countryId',
        inListFilter: { values: parseCsv(args.country) },
      },
    });
  }

  if (args.source) {
    expressions.push({
      filter: {
        fieldName: 'sessionSource',
        inListFilter: { values: parseCsv(args.source) },
      },
    });
  }

  if (args.medium) {
    expressions.push({
      filter: {
        fieldName: 'sessionMedium',
        inListFilter: { values: parseCsv(args.medium) },
      },
    });
  }

  if (args.pagePrefix) {
    expressions.push({
      filter: {
        fieldName: 'pagePath',
        stringFilter: { value: args.pagePrefix, matchType: 'BEGINS_WITH' },
      },
    });
  }

  return buildAndFilter(expressions);
}

function buildEventFilters(args = {}) {
  const expressions = [];

  if (args.events?.length) {
    expressions.push({
      filter: {
        fieldName: 'eventName',
        inListFilter: { values: args.events },
      },
    });
  }

  for (const [key, value] of args.customFilters || []) {
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

  return buildAndFilter(expressions);
}

async function runReport(authClient, startDate, endDate) {
  const analyticsdata = google.analyticsdata({ version: 'v1beta', auth: authClient });
  const customFilters = parseFilterPairs();
  const sessionFilters = buildSessionFilters({
    organicOnly: process.argv.includes('--organic-only'),
    country: getArgValue('country', ''),
    source: getArgValue('source', ''),
    medium: getArgValue('medium', ''),
    pagePrefix: getArgValue('page-prefix', ''),
  });
  const eventFilters = buildEventFilters({
    events: parseCsv(getArgValue('event', '')).length ? parseCsv(getArgValue('event', '')) : KEY_EVENTS,
    customFilters,
  });

  const filterSummary = [
    parseCsv(getArgValue('event', '')).length ? `event=${parseCsv(getArgValue('event', '')).join(',')}` : null,
    process.argv.includes('--organic-only') ? 'organic-only' : null,
    getArgValue('country', null) ? `country=${getArgValue('country', null)}` : null,
    getArgValue('source', null) ? `source=${getArgValue('source', null)}` : null,
    getArgValue('medium', null) ? `medium=${getArgValue('medium', null)}` : null,
    getArgValue('page-prefix', null) ? `page-prefix=${getArgValue('page-prefix', null)}` : null,
    ...customFilters.map(([key, value]) => `${key}=${value}`),
  ].filter(Boolean);

  // Top pages by sessions
  console.log('=== TOP PAGES BY SESSIONS ===\n');
  const pagesReport = await analyticsdata.properties.runReport({
    property: `properties/${GA_PROPERTY_ID}`,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [
        { name: 'sessions' },
        { name: 'activeUsers' },
        { name: 'bounceRate' },
        { name: 'averageSessionDuration' },
      ],
      ...(sessionFilters ? { dimensionFilter: sessionFilters } : {}),
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 25,
    },
  });

  for (const row of pagesReport.data.rows || []) {
    const pagePath = row.dimensionValues?.[0]?.value;
    const sessions = row.metricValues?.[0]?.value;
    const users = row.metricValues?.[1]?.value;
    const bounce = (parseFloat(row.metricValues?.[2]?.value || '0') * 100).toFixed(1);
    const duration = parseFloat(row.metricValues?.[3]?.value || '0').toFixed(0);
    console.log(`  ${pagePath} | ${sessions} sessions | ${users} users | ${bounce}% bounce | ${duration}s avg`);
  }

  // Traffic sources
  console.log('\n=== TRAFFIC SOURCES ===\n');
  const sourcesReport = await analyticsdata.properties.runReport({
    property: `properties/${GA_PROPERTY_ID}`,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'sessionSource' }, { name: 'sessionMedium' }],
      metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
      ...(sessionFilters ? { dimensionFilter: sessionFilters } : {}),
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 15,
    },
  });

  for (const row of sourcesReport.data.rows || []) {
    const source = row.dimensionValues?.[0]?.value;
    const medium = row.dimensionValues?.[1]?.value;
    const sessions = row.metricValues?.[0]?.value;
    const users = row.metricValues?.[1]?.value;
    console.log(`  ${source} / ${medium} | ${sessions} sessions | ${users} users`);
  }

  // Key events (spotonauto-specific)
  console.log('\n=== KEY EVENTS ===\n');
  const eventsReport = await analyticsdata.properties.runReport({
    property: `properties/${GA_PROPERTY_ID}`,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'eventName' }],
      metrics: [{ name: 'eventCount' }],
      ...(eventFilters ? { dimensionFilter: eventFilters } : {}),
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
    },
  });

  for (const row of eventsReport.data.rows || []) {
    const event = row.dimensionValues?.[0]?.value;
    const count = row.metricValues?.[0]?.value;
    console.log(`  ${event}: ${count}`);
  }
  if (!eventsReport.data.rows?.length) {
    console.log('  No conversion events yet');
  }

  // Device breakdown
  console.log('\n=== DEVICE BREAKDOWN ===\n');
  const deviceReport = await analyticsdata.properties.runReport({
    property: `properties/${GA_PROPERTY_ID}`,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'deviceCategory' }],
      metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
    },
  });

  for (const row of deviceReport.data.rows || []) {
    const device = row.dimensionValues?.[0]?.value;
    const sessions = row.metricValues?.[0]?.value;
    console.log(`  ${device}: ${sessions} sessions`);
  }

  // Top countries
  console.log('\n=== TOP COUNTRIES ===\n');
  const geoReport = await analyticsdata.properties.runReport({
    property: `properties/${GA_PROPERTY_ID}`,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'country' }],
      metrics: [{ name: 'sessions' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 10,
    },
  });

  for (const row of geoReport.data.rows || []) {
    const country = row.dimensionValues?.[0]?.value;
    const sessions = row.metricValues?.[0]?.value;
    console.log(`  ${country}: ${sessions} sessions`);
  }

  // Landing pages (organic only)
  console.log('\n=== TOP ORGANIC LANDING PAGES ===\n');
  const organicReport = await analyticsdata.properties.runReport({
    property: `properties/${GA_PROPERTY_ID}`,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'landingPagePlusQueryString' }],
      metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
      dimensionFilter: buildSessionFilters({ organicOnly: true }),
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 15,
    },
  });

  for (const row of organicReport.data.rows || []) {
    const page = row.dimensionValues?.[0]?.value;
    const sessions = row.metricValues?.[0]?.value;
    const users = row.metricValues?.[1]?.value;
    console.log(`  ${page} | ${sessions} sessions | ${users} users`);
  }
  if (!organicReport.data.rows?.length) {
    console.log('  No organic traffic yet');
  }

  // Guide progression and wiring interactions
  const breakdowns = [
    { title: 'Guide progression', events: ['guide_step_view', 'guide_step_expand', 'guide_completion'], dimensions: ['customEvent:guide_step_action', 'customEvent:guide_step', 'customEvent:guide_step_bucket', 'customEvent:guide_completion_reason'] },
    { title: 'Wiring interactions', events: ['wiring_diagram_search', 'wiring_system_toggle', 'wiring_diagram_exit', 'wiring_diagram_interact'], dimensions: ['customEvent:wiring_diagram_action', 'customEvent:wiring_search_scope', 'customEvent:wiring_search_length_bucket', 'customEvent:wiring_search_result_bucket', 'customEvent:wiring_system_action', 'customEvent:wiring_exit_kind'] },
    { title: 'Repair CTA layers', events: ['repair_answer_click'], dimensions: ['customEvent:repair_answer_section', 'customEvent:repair_answer_target', 'customEvent:repair_answer_cta_layer', 'customEvent:repair_answer_cta_kind'] },
    { title: 'Repair answers by section', events: ['repair_answer_click'], dimensions: ['customEvent:repair_answer_section', 'customEvent:repair_answer_target'] },
    { title: 'Knowledge graph by surface', events: ['knowledge_graph_click'], dimensions: ['customEvent:graph_surface', 'customEvent:graph_group', 'customEvent:graph_target_kind', 'customEvent:graph_label'] },
    { title: 'Repair context by task/system', events: ['repair_page_view', 'repair_guide_open', 'guide_generated', 'manual_retrieval'], dimensions: ['customEvent:task', 'customEvent:system', 'customEvent:manual_mode'] },
    { title: 'Entry routes by surface/destination', events: ['entry_route_click'], dimensions: ['customEvent:entry_surface', 'customEvent:entry_destination'] },
    { title: 'Search methods', events: ['vehicle_search'], dimensions: ['customEvent:search_method', 'customEvent:task'] },
  ];

  for (const breakdown of breakdowns) {
    try {
      const rows = await analyticsdata.properties.runReport({
        property: `properties/${GA_PROPERTY_ID}`,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          dimensions: breakdown.dimensions.map((name) => ({ name })),
          metrics: [{ name: 'eventCount' }],
          dimensionFilter: buildAndFilter([
            {
              filter: {
                fieldName: 'eventName',
                inListFilter: { values: breakdown.events },
              },
            },
            eventFilters,
            sessionFilters,
          ]),
          orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
          limit: 10,
        },
      });

      console.log(`\n=== ${breakdown.title.toUpperCase()} ===\n`);
      if (!rows.data.rows?.length) {
        console.log('  No rows\n');
        continue;
      }

      const columns = breakdown.dimensions.map((name) => name.replace('customEvent:', ''));
      printTable(
        rows.data.rows.map((row) => {
          const out = {};
          breakdown.dimensions.forEach((dimension, index) => {
            out[columns[index]] = row.dimensionValues?.[index]?.value || '(not set)';
          });
          out.eventCount = row.metricValues?.[0]?.value || '0';
          return out;
        }),
        [...columns, 'eventCount'],
      );
    } catch (err) {
      if (isOptionalDimensionError(err)) {
        console.log(`\n=== ${breakdown.title.toUpperCase()} ===\n`);
        console.log('  Skipped until the required GA4 custom dimensions are available.\n');
        continue;
      }
      throw err;
    }
  }

  console.log('\n=== CURATED FILTERS ===\n');
  if (filterSummary.length) {
    console.log(`  Active filters: ${filterSummary.join(' | ')}\n`);
  } else {
    console.log('  Active filters: none\n');
  }
}

async function main() {
  const startDate = process.argv[2] || '7daysAgo';
  const endDate = process.argv[3] || 'today';

  console.log(`\n╔══════════════════════════════════════════════════════════════╗`);
  console.log(`║         SpotOn Auto - GA4 Analytics Report                  ║`);
  console.log(`╚══════════════════════════════════════════════════════════════╝`);
  console.log(`\n  Period: ${startDate} to ${endDate}`);
  console.log(`  Property: ${GA_PROPERTY_ID}\n`);
  console.log('='.repeat(60) + '\n');

  const authClient = await getAuthClient();
  await runReport(authClient, startDate, endDate);

  console.log('\n' + '='.repeat(60));
  console.log('Done!\n');
}

main().catch(err => {
  console.error('Error:', err.message);
  if (err.message.includes('403') || err.message.includes('Permission')) {
    console.error('\nMake sure the service account has Viewer access to GA4 property ' + GA_PROPERTY_ID);
    console.error('Go to: GA4 Admin > Property Access Management > Add the service account email');
  }
  process.exit(1);
});
