// Server-only — imported from geminiService.ts (API routes only)

// ─── Cloudflare KV Client ─────────────────────────────────────────────────────
// Thin REST client for reading vehicle knowledge-graph slices from Workers KV.
// Used as a fast navigation layer: one KV read replaces the 4-5 sequential
// HTTP fetches that walk the charm.li LMDB directory tree.

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID ?? '';
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN ?? '';
const KV_NAMESPACE_ID = process.env.CLOUDFLARE_KV_NAMESPACE_ID ?? '';

const KV_BASE = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/storage/kv/namespaces/${KV_NAMESPACE_ID}`;

// ─── Circuit Breaker ──────────────────────────────────────────────────────────
const FAILURE_THRESHOLD = 3;
const COOLDOWN_MS = 3 * 60 * 1000;
let kvFailures = 0;
let kvOpenUntil = 0;

function isKVCircuitOpen(): boolean {
  if (kvFailures >= FAILURE_THRESHOLD && Date.now() < kvOpenUntil) return true;
  if (Date.now() >= kvOpenUntil) kvFailures = 0;
  return false;
}

function recordKVFailure(): void {
  kvFailures++;
  if (kvFailures >= FAILURE_THRESHOLD) kvOpenUntil = Date.now() + COOLDOWN_MS;
}

function recordKVSuccess(): void {
  kvFailures = 0;
  kvOpenUntil = 0;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface KVContentEntry {
  hash: string;
  type: string;   // procedure, diagram, dtc, description, location, etc.
  title: string;
}

export interface KVVehicleData {
  v: {
    id: string;
    make: string;
    year: number;
    model: string;
    variant: string;
    slug: string;
    makeSlug: string;
    modelSlug: string;
  };
  sc: number;  // system count
  cc: number;  // content count
  sys: Record<string, KVContentEntry[]>;
}

// ─── Core Fetch ───────────────────────────────────────────────────────────────

async function kvGet(key: string): Promise<string | null> {
  if (!ACCOUNT_ID || !API_TOKEN || !KV_NAMESPACE_ID) return null;
  if (isKVCircuitOpen()) return null;

  try {
    const resp = await fetch(`${KV_BASE}/values/${encodeURIComponent(key)}`, {
      headers: { 'Authorization': `Bearer ${API_TOKEN}` },
      signal: AbortSignal.timeout ? AbortSignal.timeout(5000) : undefined,
    });

    if (!resp.ok) {
      if (resp.status === 404) return null; // key doesn't exist, not a failure
      recordKVFailure();
      return null;
    }

    recordKVSuccess();
    return await resp.text();
  } catch {
    recordKVFailure();
    return null;
  }
}

async function kvListKeys(prefix: string, limit: number = 10): Promise<string[]> {
  if (!ACCOUNT_ID || !API_TOKEN || !KV_NAMESPACE_ID) return [];
  if (isKVCircuitOpen()) return [];

  try {
    const resp = await fetch(
      `${KV_BASE}/keys?prefix=${encodeURIComponent(prefix)}&limit=${limit}`,
      {
        headers: { 'Authorization': `Bearer ${API_TOKEN}` },
        signal: AbortSignal.timeout ? AbortSignal.timeout(5000) : undefined,
      },
    );

    if (!resp.ok) {
      recordKVFailure();
      return [];
    }

    recordKVSuccess();
    const data = await resp.json() as { result?: Array<{ name: string }> };
    return (data.result ?? []).map(k => k.name);
  } catch {
    recordKVFailure();
    return [];
  }
}

// ─── Vehicle Lookup ───────────────────────────────────────────────────────────

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/**
 * Look up a vehicle in KV. Handles the variant-suffix problem:
 * keys are like `vehicle:toyota:2010:camry:2ar-fe` but the caller
 * only knows make/year/model. We list keys with that prefix and
 * pick the best match.
 */
export async function getVehicleFromKV(
  make: string,
  year: number,
  model: string,
): Promise<KVVehicleData | null> {
  const makeSlug = slugify(make);
  const modelSlug = slugify(model);
  const prefix = `vehicle:${makeSlug}:${year}:${modelSlug}:`;

  // List all variants for this make/year/model
  const keys = await kvListKeys(prefix, 20);
  if (keys.length === 0) {
    // Try without model slug in case of slug mismatch — broader search
    const broaderPrefix = `vehicle:${makeSlug}:${year}:`;
    const broaderKeys = await kvListKeys(broaderPrefix, 50);
    // Find best model match from broader results
    const matching = broaderKeys.filter(k => {
      const parts = k.split(':');
      return parts.length >= 4 && parts[3].includes(modelSlug.split('-')[0]);
    });
    if (matching.length === 0) return null;
    keys.push(...matching);
  }

  // Fetch the first matching vehicle (most common variant)
  const raw = await kvGet(keys[0]);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as KVVehicleData;
  } catch {
    return null;
  }
}

/**
 * Find content entries in a vehicle's KV data that are relevant to a task.
 * Returns entries sorted by relevance (procedures and descriptions first).
 */
export function findRelevantKVContent(
  sys: Record<string, KVContentEntry[]>,
  task: string,
): Array<{ system: string; entry: KVContentEntry }> {
  const taskLower = task.toLowerCase();
  const taskWords = taskLower.split(/\s+/).filter(w => w.length > 3);

  // Task keywords for matching system names
  const TASK_SYSTEMS: Record<string, string[]> = {
    'oil':          ['oil', 'lubrication', 'engine oil', 'oil pan', 'oil filter'],
    'brake':        ['brake', 'pad', 'rotor', 'caliper', 'disc'],
    'spark':        ['spark plug', 'tune-up', 'ignition'],
    'battery':      ['battery', 'charging system'],
    'coolant':      ['cooling', 'coolant', 'thermostat', 'radiator'],
    'transmission': ['transmission', 'clutch', 'fluid'],
    'alternator':   ['alternator', 'charging', 'generator'],
    'starter':      ['starter', 'starting system'],
    'belt':         ['belt', 'timing', 'serpentine', 'drive belt'],
    'filter':       ['filter', 'air filter', 'cabin filter', 'fuel filter'],
    'tire':         ['tire', 'wheel bearing', 'hub', 'suspension'],
    'shock':        ['shock', 'strut', 'suspension', 'spring'],
    'wiper':        ['wiper', 'windshield', 'washer'],
    'headlight':    ['headlight', 'headlamp', 'bulb', 'lighting'],
    'exhaust':      ['exhaust', 'catalytic', 'muffler', 'oxygen sensor'],
    'fuel':         ['fuel pump', 'fuel injector', 'fuel system'],
    'ac':           ['a/c', 'air conditioning', 'compressor', 'refrigerant', 'hvac'],
    'window':       ['window', 'glass', 'regulator'],
    'door':         ['door', 'lock', 'handle', 'latch'],
  };

  // Collect relevant keywords from the task
  const keywords: string[] = [...taskWords];
  for (const [key, words] of Object.entries(TASK_SYSTEMS)) {
    if (taskLower.includes(key) || words.some(w => taskLower.includes(w))) {
      keywords.push(...words);
    }
  }

  const results: Array<{ system: string; entry: KVContentEntry; score: number }> = [];

  for (const [systemName, entries] of Object.entries(sys)) {
    const sysLower = systemName.toLowerCase();
    const sysMatch = keywords.some(kw => sysLower.includes(kw));

    for (const entry of entries) {
      const titleLower = entry.title.toLowerCase();
      const titleMatch = keywords.some(kw => titleLower.includes(kw));

      if (!sysMatch && !titleMatch) continue;

      // Score: system match + title match + type bonus
      let score = (sysMatch ? 2 : 0) + (titleMatch ? 3 : 0);
      if (entry.type === 'procedure') score += 2;
      if (entry.type === 'description') score += 1;
      if (entry.type === 'diagram') score += 1;

      results.push({ system: systemName, entry, score });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}
