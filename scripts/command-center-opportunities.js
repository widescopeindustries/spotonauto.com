#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const REPORTS_DIR = path.join(__dirname, 'seo-reports');
const KEY_PATH = path.join(ROOT, 'credentials', 'google-service-account.json');
const SITE_URL = 'sc-domain:spotonauto.com';
const GA_PROPERTY_ID = '520432705';
const DOMAIN_PREFIX = 'https://spotonauto.com';
const MULTI_WORD_MAKES = [
  'alfa romeo',
  'aston martin',
  'land rover',
  'mercedes benz',
  'mercedes-benz',
  'rolls royce',
];
const COVERAGE_BACKED_COMMAND_CENTER_KEYS = new Set([
  '2008|honda|civic',
  '2004|acura|tsx',
]);

const CLUSTER_LABELS = {
  lighting: 'lighting',
  brakes: 'brakes',
  battery: 'battery',
  oil_fluids: 'fluids',
  filters: 'filters',
  belts_cooling: 'cooling',
  starting_charging: 'starting/charging',
  ignition_tuneup: 'ignition/tune-up',
  sizing_specs: 'specs',
  other: 'other',
};

const CLUSTER_SYMPTOMS = {
  battery: ['battery-light-on', 'car-wont-start'],
  brakes: ['shakes-when-braking', 'squeaky-brakes', 'steers-to-the-right'],
  oil_fluids: ['overheating'],
  belts_cooling: ['overheating'],
  starting_charging: ['car-wont-start', 'battery-light-on'],
  ignition_tuneup: ['rough-idle', 'check-engine-light-on'],
};

function getArg(name, fallback = null) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return fallback;
  return process.argv[idx + 1] || fallback;
}

