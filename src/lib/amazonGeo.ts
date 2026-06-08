/**
 * Geo-aware Amazon affiliate URL builder.
 *
 * Problem: 50%+ of traffic is from Singapore, Hong Kong, India, UK, etc.
 * Sending them all to amazon.com gives poor UX and near-zero conversion.
 *
 * Solution:
 *   1. Server: use Cloudflare's CF-IPCountry header to build localized links
 *   2. Client: intercept amazon.com clicks and rewrite to local store
 *   3. OneLink: load Amazon's official OneLink script if configured
 */

export interface AmazonStoreConfig {
  domain: string;
  tag: string;
  name: string;
}

const DEFAULT_TAG = process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG?.trim() || 'aiautorepair-20';

// Fallback tags per marketplace. User should replace these with their own.
export const AMAZON_STORES: Record<string, AmazonStoreConfig> = {
  US: { domain: 'amazon.com', tag: DEFAULT_TAG, name: 'United States' },
  GB: { domain: 'amazon.co.uk', tag: process.env.NEXT_PUBLIC_AMAZON_TAG_UK?.trim() || DEFAULT_TAG, name: 'United Kingdom' },
  CA: { domain: 'amazon.ca', tag: process.env.NEXT_PUBLIC_AMAZON_TAG_CA?.trim() || DEFAULT_TAG, name: 'Canada' },
  DE: { domain: 'amazon.de', tag: process.env.NEXT_PUBLIC_AMAZON_TAG_DE?.trim() || DEFAULT_TAG, name: 'Germany' },
  FR: { domain: 'amazon.fr', tag: process.env.NEXT_PUBLIC_AMAZON_TAG_FR?.trim() || DEFAULT_TAG, name: 'France' },
  IT: { domain: 'amazon.it', tag: process.env.NEXT_PUBLIC_AMAZON_TAG_IT?.trim() || DEFAULT_TAG, name: 'Italy' },
  ES: { domain: 'amazon.es', tag: process.env.NEXT_PUBLIC_AMAZON_TAG_ES?.trim() || DEFAULT_TAG, name: 'Spain' },
  JP: { domain: 'amazon.co.jp', tag: process.env.NEXT_PUBLIC_AMAZON_TAG_JP?.trim() || DEFAULT_TAG, name: 'Japan' },
  AU: { domain: 'amazon.com.au', tag: process.env.NEXT_PUBLIC_AMAZON_TAG_AU?.trim() || DEFAULT_TAG, name: 'Australia' },
  IN: { domain: 'amazon.in', tag: process.env.NEXT_PUBLIC_AMAZON_TAG_IN?.trim() || DEFAULT_TAG, name: 'India' },
  SG: { domain: 'amazon.sg', tag: process.env.NEXT_PUBLIC_AMAZON_TAG_SG?.trim() || DEFAULT_TAG, name: 'Singapore' },
  BR: { domain: 'amazon.com.br', tag: process.env.NEXT_PUBLIC_AMAZON_TAG_BR?.trim() || DEFAULT_TAG, name: 'Brazil' },
  MX: { domain: 'amazon.com.mx', tag: process.env.NEXT_PUBLIC_AMAZON_TAG_MX?.trim() || DEFAULT_TAG, name: 'Mexico' },
  NL: { domain: 'amazon.nl', tag: process.env.NEXT_PUBLIC_AMAZON_TAG_NL?.trim() || DEFAULT_TAG, name: 'Netherlands' },
  SE: { domain: 'amazon.se', tag: process.env.NEXT_PUBLIC_AMAZON_TAG_SE?.trim() || DEFAULT_TAG, name: 'Sweden' },
  PL: { domain: 'amazon.pl', tag: process.env.NEXT_PUBLIC_AMAZON_TAG_PL?.trim() || DEFAULT_TAG, name: 'Poland' },
  BE: { domain: 'amazon.com.be', tag: process.env.NEXT_PUBLIC_AMAZON_TAG_BE?.trim() || DEFAULT_TAG, name: 'Belgium' },
};

// Country → marketplace mapping for countries without their own Amazon store
export const COUNTRY_TO_STORE: Record<string, string> = {
  // Americas
  US: 'US', CA: 'CA', MX: 'MX', BR: 'BR',
  // UK / Ireland
  GB: 'GB', UK: 'GB', IE: 'GB',
  // Western Europe
  DE: 'DE', FR: 'FR', IT: 'IT', ES: 'ES', NL: 'NL', BE: 'BE', AT: 'DE', CH: 'DE', LU: 'FR',
  // Nordics
  SE: 'SE', NO: 'SE', DK: 'DE', FI: 'SE', IS: 'DE',
  // Eastern Europe
  PL: 'PL', CZ: 'DE', SK: 'DE', HU: 'DE', SI: 'IT', HR: 'IT', RS: 'DE', BG: 'DE', RO: 'DE',
  // Asia-Pacific
  JP: 'JP', AU: 'AU', NZ: 'AU', SG: 'SG', MY: 'SG', ID: 'SG', PH: 'SG', TH: 'SG', VN: 'SG',
  HK: 'SG', TW: 'JP', KR: 'JP', CN: 'JP',
  // South Asia
  IN: 'IN', PK: 'IN', BD: 'IN', LK: 'IN', NP: 'IN',
  // Middle East / Africa → UK or US fallback
  ZA: 'US', AE: 'US', SA: 'US', IL: 'US', TR: 'DE', EG: 'US', NG: 'US', KE: 'US',
};

/**
 * Resolve the best Amazon marketplace for a 2-letter country code.
 */
export function resolveAmazonStore(countryCode?: string | null): AmazonStoreConfig {
  if (!countryCode) return AMAZON_STORES.US;
  const upper = countryCode.toUpperCase().trim();
  const storeCode = COUNTRY_TO_STORE[upper] || 'US';
  return AMAZON_STORES[storeCode] || AMAZON_STORES.US;
}

/**
 * Rewrite an amazon.com affiliate URL to the user's local Amazon store.
 * Preserves query parameters, search term, and subtags.
 */
export function localizeAmazonUrl(url: string, countryCode?: string | null): string {
  if (!url) return url;
  if (!url.includes('amazon.com')) return url;

  const store = resolveAmazonStore(countryCode);
  if (store.domain === 'amazon.com') return url;

  try {
    const parsed = new URL(url);
    parsed.hostname = store.domain;
    parsed.searchParams.set('tag', store.tag);
    // Some stores don't support all departments; remove i=automotive if it causes issues
    return parsed.toString();
  } catch {
    return url.replace('amazon.com', store.domain).replace(/[?&]tag=[^&]+/, `&tag=${store.tag}`);
  }
}

/**
 * Build a geo-aware Amazon search URL.
 * On the server, pass the country from CF-IPCountry header.
 * On the client, the geo-redirect script will rewrite if needed.
 */
export function buildGeoAmazonSearchUrl(
  query: string,
  department = 'automotive',
  subtag?: string,
  countryCode?: string | null
): string {
  const store = resolveAmazonStore(countryCode);
  const params = new URLSearchParams({ k: query });
  params.set('tag', store.tag);
  if (department) params.set('i', department);
  if (subtag) params.set('ascsubtag', subtag);
  return `https://www.${store.domain}/s?${params.toString()}`;
}
