import { getCharmMakesForDisplay } from '@/lib/wiringCoverage';

const CHARM_BASE = 'https://data.spotonauto.com';
const CHARM_HEADERS = {
  'User-Agent': 'SpotOnAuto/1.0 (+https://spotonauto.com) wiring-diagrams',
};

const DEFAULT_FETCH_RETRIES = 2;

function charmFetchOpts(revalidateSeconds = 3600, timeoutMs = 15000): RequestInit {
  return {
    headers: CHARM_HEADERS,
    signal: AbortSignal.timeout ? AbortSignal.timeout(timeoutMs) : undefined,
    next: { revalidate: revalidateSeconds },
  };
}

async function fetchCharmText(
  url: string,
  revalidateSeconds = 3600,
  errorMessage = 'Charm fetch failed',
  timeoutMs = 15000,
  retries = DEFAULT_FETCH_RETRIES,
): Promise<string> {
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const resp = await fetch(url, charmFetchOpts(revalidateSeconds, timeoutMs));
      if (!resp.ok) {
        throw new Error(`${errorMessage} (${resp.status})`);
      }
      return await resp.text();
    } catch (error) {
      lastError = error;
      if (attempt === retries) break;
      await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }
  throw new Error(errorMessage);
}

/** encodeURIComponent does not encode parentheses, but the CHARM server requires them encoded. */
function encodeCharmSegment(value: string): string {
  return encodeURIComponent(value)
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29');
}

function extractLinks(html: string): string[] {
  const matches = html.matchAll(/href=['"]([^'"]+)['"]/g);
  return [...matches].map(m => m[1]);
}