function addDays(dateStr, days) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function ensureReportsDir() {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

function pct(current, previous) {
  if (!previous) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function fmtNum(value, digits = 0) {
  return Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function slugifyRoutePart(value) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeText(value) {
  return decodeURIComponent(String(value || ''))
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function titleCaseWords(value) {
  return decodeURIComponent(String(value || ''))
    .replace(/[-_]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => {
      if (/^[a-z]\d$/i.test(token)) return token.toUpperCase();
      if (/^\d/.test(token)) return token.toUpperCase();
      if (token.length <= 3 && token === token.toUpperCase()) return token;
      return token.charAt(0).toUpperCase() + token.slice(1);
    })
    .join(' ');
}

function buildVehicleKey(year, make, model) {
  return `${year}|${normalizeText(make)}|${normalizeText(model)}`;
}

function buildFamilyKey(make, model) {
  return `${normalizeText(make)}|${normalizeText(model)}`;
}

function toRelativePath(raw) {
  return String(raw || '')
    .replace(/^https?:\/\/[^/]+/i, '')
    .split('?')[0]
    .split('#')[0] || '/';
}

function parseRepairPath(raw) {
  const relative = toRelativePath(raw);
  const match = relative.match(/^\/repair\/(\d{4})\/([^/]+)\/([^/]+)(?:\/([^/?#]+))?/i);
  if (!match) return null;

  const year = match[1];
  const makeSlug = decodeURIComponent(match[2]);
  const modelSlug = decodeURIComponent(match[3]);
  const task = match[4] ? decodeURIComponent(match[4]) : null;
  const make = titleCaseWords(makeSlug);
  const model = titleCaseWords(modelSlug);
  const hubPath = `/repair/${year}/${makeSlug}/${modelSlug}`;

  return {
    year,
    make,
    model,
    makeSlug,
    modelSlug,
    task,
    hubPath,
    hubUrl: `${DOMAIN_PREFIX}${hubPath}`,
    pagePath: relative,
    key: buildVehicleKey(year, makeSlug, modelSlug),
    familyKey: buildFamilyKey(makeSlug, modelSlug),
  };
}

function parseVehicleLabel(label) {
  const match = String(label || '').trim().match(/^(\d{4})\s+(.+)$/);
  if (!match) return null;

  const year = match[1];
  const rawRest = match[2].trim();
  const normalizedRest = normalizeText(rawRest);
  const tokens = rawRest.split(/\s+/);
  let makeTokens = [tokens[0]];
  let modelTokens = tokens.slice(1);

  for (const make of MULTI_WORD_MAKES) {
    const makeParts = make.split(/\s+/);
    const probe = tokens.slice(0, makeParts.length).join(' ').toLowerCase();
    if (probe === make) {
      makeTokens = tokens.slice(0, makeParts.length);
      modelTokens = tokens.slice(makeParts.length);
      break;
    }
  }

  if (!modelTokens.length) {
    const restTokens = normalizedRest.split(' ');
    makeTokens = [restTokens[0]];
    modelTokens = restTokens.slice(1);
  }

  const make = titleCaseWords(makeTokens.join(' '));
  const model = titleCaseWords(modelTokens.join(' '));
  const makeSlug = slugifyRoutePart(make);
  const modelSlug = slugifyRoutePart(model);
  const hubPath = `/repair/${year}/${makeSlug}/${modelSlug}`;

  return {
    year,
    make,
    model,
    makeSlug,
    modelSlug,
    hubPath,
    hubUrl: `${DOMAIN_PREFIX}${hubPath}`,
    key: buildVehicleKey(year, make, model),
    familyKey: buildFamilyKey(make, model),
    label: `${year} ${make} ${model}`,
  };
}

function clusterFromTask(task) {
  const value = normalizeText(task);
  if (!value) return 'other';
  if (/headlight|tail light|taillight|head lamp|bulb/.test(value)) return 'lighting';
  if (/brake/.test(value)) return 'brakes';
  if (/battery/.test(value)) return 'battery';
  if (/oil change|transmission fluid|coolant flush|fluid change|oil type|fluid type/.test(value)) return 'oil_fluids';
  if (/filter/.test(value)) return 'filters';
  if (/radiator|thermostat|water pump|coolant|overheat|serpentine belt|drive belt/.test(value)) return 'belts_cooling';
  if (/starter|alternator|charging/.test(value)) return 'starting_charging';
  if (/spark plug|ignition coil/.test(value)) return 'ignition_tuneup';
  if (/tire size|wheel size|bulb size/.test(value)) return 'sizing_specs';
  return 'other';
}

function taskDisplay(task) {
  return String(task || '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getSection(text, startHeading, endHeading) {
  const start = text.indexOf(startHeading);
  if (start === -1) return '';
  const startOffset = start + startHeading.length;
  const end = endHeading ? text.indexOf(endHeading, startOffset) : -1;
  return text.slice(startOffset, end === -1 ? undefined : end).trim();
}

function loadLatestReport(regex) {
  ensureReportsDir();
  const names = fs.readdirSync(REPORTS_DIR).filter((name) => regex.test(name)).sort();
  if (!names.length) return null;
  return path.join(REPORTS_DIR, names[names.length - 1]);
}

function loadLatestQuerySnapshot() {
  const summaryPath = loadLatestReport(/^queries-last24h-\d{4}-\d{2}-\d{2}-summary\.md$/);
  const jsonPath = loadLatestReport(/^queries-last24h-\d{4}-\d{2}-\d{2}\.json$/);

  const snapshot = {
    summaryPath,
    jsonPath,
    exactVehicles: [],
    familyDemand: [],
    clusters: [],
    metadata: null,
  };

  if (summaryPath && fs.existsSync(summaryPath)) {
    const text = fs.readFileSync(summaryPath, 'utf8');
    const exactVehicleSection = getSection(text, '## Repeated Exact Vehicles', '## Repeated Make / Model Families');
    const familySection = getSection(text, '## Repeated Make / Model Families', '## Recommended Enrichment Queue');

    snapshot.exactVehicles = exactVehicleSection
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith('- '))
      .map((line) => {
        const match = line.match(/^- (.+?): (\d+) queries, (\d+) impressions$/);
        if (!match) return null;
        const parsed = parseVehicleLabel(match[1]);
        if (!parsed) return null;
        return {
          ...parsed,
          queryCount: Number(match[2] || 0),
          impressions: Number(match[3] || 0),
        };
      })
      .filter(Boolean);

    snapshot.familyDemand = familySection
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith('- '))
      .map((line) => {
        const match = line.match(/^- (.+?): (\d+) queries, (\d+) impressions, years (.+)$/);
        if (!match) return null;
        return {
          family: match[1],
          queryCount: Number(match[2] || 0),
          impressions: Number(match[3] || 0),
          years: match[4],
        };
      })
      .filter(Boolean);
  }

  if (jsonPath && fs.existsSync(jsonPath)) {
    const json = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    snapshot.metadata = {
      pulledAt: json.pulledAt,
      startDate: json.startDate,
      endDate: json.endDate,
      rowCount: json.rowCount,
      totalClicks: json.totalClicks,
      totalImpressions: json.totalImpressions,
    };
    snapshot.clusters = json.clusters || [];
  }

  return snapshot;
}

function loadGraphContext() {
  const graphPriorityPath = loadLatestReport(/^graph-priority-report-\d{4}-\d{2}-\d{2}\.json$/);
  const graphLinksPath = loadLatestReport(/^graph-link-suggestions-\d{4}-\d{2}-\d{2}\.json$/);
  const graphPriority = graphPriorityPath ? JSON.parse(fs.readFileSync(graphPriorityPath, 'utf8')) : null;
  const graphLinks = graphLinksPath ? JSON.parse(fs.readFileSync(graphLinksPath, 'utf8')) : null;

  const symptomMap = new Map();
  if (graphPriority?.highValueSymptomHubs) {
    for (const entry of graphPriority.highValueSymptomHubs) {
      const slug = toRelativePath(entry.href).replace(/^\/symptoms\//, '');
      if (slug) symptomMap.set(slug, entry);
    }
  }

  const supportGapRows = [
    ...(graphPriority?.topUnderlinkedPages || []),
    ...(graphPriority?.tier1RepairSupportGaps || []),
  ];

  return {
    graphPriorityPath,
    graphLinksPath,
    graphPriority,
    graphLinks,
    symptomMap,
    supportGapRows,
  };
}

async function buildClients() {
  if (!fs.existsSync(KEY_PATH)) {
    throw new Error(`Credentials file not found at ${KEY_PATH}`);
  }

  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_PATH,
    scopes: [
      'https://www.googleapis.com/auth/webmasters.readonly',
      'https://www.googleapis.com/auth/analytics.readonly',
    ],
  });

  return {
    searchconsole: google.searchconsole({ version: 'v1', auth }),
    analyticsdata: google.analyticsdata({ version: 'v1beta', auth }),
  };
}

async function fetchGscPages(searchconsole, startDate, endDate) {
  const response = await searchconsole.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate,
      endDate,
      dimensions: ['page'],
      rowLimit: 10000,
    },
  });

  return (response.data.rows || []).map((row) => ({
    page: row.keys?.[0] || '',
    clicks: Number(row.clicks || 0),
    impressions: Number(row.impressions || 0),
    position: Number(row.position || 0),
  }));
}

async function fetchGaOrganicPages(analyticsdata, startDate, endDate) {
  const response = await analyticsdata.properties.runReport({
    property: `properties/${GA_PROPERTY_ID}`,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'sessions' }],
      dimensionFilter: {
        filter: {
          fieldName: 'sessionMedium',
          stringFilter: { value: 'organic' },
        },
      },
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 10000,
    },
  });

  return (response.data.rows || []).map((row) => ({
    pagePath: row.dimensionValues?.[0]?.value || '',
    sessions: Number(row.metricValues?.[0]?.value || 0),
  }));
}

