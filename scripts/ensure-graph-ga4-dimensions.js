/**
 * SpotOn Auto - Ensure GA4 Knowledge Graph Custom Dimensions
 *
 * Lists the required event-scoped GA4 custom dimensions for graph analytics and
 * can create any missing dimensions when the service account has edit access.
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
