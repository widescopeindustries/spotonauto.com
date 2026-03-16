const DEFAULT_AMAZON_AFFILIATE_TAG = 'aiautorepai04-20';

export const AMAZON_AFFILIATE_TAG =
  process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG?.trim() || DEFAULT_AMAZON_AFFILIATE_TAG;

const AMAZON_QUERY_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bsee repair guide for specific parts\b/gi, 'parts'],
  [/\bpart number varies by engine type\b/gi, ''],
  [/\bcheck your vin\b/gi, ''],
  [/\binspect\/replace if worn\b/gi, ''],
  [/\((?:inspect|recommended|vehicle specific)\)/gi, ''],
];

export function normalizeAmazonSearchQuery(query: string): string {
  const original = query.trim().replace(/\s+/g, ' ');
  if (!original) return '';

  let cleaned = original;

  for (const [pattern, replacement] of AMAZON_QUERY_REPLACEMENTS) {
    cleaned = cleaned.replace(pattern, replacement);
  }

  cleaned = cleaned
    .replace(/[()]/g, ' ')
    .replace(/\s*[-,:;]+\s*/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return cleaned || original;
}

export function buildAmazonSearchUrl(query: string, department = 'automotive'): string {
  const normalizedQuery = normalizeAmazonSearchQuery(query);
  const params = new URLSearchParams({
    k: normalizedQuery,
    tag: AMAZON_AFFILIATE_TAG,
  });

  if (department) {
    params.set('i', department);
  }

  return `https://www.amazon.com/s?${params.toString()}`;
}
