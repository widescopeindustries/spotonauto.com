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