async function fetchGaOrganicSources(analyticsdata, startDate, endDate) {
  const response = await analyticsdata.properties.runReport({
    property: `properties/${GA_PROPERTY_ID}`,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'sessionSource' }],
      metrics: [{ name: 'sessions' }],
      dimensionFilter: {
        filter: {
          fieldName: 'sessionMedium',
          stringFilter: { value: 'organic' },
        },
      },
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 1000,
    },
  });

  return (response.data.rows || []).map((row) => ({
    source: row.dimensionValues?.[0]?.value || '(not set)',
    sessions: Number(row.metricValues?.[0]?.value || 0),
  }));
}

function createCandidate(seed) {
  return {
    key: seed.key,
    familyKey: seed.familyKey,
    year: seed.year,
    make: seed.make,
    model: seed.model,
    makeSlug: seed.makeSlug || slugifyRoutePart(seed.make),
    modelSlug: seed.modelSlug || slugifyRoutePart(seed.model),
    hubPath: seed.hubPath || `/repair/${seed.year}/${slugifyRoutePart(seed.make)}/${slugifyRoutePart(seed.model)}`,
    hubUrl: seed.hubUrl || `${DOMAIN_PREFIX}/repair/${seed.year}/${slugifyRoutePart(seed.make)}/${slugifyRoutePart(seed.model)}`,
    query24hCount: 0,
    query24hImpressions: 0,
    gscCurrentImpressions: 0,
    gscPreviousImpressions: 0,
    gscCurrentClicks: 0,
    gaCurrentSessions: 0,
    gaPreviousSessions: 0,
    tasks: new Map(),
    clusters: new Map(),
    gscPages: [],
    gaPages: [],
    graphSupportGaps: [],
    graphLinkSuggestions: [],
    symptomHubs: [],
    note: '',
    score: 0,
  };
}

