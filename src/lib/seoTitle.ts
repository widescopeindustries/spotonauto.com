// Bing Webmaster Tools flags titles longer than ~65 characters.
// Build titles that keep the brand suffix when they fit, fall back to
// progressively shorter candidates, and hard-cap at a word boundary.

const MAX_TITLE_LENGTH = 58;
const DEFAULT_BRAND_SUFFIX = ' | AllOEMManuals';

/**
 * Pick the first candidate that fits within Bing's ~65-char guideline.
 * Candidates are tried most-specific first: with the brand suffix, then
 * without it. If nothing fits, the last (shortest) candidate is hard-capped
 * at a word boundary.
 */
export function fitSeoTitle(brandSuffix: string, ...candidates: string[]): string {
  for (const candidate of candidates) {
    const branded = `${candidate}${brandSuffix}`;
    if (branded.length <= MAX_TITLE_LENGTH) return branded;
    if (candidate.length <= MAX_TITLE_LENGTH) return candidate;
  }
  const base = candidates[candidates.length - 1];
  const cut = base.slice(0, MAX_TITLE_LENGTH);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).replace(/[\s—–&|:,-]+$/, '');
}

/** Same as fitSeoTitle with the default " | AllOEMManuals" brand suffix. */
export function seoTitle(...candidates: string[]): string {
  return fitSeoTitle(DEFAULT_BRAND_SUFFIX, ...candidates);
}

const TITLE_TOKEN: Record<string, string> = {
  egr: 'EGR',
  cv: 'CV',
  abs: 'ABS',
  pcm: 'PCM',
  o2: 'O2',
  maf: 'MAF',
  map: 'MAP',
  pcv: 'PCV',
  vvt: 'VVT',
  dpf: 'DPF',
  def: 'DEF',
  obd: 'OBD',
  hvac: 'HVAC',
};

/**
 * "how to replace the egr valve" style line for a replacement guide.
 * Returns null when the line would be cut off by the title cap, so the
 * caller can keep the shorter vehicle-first title.
 */
export function howToReplaceLine(vehicle: string, cleanTask: string): string | null {
  if (!cleanTask.endsWith(' replacement')) return null;
  const noun = cleanTask.slice(0, -' replacement'.length).trim();
  if (!noun) return null;
  const titled = noun.split(/\s+/).map((word) => {
    return TITLE_TOKEN[word] || word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
  const line = `How to Replace the ${titled} on a ${vehicle}`;
  return line.length <= MAX_TITLE_LENGTH ? line : null;
}

/** Put the search phrase first, then as much of the existing description as fits. */
export function leadDescription(lead: string, rest: string, max = 165): string {
  const combined = `${lead}. ${rest}`.replace(/\s+/g, ' ').trim();
  if (combined.length <= max) return combined;
  const room = max - lead.length - 2;
  if (room < 40) return lead;
  const cut = rest.slice(0, room);
  const lastSpace = cut.lastIndexOf(' ');
  const kept = (lastSpace > 40 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:—-]+$/, '');
  return `${lead}. ${kept}`;
}
