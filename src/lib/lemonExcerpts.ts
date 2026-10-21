import 'server-only';

import neo4j from 'neo4j-driver';
import { runQuery } from '@/lib/neo4jClient';
import { CHARM_ARCHIVE_BASE } from '@/lib/charmBase';
import type { OEMExcerptData } from '@/lib/manualSectionLinks';

// ─── Make Aliases for Neo4j Variant Normalization ────────────────────────────

const MAKE_ALIASES: Record<string, string[]> = {
  'nissan': ['nissan-datsun', 'nissan'],
  'datsun': ['nissan-datsun', 'datsun'],
  'dodge': ['dodge-and-ram', 'dodge'],
  'ram': ['dodge-and-ram', 'ram'],
  'mercedes': ['mercedes-benz', 'mercedes'],
  'mercedes-benz': ['mercedes-benz', 'mercedes'],
  'alfa-romeo': ['alfa-romeo'],
  'land-rover': ['land-rover'],
  'american-motors': ['american-motors'],
  'chevy': ['chevrolet'],
  'chevrolet': ['chevrolet'],
  'vw': ['volkswagen'],
  'volkswagen': ['volkswagen'],
};

// ─── Task Keyword Mapping ───────────────────────────────────────────────────

const TASK_KEYWORDS_MAP: Record<string, string[]> = {
  'oil-change': [
    'engine oil',
    'oil filter',
    'oil and filter',
    'oil change',
    'lubrication system',
    'oil replacement',
    'differential oil',
  ],
  'brake-pad-replacement': [
    'brake pad',
    'disc brake pad',
    'brake friction',
    'brake pads',
    'front brake pad',
    'rear brake pad',
    'brake lining',
  ],
  'brake-rotor-replacement': [
    'brake rotor',
    'brake disc',
    'disc brake rotor',
    'rotor replacement',
  ],
  'brake-fluid-flush': [
    'brake fluid',
    'bleed brake',
    'brake bleed',
    'hydraulic brake',
    'air bleeding',
  ],
  'battery-replacement': [
    'battery replacement',
    '12v battery',
    '12-volt battery',
    'storage battery',
    'auxiliary battery',
    'battery tray',
  ],
  'alternator-replacement': [
    'generator',
    'alternator',
    'charging system',
    'voltage regulator',
  ],
  'starter-replacement': [
    'starter motor',
    'starting motor',
    'starter replacement',
  ],
  'spark-plug-replacement': [
    'spark plug',
    'spark plugs',
    'spark plug replacement',
    'ignition coil',
  ],
  'ignition-coil-replacement': [
    'ignition coil',
    'coil on plug',
    'coil pack',
  ],
  'water-pump-replacement': [
    'water pump',
    'coolant pump',
    'water pump replacement',
  ],
  'thermostat-replacement': [
    'thermostat',
    'water outlet',
    'engine thermostat',
    'thermostat housing',
  ],
  'radiator-replacement': [
    'radiator',
    'cooling system radiator',
    'radiator assembly',
  ],
  'serpentine-belt-replacement': [
    'drive belt',
    'accessory drive belt',
    'serpentine belt',
    'fan belt',
    'belt tensioner',
  ],
  'drive-belt-replacement': [
    'drive belt',
    'accessory drive belt',
    'serpentine belt',
  ],
  'timing-belt-replacement': [
    'timing belt',
    'timing belt replacement',
  ],
  'timing-chain-replacement': [
    'timing chain',
    'timing chain replacement',
    'chain tensioner',
  ],
  'cabin-air-filter-replacement': [
    'cabin air filter',
    'passenger compartment air filter',
    'cabin filter',
    'dust filter',
    'pollen filter',
  ],
  'engine-air-filter-replacement': [
    'air cleaner element',
    'engine air filter',
    'air filter element',
    'air cleaner filter',
  ],
  'transmission-fluid-change': [
    'transmission fluid',
    'transaxle fluid',
    'automatic transmission fluid',
    'drain and refill',
    'atf',
    'manual transmission fluid',
  ],
  'differential-fluid-change': [
    'differential fluid',
    'differential oil',
    'rear axle fluid',
    'hypoid gear oil',
    'gear lubricant',
  ],
  'coolant-flush': [
    'coolant replacement',
    'engine coolant',
    'drain and refill',
    'cooling system',
    'coolant flush',
  ],
  'oxygen-sensor-replacement': [
    'oxygen sensor',
    'o2 sensor',
    'heated oxygen sensor',
    'air fuel ratio sensor',
    'lambda sensor',
  ],
  'mass-air-flow-sensor-replacement': [
    'mass air flow',
    'maf sensor',
    'air flow meter',
  ],
  'fuel-pump-replacement': [
    'fuel pump',
    'fuel sender',
    'fuel tank module',
    'high pressure fuel pump',
  ],
  'fuel-filter-replacement': [
    'fuel filter',
    'fuel strainer',
  ],
  'fuel-injector-replacement': [
    'fuel injector',
    'injection nozzle',
    'injector replacement',
  ],
  'wheel-bearing-replacement': [
    'wheel bearing',
    'wheel hub',
    'hub and bearing',
    'axle hub',
  ],
  'tie-rod-replacement': [
    'tie rod',
    'tie-rod',
    'steering rack end',
    'outer tie rod',
    'inner tie rod',
  ],
  'ball-joint-replacement': [
    'ball joint',
    'control arm ball joint',
    'lower ball joint',
    'upper ball joint',
  ],
  'shock-absorber-replacement': [
    'shock absorber',
    'rear shock',
    'damper',
  ],
  'strut-replacement': [
    'strut',
    'front strut',
    'strut assembly',
    'suspension strut',
  ],
  'cv-axle-replacement': [
    'drive axle',
    'drive shaft',
    'cv axle',
    'halfshaft',
    'propeller shaft',
    'constant velocity',
  ],
  'headlight-bulb-replacement': [
    'headlamp bulb',
    'headlight bulb',
    'headlamp',
    'headlight',
    'front turn signal light bulb',
  ],
  'tail-light-replacement': [
    'tail lamp',
    'taillight',
    'stop lamp',
    'tail light',
    'back-up light bulb',
  ],
  'clutch-replacement': [
    'clutch disc',
    'clutch cover',
    'pressure plate',
    'clutch replacement',
    'release bearing',
  ],
  'power-steering-fluid-change': [
    'power steering fluid',
    'power steering bleed',
    'steering hydraulic',
  ],
  'egr-valve-replacement': [
    'egr valve',
    'exhaust gas recirculation',
  ],
  'catalytic-converter-replacement': [
    'catalytic converter',
    'exhaust manifold with converter',
  ],
  'muffler-replacement': [
    'exhaust muffler',
    'tailpipe',
    'muffler assembly',
  ],
  'windshield-wiper-replacement': [
    'wiper blade',
    'wiper arm',
    'windshield wiper',
  ],
  'turbo-replacement': [
    'turbocharger',
    'turbo',
    'supercharger',
  ],
  'glow-plug-replacement': [
    'glow plug',
  ],
  'valve-cover-gasket-replacement': [
    'valve cover gasket',
    'cylinder head cover gasket',
    'camshaft cover gasket',
  ],
  'head-gasket-replacement': [
    'cylinder head gasket',
    'head gasket',
  ],
  'crankshaft-sensor-replacement': [
    'crankshaft position sensor',
    'ckp sensor',
  ],
  'camshaft-sensor-replacement': [
    'camshaft position sensor',
    'cmp sensor',
  ],
};

