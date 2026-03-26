/**
 * Topdon affiliate link builder and curated product catalog.
 *
 * Products are selected to match diagnostic flow context:
 * - Code readers for users reading/clearing DTCs
 * - Advanced scanners for users doing ABS/SRS/transmission diagnostics
 * - Battery testers for charging system diagnosis
 */

export const TOPDON_REF_CODE = 'nhsqdwuq';

const TOPDON_BASE = 'https://www.topdon.us';

export interface TopdonProduct {
  slug: string;
  name: string;
  shortName: string;
  price: number;
  description: string;
  /** Which diagnostic contexts trigger this recommendation */
  contexts: string[];
}

/**
 * Curated Topdon products, tiered by use case.
 */
export const TOPDON_PRODUCTS = {
  // Tier 1: Entry-level code readers ($30-$50)
  artilink300: {
    slug: 'al300',
    name: 'TOPDON ArtiLink300',
    shortName: 'ArtiLink300',
    price: 34,
    description: 'Read & clear codes, freeze frame data, O2 sensor test',
    contexts: ['obd2', 'code-reader', 'check-engine', 'emissions'],
  },
  topscan: {
    slug: 'topscan',
    name: 'TOPDON TopScan',
    shortName: 'TopScan',
    price: 51.27,
    description: 'Bluetooth OBD2 scanner with bi-directional controls, 120+ makes',
    contexts: ['obd2', 'code-reader', 'bluetooth', 'bi-directional', 'check-engine'],
  },

  // Tier 2: Mid-range ($75-$99)
  artilink500b: {
    slug: 'artilink500b',
    name: 'TOPDON ArtiLink500B',
    shortName: 'ArtiLink500B',
    price: 75.99,
    description: 'Code reader + battery tester combo with data graphing',
    contexts: ['obd2', 'code-reader', 'battery', 'charging', 'check-engine'],
  },
  artilink600: {
    slug: 'al600-obd2-diagnostic-scan-tool',
    name: 'TOPDON ArtiLink600',
    shortName: 'ArtiLink600',
    price: 99,
    description: 'ABS & SRS active testing, live data, lifetime free updates',
    contexts: ['abs', 'srs', 'airbag', 'traction', 'advanced-diagnostics'],
  },

  // Tier 3: Prosumer ($299-$400)
  artidiag900lite: {
    slug: 'artidiag900-lite',
    name: 'TOPDON ArtiDiag900 Lite',
    shortName: 'ArtiDiag900 Lite',
    price: 299.24,
    description: 'Full-system diagnostics for all vehicle modules',
    contexts: ['full-system', 'transmission', 'advanced-diagnostics', 'professional'],
  },
  artidiagpro: {
    slug: 'artidiag-pro',
    name: 'TOPDON ArtiDiag Pro',
    shortName: 'ArtiDiag Pro',
    price: 399.99,
    description: 'Prosumer diagnostic scanner — all systems, all makes',
    contexts: ['full-system', 'professional', 'advanced-diagnostics', 'bi-directional'],
  },

  // Battery testers
  bt50: {
    slug: 'bt50',
    name: 'TOPDON BT50',
    shortName: 'BT50',
    price: 32.99,
    description: 'Battery, cranking & charging system tester',
    contexts: ['battery', 'charging', 'cranking', 'starting'],
  },
  bt200: {
    slug: 'bt200',
    name: 'TOPDON BT200',
    shortName: 'BT200',
    price: 69.59,
    description: '12V/24V battery tester with charging system diagnosis',
    contexts: ['battery', 'charging', 'cranking', 'starting', 'alternator'],
  },
} as const satisfies Record<string, TopdonProduct>;

/**
 * Build a Topdon affiliate product URL.
 */
export function buildTopdonProductUrl(productSlug: string): string {
  return `${TOPDON_BASE}/products/${productSlug}?ref=${TOPDON_REF_CODE}`;
}

/**
 * Build a Topdon affiliate storefront URL.
 */
export function buildTopdonStoreUrl(): string {
  return `${TOPDON_BASE}/?ref=${TOPDON_REF_CODE}`;
}

/**
 * Pick the best Topdon product(s) for a given diagnostic context.
 * Returns 1-2 products sorted by relevance.
 */
export function getTopdonRecommendations(
  context: 'code-reader' | 'advanced' | 'battery' | 'general',
): TopdonProduct[] {
  switch (context) {
    case 'code-reader':
      return [TOPDON_PRODUCTS.topscan, TOPDON_PRODUCTS.artilink600];
    case 'advanced':
      return [TOPDON_PRODUCTS.artilink600, TOPDON_PRODUCTS.artidiag900lite];
    case 'battery':
      return [TOPDON_PRODUCTS.bt50, TOPDON_PRODUCTS.artilink500b];
    case 'general':
    default:
      return [TOPDON_PRODUCTS.topscan, TOPDON_PRODUCTS.artilink300];
  }
}

/**
 * Determine diagnostic context from a DTC code prefix.
 */
export function getContextFromCode(code: string): 'code-reader' | 'advanced' | 'battery' | 'general' {
  const upper = code.toUpperCase();
  // B-codes = body (often ABS/SRS), C-codes = chassis, U-codes = network
  if (upper.startsWith('B') || upper.startsWith('C') || upper.startsWith('U')) {
    return 'advanced';
  }
  // P-codes related to charging/battery
  if (/^P(0562|0563|0620|0621|0622|0560|0561|1549)/.test(upper)) {
    return 'battery';
  }
  return 'code-reader';
}