function getCandidate(map, seed) {
  const existing = map.get(seed.key);
  if (existing) return existing;
  const candidate = createCandidate(seed);
  map.set(seed.key, candidate);
  return candidate;
}

function addMapWeight(map, key, weight) {
  if (!key) return;
  map.set(key, (map.get(key) || 0) + weight);
}

function addSummarySignals(candidates, snapshot) {
  for (const vehicle of snapshot.exactVehicles) {
    const candidate = getCandidate(candidates, vehicle);
    candidate.query24hCount += vehicle.queryCount;
    candidate.query24hImpressions += vehicle.impressions;
  }
}

function addGscSignals(candidates, rows, fieldPrefix) {
  for (const row of rows) {
    const parsed = parseRepairPath(row.page);
    if (!parsed || !parsed.task) continue;
    const candidate = getCandidate(candidates, parsed);
    candidate[`${fieldPrefix}Impressions`] += row.impressions;
    if (fieldPrefix === 'gscCurrent') candidate.gscCurrentClicks += row.clicks;
    if (fieldPrefix === 'gscCurrent') {
      const cluster = clusterFromTask(parsed.task);
      addMapWeight(candidate.tasks, parsed.task, row.impressions);
      addMapWeight(candidate.clusters, cluster, row.impressions);
      candidate.gscPages.push({
        pagePath: parsed.pagePath,
        task: parsed.task,
        impressions: row.impressions,
        clicks: row.clicks,
        position: row.position,
        range: fieldPrefix,
      });
    }
  }
}

function addGaSignals(candidates, rows, fieldPrefix) {
  for (const row of rows) {
    const parsed = parseRepairPath(row.pagePath);
    if (!parsed || !parsed.task) continue;
    const candidate = getCandidate(candidates, parsed);
    candidate[`${fieldPrefix}Sessions`] += row.sessions;
    if (fieldPrefix === 'gaCurrent') {
      const cluster = clusterFromTask(parsed.task);
      addMapWeight(candidate.tasks, parsed.task, row.sessions);
      addMapWeight(candidate.clusters, cluster, row.sessions);
      candidate.gaPages.push({
        pagePath: parsed.pagePath,
        task: parsed.task,
        sessions: row.sessions,
        range: fieldPrefix,
      });
    }
  }
}

function topEntriesFromMap(map, limit = 5) {
  return [...map.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, limit)
    .map(([key, value]) => ({ key, value }));
}

function pickSymptomHubs(candidate, symptomMap) {
  const slugs = new Set();
  const topClusters = topEntriesFromMap(candidate.clusters, 3)
    .map((entry) => entry.key)
    .filter((key) => key && key !== 'other');

  for (const cluster of topClusters) {
    for (const slug of CLUSTER_SYMPTOMS[cluster] || []) {
      slugs.add(slug);
    }
  }

  return [...slugs]
    .map((slug) => symptomMap.get(slug))
    .filter(Boolean)
    .slice(0, 4)
    .map((entry) => ({
      label: entry.label,
      href: entry.href,
      opportunityScore: entry.opportunityScore,
      action: entry.action,
    }));
}