function getKeywordsForTask(task: string): string[] {
  const normalized = task.toLowerCase().trim();
  if (TASK_KEYWORDS_MAP[normalized]) {
    return TASK_KEYWORDS_MAP[normalized];
  }
  // Fallback: extract substantive words
  const words = normalized
    .replace(/-/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !['replacement', 'change', 'flush', 'fluid', 'the', 'and', 'for'].includes(w));
  return words.length > 0 ? words : [normalized.replace(/-/g, ' ')];
}

function cleanHtmlToText(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

// ─── LRU Cache for Excerpts ─────────────────────────────────────────────────

const MAX_CACHE_SIZE = 5000;
const excerptCache = new Map<string, OEMExcerptData[]>();

function getCacheKey(year: number, make: string, model: string, task: string): string {
  return `${year}:${make.toLowerCase()}:${model.toLowerCase()}:${task.toLowerCase()}`;
}

// ─── LEMON Excerpt Fetcher ──────────────────────────────────────────────────

export interface LemonExcerptQueryArgs {
  make: string;
  year: number;
  model: string;
  task: string;
  displayMake?: string;
  displayModel?: string;
  limit?: number;
}

interface Neo4jProcedureRecord extends Record<string, unknown> {
  title: string;
  variant: string;
  uriPath: string;
  encodedPath: string;
  source?: string;
}

export async function getLemonExcerptsForRepair(
  args: LemonExcerptQueryArgs,
): Promise<OEMExcerptData[]> {
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return [];
  }

  const cacheKey = getCacheKey(args.year, args.make, args.model, args.task);
  if (excerptCache.has(cacheKey)) {
    return excerptCache.get(cacheKey)!;
  }

  try {
    const rawMake = args.make.toLowerCase().trim();
    const makes = MAKE_ALIASES[rawMake] || [rawMake];
    const modelClean = args.model.toLowerCase().trim();
    const modelNorm = modelClean.replace(/-/g, ' ');
    const modelSlug = modelClean.replace(/\s+/g, '-');
    const year = Number(args.year);
    const limit = args.limit || 3;

    const keywords = getKeywordsForTask(args.task);
    if (keywords.length === 0) return [];

    // Build WHERE clause for keywords matching title or encoded path
    const kwClauses = keywords
      .map((_, i) => `toLower(p.title) CONTAINS $kw${i} OR toLower(r.encodedPath) CONTAINS $kw${i}`)
      .join(' OR ');

    const params: Record<string, unknown> = {
      year: neo4j.int(year),
      makes,
      modelNorm,
      modelSlug,
      limit: neo4j.int(limit * 3), // fetch extra candidates to account for content filtering
    };
    keywords.forEach((k, i) => {
      params[`kw${i}`] = k.toLowerCase().trim();
    });

    const cypher = `
      MATCH (v:Variant)<-[r:APPLIES_TO]-(p:Procedure)
      WHERE v.year = toInteger($year)
        AND v.make IN $makes
        AND (
          v.model = $modelSlug
          OR v.model = $modelNorm
          OR v.model CONTAINS $modelSlug
          OR v.model CONTAINS $modelNorm
          OR $modelSlug CONTAINS v.model
          OR $modelNorm CONTAINS v.model
        )
        AND (${kwClauses})
      RETURN DISTINCT 
        p.title AS title, 
        v.label AS variant, 
        v.uriPath AS uriPath, 
        r.encodedPath AS encodedPath, 
        p.source AS source
      ORDER BY 
        CASE 
          WHEN toLower(p.title) CONTAINS "replacement" OR toLower(p.title) CONTAINS "procedure" OR toLower(p.title) CONTAINS "removal" THEN 0 
          ELSE 1 
        END,
        p.title ASC
      LIMIT toInteger($limit)
    `;

    const records = await runQuery<Neo4jProcedureRecord>(cypher, params);
    if (!records || records.length === 0) {
      excerptCache.set(cacheKey, []);
      return [];
    }

    const excerpts: OEMExcerptData[] = [];
    const seenTitles = new Set<string>();

    for (const r of records) {
      if (excerpts.length >= limit) break;
      if (!r.uriPath || !r.encodedPath) continue;

      // Deduplicate similar procedure titles across variants
      const baseTitle = r.title.replace(/\s*—.*$/, '').toLowerCase().trim();
      if (seenTitles.has(baseTitle)) continue;

      const cleanUriPath = r.uriPath.startsWith('/') ? r.uriPath : `/${r.uriPath}`;
      const cleanEncodedPath = r.encodedPath.replace(/^\/+/, '');
      const fullUrl = `${CHARM_ARCHIVE_BASE}${cleanUriPath}Repair%20and%20Diagnosis/${cleanEncodedPath}`;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);

        const resp = await fetch(fullUrl, {
          signal: controller.signal,
          headers: { 'User-Agent': 'AllOEMManuals/1.0 repair-guide-builder' },
          cache: 'force-cache',
        });
        clearTimeout(timeoutId);

        if (resp.ok) {
          const html = await resp.text();
          // Extract main content area, skipping chrome and navigation
          const mainMatch = html.match(/<div class="main">([\s\S]*?)<\/div>\s*<div class="theme-colors footer">/i);
          const rawText = cleanHtmlToText(mainMatch ? mainMatch[1] : html);

          if (rawText.length > 50) {
            seenTitles.add(baseTitle);
            let preview = rawText.slice(0, 320).trim();
            // Cleanly break on last word boundary
            if (rawText.length > 320) {
              preview = preview.replace(/\s+\S*$/, '') + '...';
            }

            const manualHref = `/manual${cleanUriPath}Repair%20and%20Diagnosis/${cleanEncodedPath}`.replace(/\/+$/, '');
            const variantLabel = r.variant ? ` — ${r.variant}` : '';
            const sectionTitle = `${r.title}${variantLabel}`;

            excerpts.push({
              path: manualHref,
              make: args.displayMake || args.make,
              year,
              model: args.displayModel || args.model,
              sectionTitle,
              contentPreview: preview,
              manualHref,
            });
          }
        }
      } catch {
        // Skip failed or timed-out fetch
      }
    }

    // Manage LRU cache size
    if (excerptCache.size >= MAX_CACHE_SIZE) {
      const oldestKey = excerptCache.keys().next().value;
      if (oldestKey) excerptCache.delete(oldestKey);
    }
    excerptCache.set(cacheKey, excerpts);

    return excerpts;
  } catch (err) {
    console.warn('[lemonExcerpts] Failed to get excerpts:', err);
    return [];
  }
}