function decodeSegment(value: string): string {
  try {
    return decodeURIComponent(value).replace(/\/$/, '');
  } catch {
    return value.replace(/\/$/, '');
  }
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function scoreVariantMatch(variant: string, model: string): number {
  const variantNorm = normalizeText(variant);
  const modelNorm = normalizeText(model);

  if (!variantNorm || !modelNorm) return 0;
  if (variantNorm === modelNorm) return 100;
  if (variantNorm.startsWith(`${modelNorm} `)) return 95;
  if (variantNorm.includes(` ${modelNorm} `)) return 88;
  if (variantNorm.includes(modelNorm)) return 80;

  let tokenHits = 0;
  for (const token of modelNorm.split(' ')) {
    if (token.length > 1 && variantNorm.includes(token)) {
      tokenHits += 1;
    }
  }
  return tokenHits > 0 ? 45 + tokenHits * 10 : 0;
}

export interface WiringDiagramEntry {
  name: string;
  url: string;
  subPath: string;
}

export interface WiringDiagramSystem {
  system: string;
  diagrams: WiringDiagramEntry[];
}

export interface WiringDiagramIndex {
  vehicle: string;
  make: string;
  year: string;
  variant: string;
  systems: WiringDiagramSystem[];
  totalDiagrams: number;
}

export interface WiringImageData {
  images: string[];
  title: string;
}

export async function fetchWiringMakes(): Promise<string[]> {
  const html = await fetchCharmText(`${CHARM_BASE}/`, 86400, 'Cannot reach wiring data source');
  const links = extractLinks(html);
  return links
    .filter(link => {
      const segments = link.split('/').filter(Boolean);
      return segments.length === 1 && !segments[0].includes('.') && !segments[0].startsWith('_');
    })
    .map(link => decodeSegment(link.split('/').filter(Boolean)[0]))
    .sort((a, b) => a.localeCompare(b));
}

export async function fetchWiringYears(make: string): Promise<number[]> {
  const charmMakes = getCharmMakesForDisplay(make);
  const allYears = new Set<number>();

  for (const charmMake of charmMakes) {
    try {
      const html = await fetchCharmText(
        `${CHARM_BASE}/${encodeCharmSegment(charmMake)}/`,
        86400,
        'Make not found',
      );
      const links = extractLinks(html);
      for (const link of links) {
        const segments = link.split('/').filter(Boolean);
        const year = Number.parseInt(segments[segments.length - 1], 10);
        if (Number.isFinite(year) && year >= 1982 && year <= 2013) {
          allYears.add(year);
        }
      }
    } catch {
      // This CHARM make may not exist — continue
    }
  }

  return [...allYears].sort((a, b) => b - a);
}

export async function fetchWiringVariants(make: string, year: string): Promise<string[]> {
  // Try all CHARM makes that map to this display make (e.g. "Ford" → ["Ford", "Ford Truck"])
  const charmMakes = getCharmMakesForDisplay(make);
  const allVariants = new Set<string>();

  for (const charmMake of charmMakes) {
    try {
      const html = await fetchCharmText(
        `${CHARM_BASE}/${encodeCharmSegment(charmMake)}/${year}/`,
        86400,
        'Year not found',
      );
      const links = extractLinks(html);
      const variants = links
        .filter(link => {
          if (
            link.startsWith('/') ||
            link.startsWith('http') ||
            link.includes('.css') ||
            link.includes('.js')
          ) {
            return false;
          }
          const segments = link.split('/').filter(Boolean);
          return segments.length === 1 && link.endsWith('/');
        })
        .map(link => decodeSegment(link.split('/').filter(Boolean)[0]));

      for (const v of variants) allVariants.add(v);
    } catch {
      // This CHARM make may not exist for this year — continue to next
    }
  }

  return [...allVariants].sort((a, b) => a.localeCompare(b));
}

export function resolveVariantForModel(variants: string[], model: string): string | null {
  let bestVariant: string | null = null;
  let bestScore = 0;

  for (const variant of variants) {
    const score = scoreVariantMatch(variant, model);
    if (score > bestScore) {
      bestScore = score;
      bestVariant = variant;
    }
  }

  return bestScore >= 60 ? bestVariant : null;
}

async function fetchRepairAndDiagnosisHtml(
  make: string,
  year: string,
  variant: string,
): Promise<{ html: string; resolvedVariant: string; resolvedMake: string }> {
  // Try all CHARM makes for this display make (e.g. "Ford" → ["Ford", "Ford Truck"])
  const charmMakes = getCharmMakesForDisplay(make);

  for (const charmMake of charmMakes) {
    const encodedMake = encodeCharmSegment(charmMake);

    // Try direct variant match first
    try {
      const directUrl = `${CHARM_BASE}/${encodedMake}/${year}/${encodeCharmSegment(variant)}/Repair%20and%20Diagnosis/`;
      const html = await fetchCharmText(directUrl, 3600, 'Repair data not found');
      return { html, resolvedVariant: variant, resolvedMake: charmMake };
    } catch {
      // Direct match failed — try fuzzy variant matching within this CHARM make
    }

    try {
      const html = await fetchCharmText(`${CHARM_BASE}/${encodedMake}/${year}/`, 86400, 'Year not found');
      const links = extractLinks(html);
      const variants = links
        .filter(link => !link.startsWith('/') && !link.startsWith('http') && !link.includes('.css') && !link.includes('.js') && link.endsWith('/') && link.split('/').filter(Boolean).length === 1)
        .map(link => decodeSegment(link.split('/').filter(Boolean)[0]));
      const matched = resolveVariantForModel(variants, variant);
      if (matched) {
        const matchedUrl = `${CHARM_BASE}/${encodedMake}/${year}/${encodeCharmSegment(matched)}/Repair%20and%20Diagnosis/`;
        const repairHtml = await fetchCharmText(matchedUrl, 3600, 'Repair data not found');
        return { html: repairHtml, resolvedVariant: matched, resolvedMake: charmMake };
      }
    } catch {
      // This CHARM make doesn't have data — try next
    }
  }

  throw new Error('Repair data not found');
}

async function resolveVariantIfDiagramBucketIsEmpty(args: {
  make: string;
  resolvedMake: string;
  year: string;
  variant: string;
  currentVariant: string;
  hasDiagrams: boolean;
}): Promise<{ html: string; resolvedVariant: string; resolvedMake: string } | null> {
  if (args.hasDiagrams || args.currentVariant !== args.variant) return null;

  const charmMakes = getCharmMakesForDisplay(args.make);
  for (const charmMake of charmMakes) {
    try {
      const html = await fetchCharmText(`${CHARM_BASE}/${encodeCharmSegment(charmMake)}/${args.year}/`, 86400, 'Year not found');
      const links = extractLinks(html);
      const variants = links
        .filter(link => !link.startsWith('/') && !link.startsWith('http') && !link.includes('.css') && !link.includes('.js') && link.endsWith('/') && link.split('/').filter(Boolean).length === 1)
        .map(link => decodeSegment(link.split('/').filter(Boolean)[0]));
      const matched = resolveVariantForModel(variants, args.variant);
      if (matched && matched !== args.currentVariant) {
        const matchedUrl = `${CHARM_BASE}/${encodeCharmSegment(charmMake)}/${args.year}/${encodeCharmSegment(matched)}/Repair%20and%20Diagnosis/`;
        const repairHtml = await fetchCharmText(matchedUrl, 3600, 'Repair data not found');
        return { html: repairHtml, resolvedVariant: matched, resolvedMake: charmMake };
      }
    } catch {
      // Continue to next CHARM make
    }
  }

  return null;
}

export async function fetchWiringDiagramIndex(
  make: string,
  year: string,
  variant: string,
): Promise<WiringDiagramIndex> {
  let { html, resolvedVariant, resolvedMake } = await fetchRepairAndDiagnosisHtml(make, year, variant);
  let repairAndDiagnosisUrl = `${CHARM_BASE}/${encodeCharmSegment(resolvedMake)}/${year}/${encodeCharmSegment(resolvedVariant)}/Repair%20and%20Diagnosis/`;
  let allLinks = extractLinks(html);
  let diagramLinks = allLinks.filter(link => link.includes('Diagrams/'));

  const matchedVariantBucket = await resolveVariantIfDiagramBucketIsEmpty({
    make,
    resolvedMake,
    year,
    variant,
    currentVariant: resolvedVariant,
    hasDiagrams: diagramLinks.length > 0,
  });

  if (matchedVariantBucket) {
    html = matchedVariantBucket.html;
    resolvedVariant = matchedVariantBucket.resolvedVariant;
    resolvedMake = matchedVariantBucket.resolvedMake;
    repairAndDiagnosisUrl = `${CHARM_BASE}/${encodeCharmSegment(resolvedMake)}/${year}/${encodeCharmSegment(resolvedVariant)}/Repair%20and%20Diagnosis/`;
    allLinks = extractLinks(html);
    diagramLinks = allLinks.filter(link => link.includes('Diagrams/'));
  }

  const systems: Record<string, WiringDiagramEntry[]> = {};
  for (const link of diagramLinks) {
    const parts = link.split('/').filter(Boolean);
    const diagramIndex = parts.findIndex(part => decodeURIComponent(part) === 'Diagrams');
    if (diagramIndex === -1) continue;

    const systemParts = parts.slice(0, diagramIndex);
    const system = decodeSegment(systemParts[0] || 'General');
    const component = systemParts.length > 1
      ? systemParts.slice(1).map(segment => decodeSegment(segment)).join(' > ')
      : '';
    const subPath = parts.slice(diagramIndex + 1).map(segment => decodeSegment(segment)).join(' > ') || 'Diagram';
    const name = component ? `${component} — ${subPath}` : subPath;
    const absoluteUrl = link.startsWith('http')
      ? link
      : `${repairAndDiagnosisUrl}${link.startsWith('/') ? link.slice(1) : link}`;

    if (!systems[system]) systems[system] = [];
    systems[system].push({ name, url: absoluteUrl, subPath });
  }

  const sortedSystems: WiringDiagramSystem[] = Object.entries(systems)
    .map(([system, diagrams]) => ({
      system,
      diagrams,
    }))
    .sort((a, b) => a.system.localeCompare(b.system));

  return {
    vehicle: `${year} ${make} ${decodeSegment(resolvedVariant)}`,
    make,
    year,
    variant: resolvedVariant,
    systems: sortedSystems,
    totalDiagrams: diagramLinks.length,
  };
}

export async function fetchWiringDiagramImages(url: string): Promise<WiringImageData> {
  const html = await fetchCharmText(url, 86400, 'Diagram page not found');
  const imageMatches = html.matchAll(/<img[^>]+class=['"]big-img['"][^>]+src=['"]([^'"]+)['"]/g);
  const images = [...imageMatches].map(match => `${CHARM_BASE}${match[1]}`);
  const titleMatch = html.match(/<h1>([^<]+)<\/h1>/);

  return {
    images,
    title: titleMatch ? titleMatch[1] : '',
  };
}
