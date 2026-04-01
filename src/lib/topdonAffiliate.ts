/**
 * Topdon affiliate link builder and curated product catalog.
 *
 * Products are selected to match diagnostic flow context:
 * - Code readers for users reading/clearing DTCs
 * - Advanced scanners for users doing ABS/SRS/transmission diagnostics
 * - Battery testers for charging system diagnosis
 */

export const TOPDON_REF_CODE = 'spoton';

const TOPDON_BASE = 'https://www.topdon.us';
const TOPDON_CDN = 'https://www.topdon.us/cdn/shop';
const TOPDON_LOGO = 'https://creatives.goaffpro.com/7017989/njaulnqy-topdon-logo-black.png';

export { TOPDON_LOGO };

export interface TopdonProduct {
  slug: string;
  name: string;
  shortName: string;
  price: number;
  description: string;
  image: string;
  /** Which diagnostic contexts trigger this recommendation */
  contexts: string[];
  /** Key features for comparison cards */
  features: string[];
  /** Who this product is best for */
  bestFor: string;
  /** Product tier for filtering */
  tier: 'entry' | 'mid' | 'pro' | 'battery';
}

/**
 * Curated Topdon products, tiered by use case.
 */
export const TOPDON_PRODUCTS = {
  // ── Tier 1: Entry-level code readers ($30-$55) ──────────────────────
  artilink300: {
    slug: 'al300',
    name: 'TOPDON ArtiLink300',
    shortName: 'ArtiLink300',
    price: 34,
    description: 'Read & clear codes, freeze frame data, O2 sensor test',
    image: `${TOPDON_CDN}/products/DiagnosticToolsArtiLink300.jpg?v=1643180479`,
    contexts: ['obd2', 'code-reader', 'check-engine', 'emissions'],
    features: ['Read & clear DTCs', 'Freeze frame data', 'O2 sensor test', 'I/M readiness'],
    bestFor: 'First-time DIYers on a budget',
    tier: 'entry' as const,
  },
  topscan: {
    slug: 'topscan',
    name: 'TOPDON TopScan',
    shortName: 'TopScan',
    price: 51.27,
    description: 'Bluetooth OBD2 scanner with bi-directional controls, 120+ makes',
    image: `${TOPDON_CDN}/files/TopScan.jpg?v=1691441731`,
    contexts: ['obd2', 'code-reader', 'bluetooth', 'bi-directional', 'check-engine'],
    features: ['Bluetooth — use with your phone', 'Bi-directional controls', '120+ vehicle makes', 'Live data streaming'],
    bestFor: 'DIYers who want phone-based scanning',
    tier: 'entry' as const,
  },

  // ── Tier 2: Mid-range ($75-$230) ────────────────────────────────────
  artilink500b: {
    slug: 'artilink500b',
    name: 'TOPDON ArtiLink500B',
    shortName: 'ArtiLink500B',
    price: 75.99,
    description: 'Code reader + battery tester combo with data graphing',
    image: `${TOPDON_CDN}/files/ArtiLink500B-V2.jpg?v=1687327250`,
    contexts: ['obd2', 'code-reader', 'battery', 'charging', 'check-engine'],
    features: ['OBD2 codes + battery tester', 'Data graphing', 'Smog check readiness', 'All-in-one combo'],
    bestFor: 'DIYers who also want battery testing',
    tier: 'mid' as const,
  },
  artilink600: {
    slug: 'al600-obd2-diagnostic-scan-tool',
    name: 'TOPDON ArtiLink600',
    shortName: 'ArtiLink600',
    price: 99,
    description: 'ABS & SRS active testing, live data, lifetime free updates',
    image: `${TOPDON_CDN}/products/DiagnosticToolsArtiLink600.jpg?v=1643181599`,
    contexts: ['abs', 'srs', 'airbag', 'traction', 'advanced-diagnostics'],
    features: ['ABS & SRS diagnostics', 'Active testing', 'Live data stream', 'Lifetime free updates'],
    bestFor: 'DIYers working on ABS/airbag systems',
    tier: 'mid' as const,
  },
  artidiag500: {
    slug: 'artidiag500',
    name: 'TOPDON ArtiDiag500',
    shortName: 'ArtiDiag500',
    price: 149.98,
    description: '5" touchscreen with PCM/TCM/ABS/SRS diagnostics & 6 reset functions',
    image: `${TOPDON_CDN}/files/ArtiDiag500New.jpg?v=1715568233`,
    contexts: ['full-system', 'transmission', 'abs', 'srs', 'advanced-diagnostics'],
    features: ['4-system diagnostics', '5" touchscreen', '6 reset functions', 'Auto VIN recognition'],
    bestFor: 'Intermediate DIYers stepping up from basic readers',
    tier: 'mid' as const,
  },
  artidiag600s: {
    slug: 'artidiag600-s',
    name: 'TOPDON ArtiDiag600S',
    shortName: 'ArtiDiag600S',
    price: 229.99,
    description: 'CAN-FD compatible 4-system scanner for 80+ brands worldwide',
    image: `${TOPDON_CDN}/files/AD600_S-10.jpg?v=1736886196`,
    contexts: ['full-system', 'transmission', 'abs', 'srs', 'advanced-diagnostics', 'can-fd'],
    features: ['CAN-FD protocol support', '4-system diagnostics', '80+ vehicle brands', 'Lifetime free updates'],
    bestFor: 'DIYers with newer CAN-FD vehicles (2020+)',
    tier: 'mid' as const,
  },

  // ── Tier 3: Prosumer ($299-$700) ────────────────────────────────────
  artidiag900lite: {
    slug: 'artidiag900-lite',
    name: 'TOPDON ArtiDiag900 Lite',
    shortName: 'ArtiDiag900 Lite',
    price: 299.24,
    description: 'Full-system diagnostics for all vehicle modules',
    image: `${TOPDON_CDN}/files/ArtiDiag900Lite-3.jpg?v=1744401091`,
    contexts: ['full-system', 'transmission', 'advanced-diagnostics', 'professional'],
    features: ['Full-system diagnostics', 'All vehicle modules', 'Bi-directional controls', 'ECU coding'],
    bestFor: 'Serious DIYers and side-hustle mechanics',
    tier: 'pro' as const,
  },
  artidiag800bt: {
    slug: 'artidiag800bt-2',
    name: 'TOPDON ArtiDiag800BT',
    shortName: 'ArtiDiag800BT',
    price: 379,
    description: 'Bluetooth full-system scanner with CAN-FD & 28 service functions',
    image: `${TOPDON_CDN}/files/ArtiDiag800BT2-4.jpg?v=1744400672`,
    contexts: ['full-system', 'professional', 'advanced-diagnostics', 'bi-directional', 'can-fd'],
    features: ['Bluetooth wireless', 'CAN-FD + FCA Gateway', '28 service functions', '2 years free updates'],
    bestFor: 'Advanced DIYers who want wireless convenience',
    tier: 'pro' as const,
  },
  artidiagpro: {
    slug: 'artidiag-pro',
    name: 'TOPDON ArtiDiag Pro',
    shortName: 'ArtiDiag Pro',
    price: 399.99,
    description: 'Prosumer diagnostic scanner — all systems, all makes',
    image: `${TOPDON_CDN}/files/ADPRO-1_a98d1ec8-9c3b-4c35-8267-2009fcfefe07.jpg?v=1691415564`,
    contexts: ['full-system', 'professional', 'advanced-diagnostics', 'bi-directional'],
    features: ['All systems, all makes', 'Bi-directional controls', 'ECU coding & matching', 'DPF / oil / EPB resets'],
    bestFor: 'Home mechanics working on multiple vehicles',
    tier: 'pro' as const,
  },
  ultradiag: {
    slug: 'ultradiag',
    name: 'TOPDON UltraDiag',
    shortName: 'UltraDiag',
    price: 699,
    description: '8" tablet scanner with key programming & full-system diagnostics',
    image: `${TOPDON_CDN}/files/TD52110242_1_1.jpg?v=1734709802`,
    contexts: ['full-system', 'professional', 'key-programming', 'advanced-diagnostics'],
    features: ['8" touchscreen tablet', 'Key programming', '100+ vehicle brands', 'Full-system + all resets'],
    bestFor: 'Semi-pro and shop-level diagnostics',
    tier: 'pro' as const,
  },

  // ── Battery testers ─────────────────────────────────────────────────
  bt50: {
    slug: 'bt50',
    name: 'TOPDON BT50',
    shortName: 'BT50',
    price: 32.99,
    description: 'Battery, cranking & charging system tester',
    image: `${TOPDON_CDN}/products/BT50-1.jpg?v=1659692739`,
    contexts: ['battery', 'charging', 'cranking', 'starting'],
    features: ['Battery health test', 'Cranking test', 'Charging system test', '100-2000 CCA range'],
    bestFor: 'Quick battery checks before winter or road trips',
    tier: 'battery' as const,
  },
  bt100: {
    slug: 'bt-100',
    name: 'TOPDON BT100',
    shortName: 'BT100',
    price: 47.19,
    description: '12V battery & system tester with backlit LCD',
    image: `${TOPDON_CDN}/products/BT100.jpg?v=1647974976`,
    contexts: ['battery', 'charging', 'cranking', 'starting'],
    features: ['2" backlit LCD display', 'All lead-acid types', '100-2000 CCA range', 'Cranking + charging test'],
    bestFor: 'DIYers who want a better display than the BT50',
    tier: 'battery' as const,
  },
  bt200: {
    slug: 'bt200',
    name: 'TOPDON BT200',
    shortName: 'BT200',
    price: 69.59,
    description: '12V/24V battery tester with charging system diagnosis',
    image: `${TOPDON_CDN}/products/BT200_58d41e1a-f7ec-40aa-a71e-131403757763.jpg?v=1643164850`,
    contexts: ['battery', 'charging', 'cranking', 'starting', 'alternator'],
    features: ['12V AND 24V support', 'Alternator ripple test', '99.5% accuracy', 'Heavy-duty vehicles'],
    bestFor: 'Anyone with trucks, diesel, or 24V equipment',
    tier: 'battery' as const,
  },
  bt600: {
    slug: 'bt600',
    name: 'TOPDON BT600',
    shortName: 'BT600',
    price: 145,
    description: '12V/24V battery & system tester with built-in thermal printer',
    image: `${TOPDON_CDN}/files/BT600-_1.jpg?v=1691416845`,
    contexts: ['battery', 'charging', 'cranking', 'starting', 'alternator', 'professional'],
    features: ['Built-in thermal printer', '12V AND 24V support', '3.5" color display', 'Print reports on the spot'],
    bestFor: 'Mobile mechanics and shops that need printed reports',
    tier: 'battery' as const,
  },
} as const satisfies Record<string, TopdonProduct>;

/** All scanner products (non-battery) for comparison pages */
export const TOPDON_SCANNERS = Object.values(TOPDON_PRODUCTS).filter(
  (p) => p.tier !== 'battery',
);

/** All battery testers for comparison pages */
export const TOPDON_BATTERY_TESTERS = Object.values(TOPDON_PRODUCTS).filter(
  (p) => p.tier === 'battery',
);

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