function composeNote(candidate) {
  const clusterLabels = topEntriesFromMap(candidate.clusters, 3)
    .map((entry) => CLUSTER_LABELS[entry.key] || entry.key)
    .filter((label) => label && label !== 'other');

  if (!clusterLabels.length) {
    return 'Exact repair demand is starting to concentrate on this hub.';
  }

  if (clusterLabels.length === 1) {
    return `${capitalize(clusterLabels[0])} intent is repeating here.`;
  }

  if (clusterLabels.length === 2) {
    return `${capitalize(clusterLabels[0])} and ${clusterLabels[1]} signals are stacking here.`;
  }

  return `${capitalize(clusterLabels[0])}, ${clusterLabels[1]}, and ${clusterLabels[2]} demand is stacking here.`;
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function rankCandidates(candidates, graphContext) {
  for (const candidate of candidates) {
    candidate.graphSupportGaps = graphContext.supportGapRows
      .filter((entry) => toRelativePath(entry.href).startsWith(`${candidate.hubPath}/`))
      .sort((left, right) => (right.opportunityScore || 0) - (left.opportunityScore || 0))
      .slice(0, 5)
      .map((entry) => ({
        label: entry.label,
        href: entry.href,
        opportunityScore: entry.opportunityScore,
        action: entry.action,
      }));

    candidate.graphLinkSuggestions = (graphContext.graphLinks?.suggestions || [])
      .filter((entry) => toRelativePath(entry.targetUrl) === candidate.hubPath)
      .slice(0, 6)
      .map((entry) => ({
        sourceUrl: entry.sourceUrl,
        sourceSurface: entry.sourceSurface,
        anchorText: entry.anchorText,
        priority: entry.priority,
      }));

    candidate.symptomHubs = pickSymptomHubs(candidate, graphContext.symptomMap);
    candidate.note = composeNote(candidate);

    const taskDiversity = candidate.tasks.size;
    const clusterDiversity = [...candidate.clusters.keys()].filter((key) => key !== 'other').length;
    const gscDelta = candidate.gscCurrentImpressions - candidate.gscPreviousImpressions;
    const gaDelta = candidate.gaCurrentSessions - candidate.gaPreviousSessions;

    candidate.score = Number((
      candidate.query24hCount * 8 +
      candidate.query24hImpressions * 2 +
      candidate.gscCurrentImpressions * 0.35 +
      Math.max(gscDelta, 0) * 0.45 +
      candidate.gaCurrentSessions * 4 +
      Math.max(gaDelta, 0) * 5 +
      taskDiversity * 10 +
      clusterDiversity * 6 +
      Math.min(candidate.graphLinkSuggestions.length, 5) * 2
    ).toFixed(1));
  }

  return candidates
    .filter((candidate) => (
      candidate.query24hCount > 0 ||
      candidate.gscCurrentImpressions > 0 ||
      candidate.gaCurrentSessions > 0
    ))
    .sort((left, right) => right.score - left.score || right.query24hImpressions - left.query24hImpressions || left.hubPath.localeCompare(right.hubPath));
}

function buildHomepageRecommendations(candidates, limit = 6) {
  const seenFamilies = new Set();
  const picks = [];

  for (const candidate of candidates) {
    if (COVERAGE_BACKED_COMMAND_CENTER_KEYS.size && !COVERAGE_BACKED_COMMAND_CENTER_KEYS.has(candidate.key)) {
      continue;
    }

    const hasCommandCenterSignal = (
      candidate.query24hCount >= 2 ||
      candidate.query24hImpressions >= 5
    );

    if (!hasCommandCenterSignal) continue;
    if (seenFamilies.has(candidate.familyKey)) continue;
    seenFamilies.add(candidate.familyKey);
    picks.push(candidate);
    if (picks.length >= limit) break;
  }

  return picks.map((candidate) => ({
    year: candidate.year,
    make: candidate.make,
    model: candidate.model,
    note: candidate.note,
    hubPath: candidate.hubPath,
    hubUrl: candidate.hubUrl,
    score: candidate.score,
  }));
}

function summarizeOrganicSources(current, previous) {
  const previousMap = new Map(previous.map((row) => [row.source, row.sessions]));
  return current.map((row) => ({
    source: row.source,
    currentSessions: row.sessions,
    previousSessions: previousMap.get(row.source) || 0,
    deltaSessions: row.sessions - (previousMap.get(row.source) || 0),
    deltaPct: Number(pct(row.sessions, previousMap.get(row.source) || 0).toFixed(1)),
  }));
}

function toSerializableCandidate(candidate) {
  const gscDelta = candidate.gscCurrentImpressions - candidate.gscPreviousImpressions;
  const gaDelta = candidate.gaCurrentSessions - candidate.gaPreviousSessions;

  return {
    year: candidate.year,
    make: candidate.make,
    model: candidate.model,
    label: `${candidate.year} ${candidate.make} ${candidate.model}`,
    hubPath: candidate.hubPath,
    hubUrl: candidate.hubUrl,
    score: candidate.score,
    note: candidate.note,
    query24hCount: candidate.query24hCount,
    query24hImpressions: candidate.query24hImpressions,
    gscCurrentImpressions: candidate.gscCurrentImpressions,
    gscPreviousImpressions: candidate.gscPreviousImpressions,
    gscDeltaImpressions: gscDelta,
    gscCurrentClicks: candidate.gscCurrentClicks,
    gaCurrentSessions: candidate.gaCurrentSessions,
    gaPreviousSessions: candidate.gaPreviousSessions,
    gaDeltaSessions: gaDelta,
    topTasks: topEntriesFromMap(candidate.tasks, 5).map((entry) => ({
      task: entry.key,
      label: taskDisplay(entry.key),
      weight: Number(entry.value.toFixed ? entry.value.toFixed(1) : entry.value),
      cluster: clusterFromTask(entry.key),
    })),
    topClusters: topEntriesFromMap(candidate.clusters, 5).map((entry) => ({
      cluster: entry.key,
      label: CLUSTER_LABELS[entry.key] || entry.key,
      weight: Number(entry.value.toFixed ? entry.value.toFixed(1) : entry.value),
    })).filter((entry) => entry.cluster !== 'other'),
    topGscPages: candidate.gscPages
      .filter((entry) => entry.range === 'gscCurrent')
      .sort((left, right) => right.impressions - left.impressions)
      .slice(0, 5),
    topGaPages: candidate.gaPages
      .filter((entry) => entry.range === 'gaCurrent')
      .sort((left, right) => right.sessions - left.sessions)
      .slice(0, 5),
    graphSupportGaps: candidate.graphSupportGaps,
    graphLinkSuggestions: candidate.graphLinkSuggestions,
    symptomHubs: candidate.symptomHubs,
  };
}

function writeMarkdown(report, mdPath) {
  const lines = [];
  lines.push('# Command Center Opportunities');
  lines.push('');
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push('');
  lines.push('## Overview');
  lines.push('');
  lines.push(`- Weekly compare: ${report.currentRange.startDate} to ${report.currentRange.endDate} vs ${report.previousRange.startDate} to ${report.previousRange.endDate}`);
  if (report.querySnapshot?.metadata) {
    lines.push(`- 24h query snapshot: ${report.querySnapshot.metadata.startDate} to ${report.querySnapshot.metadata.endDate}, ${report.querySnapshot.metadata.rowCount} queries, ${report.querySnapshot.metadata.totalImpressions} impressions`);
  }
  lines.push(`- Top exact-vehicle candidates ranked: ${report.topCommandCenters.length}`);
  lines.push('');
  lines.push('## Homepage Shortlist');
  lines.push('');
  for (const candidate of report.homepageRecommendations) {
    lines.push(`- ${candidate.year} ${candidate.make} ${candidate.model}`);
    lines.push(`  - score: ${candidate.score}`);
    lines.push(`  - hub: ${candidate.hubPath}`);
    lines.push(`  - note: ${candidate.note}`);
  }
  lines.push('');
  lines.push('## Top Command Centers');
  lines.push('');

  report.topCommandCenters.slice(0, 10).forEach((candidate, index) => {
    lines.push(`${index + 1}. ${candidate.label}`);
    lines.push(`   - score: ${candidate.score}`);
    lines.push(`   - 24h query signal: ${candidate.query24hCount} repeated queries / ${candidate.query24hImpressions} impressions`);
    lines.push(`   - weekly GSC exact-repair signal: ${candidate.gscCurrentImpressions} impressions (${candidate.gscDeltaImpressions >= 0 ? '+' : ''}${candidate.gscDeltaImpressions} vs prior week), ${candidate.gscCurrentClicks} clicks`);
    lines.push(`   - weekly GA4 organic exact-repair signal: ${candidate.gaCurrentSessions} sessions (${candidate.gaDeltaSessions >= 0 ? '+' : ''}${candidate.gaDeltaSessions} vs prior week)`);
    lines.push(`   - top lanes: ${candidate.topClusters.map((entry) => entry.label).join(', ') || 'n/a'}`);
    lines.push(`   - top tasks: ${candidate.topTasks.map((entry) => entry.label).join(', ') || 'n/a'}`);
    lines.push(`   - graph symptom lanes: ${candidate.symptomHubs.map((entry) => entry.label).join(', ') || 'n/a'}`);
    lines.push(`   - graph hub links ready: ${candidate.graphLinkSuggestions.length}`);
    lines.push(`   - note: ${candidate.note}`);
  });

  lines.push('');
  lines.push('## Organic Sources');
  lines.push('');
  for (const source of report.organicSources.slice(0, 10)) {
    lines.push(`- ${source.source}: ${source.currentSessions} sessions (${source.deltaSessions >= 0 ? '+' : ''}${source.deltaSessions} vs prior week)`);
  }
  lines.push('');
  lines.push('## Graph Inputs');
  lines.push('');
  lines.push(`- graph priority: ${report.graphContext.graphPriorityPath || 'n/a'}`);
  lines.push(`- graph link suggestions: ${report.graphContext.graphLinksPath || 'n/a'}`);
  if (report.querySnapshot.summaryPath) {
    lines.push(`- latest 24h query summary: ${report.querySnapshot.summaryPath}`);
  }
  lines.push('');

  fs.writeFileSync(mdPath, `${lines.join('\n')}\n`);
}

async function main() {
  ensureReportsDir();

  const today = new Date().toISOString().slice(0, 10);
  const endDate = getArg('end', addDays(today, -1));
  const startDate = getArg('start', addDays(endDate, -6));
  const previousEndDate = addDays(startDate, -1);
  const previousStartDate = addDays(previousEndDate, -6);

  const querySnapshot = loadLatestQuerySnapshot();
  const graphContext = loadGraphContext();
  const { searchconsole, analyticsdata } = await buildClients();

  const [
    gscCurrentPages,
    gscPreviousPages,
    gaCurrentPages,
    gaPreviousPages,
    gaCurrentSources,
    gaPreviousSources,
  ] = await Promise.all([
    fetchGscPages(searchconsole, startDate, endDate),
    fetchGscPages(searchconsole, previousStartDate, previousEndDate),
    fetchGaOrganicPages(analyticsdata, startDate, endDate),
    fetchGaOrganicPages(analyticsdata, previousStartDate, previousEndDate),
    fetchGaOrganicSources(analyticsdata, startDate, endDate),
    fetchGaOrganicSources(analyticsdata, previousStartDate, previousEndDate),
  ]);

  const candidates = new Map();
  addSummarySignals(candidates, querySnapshot);
  addGscSignals(candidates, gscCurrentPages, 'gscCurrent');
  addGscSignals(candidates, gscPreviousPages, 'gscPrevious');
  addGaSignals(candidates, gaCurrentPages, 'gaCurrent');
  addGaSignals(candidates, gaPreviousPages, 'gaPrevious');

  const ranked = rankCandidates([...candidates.values()], graphContext);
  const homepageRecommendations = buildHomepageRecommendations(ranked, 6);
  const organicSources = summarizeOrganicSources(gaCurrentSources, gaPreviousSources);

  const report = {
    generatedAt: new Date().toISOString(),
    currentRange: { startDate, endDate },
    previousRange: { startDate: previousStartDate, endDate: previousEndDate },
    querySnapshot,
    organicSources,
    graphContext: {
      graphPriorityPath: graphContext.graphPriorityPath,
      graphLinksPath: graphContext.graphLinksPath,
      underlinkedSummary: graphContext.graphPriority?.underlinkedSummary || null,
      highValueSymptomHubs: (graphContext.graphPriority?.highValueSymptomHubs || []).slice(0, 6).map((entry) => ({
        label: entry.label,
        href: entry.href,
        opportunityScore: entry.opportunityScore,
      })),
    },
    homepageRecommendations,
    topCommandCenters: ranked.slice(0, 20).map(toSerializableCandidate),
  };

  const stamp = endDate;
  const jsonPath = path.join(REPORTS_DIR, `command-center-opportunities-${stamp}.json`);
  const mdPath = path.join(REPORTS_DIR, `command-center-opportunities-${stamp}.md`);
  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  writeMarkdown(report, mdPath);

  console.log(JSON.stringify({
    currentRange: report.currentRange,
    previousRange: report.previousRange,
    homepageRecommendations: report.homepageRecommendations,
    topCommandCenters: report.topCommandCenters.slice(0, 10).map((candidate) => ({
      label: candidate.label,
      score: candidate.score,
      query24hCount: candidate.query24hCount,
      query24hImpressions: candidate.query24hImpressions,
      gscCurrentImpressions: candidate.gscCurrentImpressions,
      gaCurrentSessions: candidate.gaCurrentSessions,
      topClusters: candidate.topClusters.slice(0, 3).map((entry) => entry.label),
    })),
    organicSources: report.organicSources.slice(0, 6),
    jsonPath,
    mdPath,
  }, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
