/**
 * SpotOn Auto - Ensure GA4 Knowledge Graph Custom Dimensions
 *
 * Lists the required event-scoped GA4 custom dimensions for graph analytics and
 * repair-answer analytics, and can create any missing dimensions when the
 * service account has edit access.
 *
 * Usage:
 *   node scripts/ensure-graph-ga4-dimensions.js
 *   node scripts/ensure-graph-ga4-dimensions.js --create-missing
 *   node scripts/ensure-graph-ga4-dimensions.js --json
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const KEY_PATH = path.join(__dirname, '..', 'credentials', 'google-service-account.json');
const GA_PROPERTY_ID = '520432705';
const PROPERTY_NAME = `properties/${GA_PROPERTY_ID}`;

const REQUIRED_DIMENSIONS = [
  {
    parameterName: 'page_surface',
    displayName: 'Page Surface',
    description: 'Primary page surface such as repair, vehicle, wiring, code, symptom, or landing.',
    scope: 'EVENT',
  },
  {
    parameterName: 'task',
    displayName: 'Task',
    description: 'Current repair task or task-like context emitted by the page.',
    scope: 'EVENT',
  },
  {
    parameterName: 'system',
    displayName: 'System',
    description: 'Current wiring or diagnostic system emitted by the page.',
    scope: 'EVENT',
  },
  {
    parameterName: 'code',
    displayName: 'Code',
    description: 'Diagnostic code emitted by the page.',
    scope: 'EVENT',
  },
  {
    parameterName: 'intent_cluster',
    displayName: 'Intent Cluster',
    description: 'Low-cardinality search intent cluster such as battery, lighting, brakes, oil, or filters.',
    scope: 'EVENT',
  },
  {
    parameterName: 'task_slug',
    displayName: 'Task Slug',
    description: 'Canonical repair task slug attached to repair and repair-adjacent events.',
    scope: 'EVENT',
  },
  {
    parameterName: 'system_slug',
    displayName: 'System Slug',
    description: 'Canonical wiring or diagnostic system slug attached to system events.',
    scope: 'EVENT',
  },
  {
    parameterName: 'code_family',
    displayName: 'Code Family',
    description: 'Low-cardinality diagnostic code family such as powertrain, body, chassis, or network.',
    scope: 'EVENT',
  },
  {
    parameterName: 'manual_mode',
    displayName: 'Manual Mode',
    description: 'Manual retrieval mode such as vector, kv, live, or none.',
    scope: 'EVENT',
  },
  {
    parameterName: 'search_method',
    displayName: 'Search Method',
    description: 'Search method used to reach the vehicle or repair context such as guide or diagnose.',
    scope: 'EVENT',
  },
  {
    parameterName: 'entry_surface',
    displayName: 'Entry Surface',
    description: 'Entry surface used to reach a route such as home_hero or home_dashboard.',
    scope: 'EVENT',
  },
  {
    parameterName: 'entry_destination',
    displayName: 'Entry Destination',
    description: 'Entry destination such as repair, wiring, codes, diagnose, vehicle_hub, or parts.',
    scope: 'EVENT',
  },
  {
    parameterName: 'repair_answer_section',
    displayName: 'Repair Answer Section',
    description: 'Repair answer section or card rendered on the page.',
    scope: 'EVENT',
  },
  {
    parameterName: 'repair_answer_target',
    displayName: 'Repair Answer Target',
    description: 'Repair answer click target such as guide, vehicle hub, or manual path.',
    scope: 'EVENT',
  },
  {
    parameterName: 'repair_answer_label',
    displayName: 'Repair Answer Label',
    description: 'Repair answer button or chip label used for reporting.',
    scope: 'EVENT',
  },
  {
    parameterName: 'repair_answer_cta_layer',
    displayName: 'Repair Answer CTA Layer',
    description: 'Repair answer CTA layer such as primary, secondary, supporting, or reference.',
    scope: 'EVENT',
  },
  {
    parameterName: 'repair_answer_cta_kind',
    displayName: 'Repair Answer CTA Kind',
    description: 'Repair answer CTA kind such as guide, vehicle hub, manual, parts, tool, or diagram.',
    scope: 'EVENT',
  },
  {
    parameterName: 'repair_answer_vehicle',
    displayName: 'Repair Answer Vehicle',
    description: 'Exact vehicle context attached to repair answer events.',
    scope: 'EVENT',
  },
  {
    parameterName: 'repair_answer_task',
    displayName: 'Repair Answer Task',
    description: 'Repair task context attached to repair answer events.',
    scope: 'EVENT',
  },
  {
    parameterName: 'graph_surface',
    displayName: 'Graph Surface',
    description: 'Knowledge graph source surface such as repair, code, or wiring.',
    scope: 'EVENT',
  },
  {
    parameterName: 'graph_group',
    displayName: 'Graph Group',
    description: 'Knowledge graph block identifier rendered on the page.',
    scope: 'EVENT',
  },
  {
    parameterName: 'graph_target_kind',
    displayName: 'Graph Target Kind',
    description: 'Knowledge graph target type such as manual, repair, wiring, or dtc.',
    scope: 'EVENT',
  },
  {
    parameterName: 'graph_label',
    displayName: 'Graph Label',
    description: 'Knowledge graph target label used for click-through reporting.',
    scope: 'EVENT',
  },
  {
    parameterName: 'guide_step',
    displayName: 'Guide Step',
    description: 'Guide step number attached to step view and expand events.',
    scope: 'EVENT',
  },
  {
    parameterName: 'guide_step_bucket',
    displayName: 'Guide Step Bucket',
    description: 'Low-cardinality step bucket used to group steps into early, middle, and late sections.',
    scope: 'EVENT',
  },
  {
    parameterName: 'guide_step_action',
    displayName: 'Guide Step Action',
    description: 'Guide step action such as view or expand.',
    scope: 'EVENT',
  },
  {
    parameterName: 'guide_completion_reason',
    displayName: 'Guide Completion Reason',
    description: 'Reason a guide completion event fired such as last step viewed or all steps viewed.',
    scope: 'EVENT',
  },
  {
    parameterName: 'guide_completion_total_steps',
    displayName: 'Guide Completion Total Steps',
    description: 'Total guide steps available when the guide completion event fired.',
    scope: 'EVENT',
  },
  {
    parameterName: 'guide_completion_viewed_steps',
    displayName: 'Guide Completion Viewed Steps',
    description: 'Number of steps the user viewed when guide completion fired.',
    scope: 'EVENT',
  },
  {
    parameterName: 'wiring_search_scope',
    displayName: 'Wiring Search Scope',
    description: 'Scope used when searching wiring content such as diagram library or system list.',
    scope: 'EVENT',
  },
  {
    parameterName: 'wiring_search_length_bucket',
    displayName: 'Wiring Search Length Bucket',
    description: 'Length bucket for wiring diagram search queries.',
    scope: 'EVENT',
  },
  {
    parameterName: 'wiring_search_result_bucket',
    displayName: 'Wiring Search Result Bucket',
    description: 'Low-cardinality bucket for wiring diagram search result counts.',
    scope: 'EVENT',
  },
  {
    parameterName: 'wiring_system_action',
    displayName: 'Wiring System Action',
    description: 'System accordion action such as expand or collapse.',
    scope: 'EVENT',
  },
  {
    parameterName: 'wiring_diagram_action',
    displayName: 'Wiring Diagram Action',
    description: 'Diagram interaction action such as zoom, copy, download, or share.',
    scope: 'EVENT',
  },
  {
    parameterName: 'wiring_exit_kind',
    displayName: 'Wiring Exit Kind',
    description: 'Reason the user exited the wiring modal or browser.',
    scope: 'EVENT',
  },
  {
    parameterName: 'subtag',
    displayName: 'Affiliate Subtag',
    description: 'Affiliate attribution subtag used to distinguish module-level click sources (tool-intent, tool-spec, tool-supplies, etc.).',
    scope: 'EVENT',
  },
];

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
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

async function buildAdminClient(editMode) {
  if (!fs.existsSync(KEY_PATH)) {
    throw new Error(`Credentials file not found at ${KEY_PATH}`);
  }

  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_PATH,
    scopes: [
      editMode
        ? 'https://www.googleapis.com/auth/analytics.edit'
        : 'https://www.googleapis.com/auth/analytics.readonly',
    ],
  });

  return google.analyticsadmin({ version: 'v1beta', auth });
}

async function listCustomDimensions(analyticsadmin) {
  const dimensions = [];
  let pageToken;

  do {
    const response = await analyticsadmin.properties.customDimensions.list({
      parent: PROPERTY_NAME,
      pageSize: 200,
      pageToken,
    });

    dimensions.push(...(response.data.customDimensions || []));
    pageToken = response.data.nextPageToken;
  } while (pageToken);

  return dimensions;
}

async function createCustomDimension(analyticsadmin, dimension) {
  const response = await analyticsadmin.properties.customDimensions.create({
    parent: PROPERTY_NAME,
    requestBody: dimension,
  });
  return response.data;
}

async function main() {
  const shouldCreateMissing = hasFlag('create-missing');
  const asJson = hasFlag('json');
  const analyticsadmin = await buildAdminClient(shouldCreateMissing);
  const existing = await listCustomDimensions(analyticsadmin);
  const byParameter = new Map(existing.map((dim) => [dim.parameterName, dim]));

  const statusRows = REQUIRED_DIMENSIONS.map((required) => {
    const existingDim = byParameter.get(required.parameterName);
    return {
      parameterName: required.parameterName,
      displayName: required.displayName,
      scope: required.scope,
      status: existingDim ? 'present' : 'missing',
      apiName: existingDim?.name || '',
    };
  });

  const missing = REQUIRED_DIMENSIONS.filter((required) => !byParameter.has(required.parameterName));
  const created = [];

  if (shouldCreateMissing && missing.length) {
    for (const dimension of missing) {
      const createdDim = await createCustomDimension(analyticsadmin, dimension);
      created.push({
        parameterName: createdDim.parameterName,
        displayName: createdDim.displayName,
        scope: createdDim.scope,
        apiName: createdDim.name,
      });
    }
  }

  const payload = {
    property: PROPERTY_NAME,
    requiredDimensions: REQUIRED_DIMENSIONS.map((dimension) => dimension.parameterName),
    missingBeforeCreate: missing.map((dimension) => dimension.parameterName),
    created,
    status: statusRows.map((row) => ({
      parameterName: row.parameterName,
      displayName: row.displayName,
      scope: row.scope,
      status:
        created.some((item) => item.parameterName === row.parameterName) ? 'created' : row.status,
      apiName:
        created.find((item) => item.parameterName === row.parameterName)?.apiName || row.apiName,
    })),
  };

  if (asJson) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  console.log(`\nGA4 property: ${PROPERTY_NAME}\n`);
  console.log('Required knowledge graph custom dimensions:\n');
  printTable(payload.status, ['parameterName', 'displayName', 'scope', 'status', 'apiName']);

  if (created.length) {
    console.log('Created dimensions:\n');
    printTable(created, ['parameterName', 'displayName', 'scope', 'apiName']);
    console.log('GA4 may take some time before new custom dimensions become queryable in reports.\n');
  } else if (missing.length && !shouldCreateMissing) {
    console.log('Missing dimensions detected. Re-run with --create-missing to create them.\n');
  } else {
    console.log('All required dimensions are already configured.\n');
  }
}

main().catch((err) => {
  console.error('Error:', err.message);
  if (String(err.message || '').includes('403') || String(err.message || '').includes('Permission')) {
    console.error(`\nService account likely lacks access to ${PROPERTY_NAME}.`);
    console.error('For listing, grant Viewer or Analyst access to the GA4 property.');
    console.error('For creation, grant Editor access or another role with analytics.edit.');
  }
  process.exit(1);
});
