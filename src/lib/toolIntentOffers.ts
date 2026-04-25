import type { ToolGeneration, ToolPage } from '@/data/tools-pages';

export interface ToolIntentOffer {
  id: string;
  title: string;
  description: string;
  reason: string;
  query: string;
}

export interface ToolSpecHighlight {
  label: string;
  value: string;
}

interface ToolIntentOfferOverride {
  primaryTitle: string;
  primaryDescription: string;
  primaryReason: string;
  primaryQuery: string;
  secondaryQuery?: string;
  tertiaryQuery?: string;
}

const VISCOSITY_RE = /\b\d{1,2}W-\d{2}\b/i;
const OIL_CAPACITY_RE = /\b\d(?:\.\d)?\s*quarts?\b/i;
const GAP_RE = /0\.\d{3}"?\s*-\s*0\.\d{3}"?/i;

const TOP_PAGE_OFFER_OVERRIDES: Record<string, ToolIntentOfferOverride> = {
  'ford-edge-oil-type': {
    primaryTitle: 'Edge oil-change one-trip bundle',
    primaryDescription: 'Pick the correct oil, filter, and small service parts in one order.',
    primaryReason: 'Oil-type queries usually mean the user is about to buy the whole service kit.',
    primaryQuery: 'Ford Edge oil change kit',
    secondaryQuery: 'Ford Edge oil filter',
    tertiaryQuery: 'Ford Edge drain plug gasket',
  },
  'ford-focus-oil-type': {
    primaryTitle: 'Focus oil-change starter kit',
    primaryDescription: 'Bundle the correct oil, filter, and cleanup gear for a single service pass.',
    primaryReason: 'Focus oil queries often convert when the full kit is visible at once.',
    primaryQuery: 'Ford Focus oil change kit',
    secondaryQuery: 'Ford Focus oil filter',
    tertiaryQuery: 'Ford Focus funnel and drain pan',
  },
  'kia-telluride-oil-type': {
    primaryTitle: 'Telluride oil service bundle',
    primaryDescription: 'Order the oil, filter, and drain hardware for the Telluride in one shot.',
    primaryReason: 'Three-row SUV owners tend to prefer a complete shopping list before they start.',
    primaryQuery: 'Kia Telluride oil change kit',
    secondaryQuery: 'Kia Telluride oil filter',
    tertiaryQuery: 'Kia Telluride drain plug washer',
  },
  'ford-transit-serpentine-belt': {
    primaryTitle: 'Transit serpentine belt + tensioner bundle',
    primaryDescription: 'Focus on belt kits that include tensioner hardware for van-duty cycles.',
    primaryReason: 'Transit fleets see long idle and accessory load, so tensioners wear with belts.',
    primaryQuery: 'Ford Transit serpentine belt tensioner kit',
    secondaryQuery: 'Ford Transit belt routing diagram sticker',
    tertiaryQuery: 'Ford Transit serpentine belt tool',
  },
  'gmc-acadia-fluid-capacity': {
    primaryTitle: 'Acadia fluid service bundle',
    primaryDescription: 'Build a cart with coolant, ATF, and brake fluid that matches Acadia specs.',
    primaryReason: 'Bundled service fluids improve conversion for users planning full maintenance weekends.',
    primaryQuery: 'GMC Acadia fluid service kit coolant transmission brake',
  },
  'cadillac-xt5-transmission-fluid-type': {
    primaryTitle: 'XT5 9-speed transmission fluid set',
    primaryDescription: 'Shop ATF options intended for the XT5 9-speed platform.',
    primaryReason: 'Transmission fluid mismatch is a high-risk error, so this query is spec-locked.',
    primaryQuery: 'Cadillac XT5 9 speed transmission fluid',
    secondaryQuery: 'Cadillac XT5 transmission fill adapter tool',
  },
  'kia-sportage-serpentine-belt': {
    primaryTitle: 'Sportage belt and pulley refresh kit',
    primaryDescription: 'Replace belt plus idler/tensioner parts in one service.',
    primaryReason: 'Belt noise often returns when worn pulleys are reused.',
    primaryQuery: 'Kia Sportage serpentine belt idler tensioner kit',
  },
  'chevrolet-equinox-fluid-capacity': {
    primaryTitle: 'Equinox multi-fluid maintenance cart',
    primaryDescription: 'Shop oil, coolant, and transmission fluid for Equinox service together.',
    primaryReason: 'Users searching fluid capacity often plan more than one fluid job at once.',
    primaryQuery: 'Chevrolet Equinox oil coolant transmission fluid bundle',
  },
  'ford-ranger-coolant-type': {
    primaryTitle: 'Ranger coolant that matches chemistry',
    primaryDescription: 'Find coolant by exact Ranger spec before top-off or flush.',
    primaryReason: 'Coolant chemistry mismatch can cause sludge and overheating.',
    primaryQuery: 'Ford Ranger coolant type Motorcraft yellow',
    secondaryQuery: 'Ford Ranger coolant flush kit',
  },
  'mitsubishi-outlander-serpentine-belt': {
    primaryTitle: 'Outlander serpentine belt fitment set',
    primaryDescription: 'Match belt and accessory drive parts for Outlander trims.',
    primaryReason: 'Engine-variant routing changes make fitment-specific search critical.',
    primaryQuery: 'Mitsubishi Outlander serpentine belt kit',
  },
  'acura-rdx-spark-plug-type': {
    primaryTitle: 'RDX iridium spark plug set',
    primaryDescription: 'Shop Acura RDX spark plug sets with OEM heat range equivalents.',
    primaryReason: 'This query usually indicates intent to buy all required plugs immediately.',
    primaryQuery: 'Acura RDX iridium spark plugs OEM',
  },
  'jeep-compass-fluid-capacity': {
    primaryTitle: 'Compass fluid service essentials',
    primaryDescription: 'Gather transmission, coolant, and brake fluids for Compass maintenance.',
    primaryReason: 'Fluid-capacity traffic converts when users can buy every needed fluid in one flow.',
    primaryQuery: 'Jeep Compass fluid service kit',
  },
  'honda-cr-v-spark-plug-type': {
    primaryTitle: 'CR-V spark plug replacement set',
    primaryDescription: 'Find complete iridium plug sets for CR-V model years and engines.',
    primaryReason: 'CR-V plug jobs are high-intent and frequently bundled with socket/tool purchases.',
    primaryQuery: 'Honda CR-V iridium spark plug set',
  },
  'ford-mustang-coolant-type': {
    primaryTitle: 'Mustang coolant and flush picks',
    primaryDescription: 'Shop coolant options for Mustang cooling-system service.',
    primaryReason: 'Performance users are sensitive to cooling reliability and buy quality fluid fast.',
    primaryQuery: 'Ford Mustang coolant type',
  },
  'toyota-tundra-fluid-capacity': {
    primaryTitle: 'Tundra heavy-duty fluid service kit',
    primaryDescription: 'Pull together high-capacity oil and drivetrain fluids for Tundra service.',
    primaryReason: 'Truck users have larger fluid volumes and tend to buy complete kits.',
    primaryQuery: 'Toyota Tundra oil transmission coolant fluid kit',
  },
  'nissan-rogue-serpentine-belt': {
    primaryTitle: 'Rogue belt + tensioner service package',
    primaryDescription: 'Find belt and tensioner parts tuned to Rogue engine variants.',
    primaryReason: 'Accessory drive noise is often a two-part fix, not belt-only.',
    primaryQuery: 'Nissan Rogue serpentine belt tensioner kit',
  },
  'honda-accord-spark-plug-type': {
    primaryTitle: 'Accord spark plug fitment set',
    primaryDescription: 'Match Accord spark plug type by engine and generation.',
    primaryReason: 'Accord plug queries consistently indicate replacement purchase intent.',
    primaryQuery: 'Honda Accord iridium spark plugs set',
  },
  'ford-ranger-fluid-capacity': {
    primaryTitle: 'Ranger complete fluid change bundle',
    primaryDescription: 'Shop oil, coolant, and transmission fluid in one Ranger-focused cart.',
    primaryReason: 'Ranger maintenance shoppers usually buy multiple fluids per session.',
    primaryQuery: 'Ford Ranger full fluid service kit',
  },
  'chevrolet-camaro-fluid-capacity': {
    primaryTitle: 'Camaro fluid package by drivetrain',
    primaryDescription: 'Pick fluids for Camaro oil, cooling, and transmission maintenance.',
    primaryReason: 'Performance trims create strong demand for spec-accurate fluid bundles.',
    primaryQuery: 'Chevrolet Camaro fluid service kit',
  },
  'honda-civic-spark-plug-type': {
    primaryTitle: 'Civic spark plug kit and tools',
    primaryDescription: 'Shop Civic plug sets plus sockets and torque tools.',
    primaryReason: 'Civic DIY traffic often converts on both plugs and basic service tools.',
    primaryQuery: 'Honda Civic iridium spark plug kit',
  },
  'kia-forte-oil-type': {
    primaryTitle: 'Forte oil change starter bundle',
    primaryDescription: 'Buy correct-viscosity oil, filter, and gasket for one-pass service.',
    primaryReason: 'Oil-type searchers convert fastest when the full oil-change kit is one click away.',
    primaryQuery: 'Kia Forte oil change kit',
  },
  'toyota-yaris-serpentine-belt': {
    primaryTitle: 'Yaris serpentine belt fitment',
    primaryDescription: 'Find compact-engine belt options and install tools.',
    primaryReason: 'Yaris buyers want low-cost exact-fit parts, so query precision helps conversion.',
    primaryQuery: 'Toyota Yaris serpentine belt',
  },
  'toyota-sienna-tire-size': {
    primaryTitle: 'Sienna tire size and replacement set',
    primaryDescription: 'Use the exact tire size, pressure, and pressure tools for the Sienna.',
    primaryReason: 'Minivan shoppers often want a fast cart-building path after they confirm fitment.',
    primaryQuery: 'Toyota Sienna tire size',
    secondaryQuery: 'Toyota Sienna tire pressure gauge',
  },
  'mercedes-glc-battery-location': {
    primaryTitle: 'GLC battery access and replacement kit',
    primaryDescription: 'Buy the battery, terminal cleaner, and registration support tools together.',
    primaryReason: 'Luxury battery jobs are easier to complete when the replacement path is fully mapped out.',
    primaryQuery: 'Mercedes GLC battery location',
    secondaryQuery: 'Mercedes GLC battery replacement',
    tertiaryQuery: 'Mercedes GLC battery registration tool',
  },
};

function getPrimaryGeneration(page: ToolPage): ToolGeneration | undefined {
  return page.generations[0];
}

function getSpecEntries(page: ToolPage): Array<[string, string]> {
  const primary = getPrimaryGeneration(page);
  if (!primary) return [];
  return Object.entries(primary.specs);
}

function findSpecValue(page: ToolPage, keyFragments: string[]): string | undefined {
  const lowerFragments = keyFragments.map((fragment) => fragment.toLowerCase());
  const entries = getSpecEntries(page);
  const match = entries.find(([key]) => {
    const normalized = key.toLowerCase();
    return lowerFragments.some((fragment) => normalized.includes(fragment));
  });
  return match?.[1];
}

function firstRegexMatch(values: string[], pattern: RegExp): string | undefined {
  for (const value of values) {
    const match = value.match(pattern);
    if (match?.[0]) return match[0];
  }
  return undefined;
}

function extractOilWeight(page: ToolPage): string | undefined {
  const values = [
    page.quickAnswer,
    ...getSpecEntries(page).map(([, value]) => value),
  ];
  return firstRegexMatch(values, VISCOSITY_RE);
}

function extractOilCapacity(page: ToolPage): string | undefined {
  const values = getSpecEntries(page).map(([, value]) => value);
  return firstRegexMatch(values, OIL_CAPACITY_RE);
}

function extractSparkGap(page: ToolPage): string | undefined {
  const values = [
    page.quickAnswer,
    ...getSpecEntries(page).map(([, value]) => value),
  ];
  return firstRegexMatch(values, GAP_RE);
}

function toolSpecificHighlights(page: ToolPage): ToolSpecHighlight[] {
  const entries = getSpecEntries(page);
  if (!entries.length) return [];

  const keyPriority: Record<ToolPage['toolType'], string[]> = {
    'oil-type': ['Recommended Oil', 'Oil Type', 'Capacity', 'Filter', 'Interval'],
    'battery-location': ['Location', 'Battery Size', 'CCA', 'Type'],
    'tire-size': ['Tire Size', 'Pressure', 'Bolt Pattern'],
    'serpentine-belt': ['Belt Type', 'Belt Length', 'Routing', 'Interval', 'Tensioner'],
    'headlight-bulb': ['Low Beam', 'High Beam', 'Fog', 'Headlight Type'],
    'fluid-capacity': ['Engine Oil', 'Coolant', 'Transmission', 'Brake', 'Power Steering'],
    'spark-plug-type': ['Spark Plug Type', 'Plug Gap', 'Replacement Interval', 'Quantity', 'Torque'],
    'wiper-blade-size': ['Driver Side', 'Passenger Side', 'Rear', 'Wiper Arm Type'],
    'coolant-type': ['Coolant Type', 'Coolant Color', 'Total Capacity', 'Change Interval'],
    'transmission-fluid-type': ['Automatic Fluid Type', 'Manual Fluid Type', 'Drain & Fill', 'Capacity', 'Change Interval'],
  };

  const selectedKeys = keyPriority[page.toolType];
  const selected: ToolSpecHighlight[] = [];

  for (const keyFragment of selectedKeys) {
    const match = entries.find(([key]) => key.toLowerCase().includes(keyFragment.toLowerCase()));
    if (match && !selected.some((item) => item.label === match[0])) {
      selected.push({ label: match[0], value: match[1] });
    }
    if (selected.length >= 3) break;
  }

  if (selected.length >= 3) return selected;

  for (const [label, value] of entries) {
    if (selected.some((item) => item.label === label)) continue;
    selected.push({ label, value });
    if (selected.length >= 3) break;
  }

  return selected;
}

export function getToolSpecHighlights(page: ToolPage, limit = 3): ToolSpecHighlight[] {
  return toolSpecificHighlights(page).slice(0, Math.max(1, limit));
}

function buildDefaultToolIntentOffers(page: ToolPage): ToolIntentOffer[] {
  const vehicleName = `${page.make} ${page.model}`;
  const oilWeight = extractOilWeight(page);
  const oilCapacity = extractOilCapacity(page);
  const sparkGap = extractSparkGap(page);
  const sparkType = findSpecValue(page, ['Spark Plug Type']) ?? 'Iridium';
  const sparkQuantity = findSpecValue(page, ['Quantity']) ?? '4 or 6 depending on engine';
  const beltLength = findSpecValue(page, ['Belt Length']) ?? 'length varies by engine';
  const beltType = findSpecValue(page, ['Belt Type']) ?? 'multi-rib serpentine belt';
  const fluidType = findSpecValue(page, ['Automatic Fluid Type', 'Fluid Type']) ?? 'manufacturer-specified fluid';
  const coolantType = findSpecValue(page, ['Coolant Type']) ?? 'manufacturer-specified coolant';

  switch (page.toolType) {
    case 'serpentine-belt':
      return [
        {
          id: 'belt',
          title: 'Exact-fit serpentine belt',
          description: `${beltType} replacement for ${vehicleName}.`,
          reason: `Fitment matters because ${beltLength}.`,
          query: `${vehicleName} serpentine belt`,
        },
        {
          id: 'tensioner',
          title: 'Belt tensioner and idler pulley kit',
          description: 'Replace wear parts that commonly cause belt squeal and early failure.',
          reason: 'A worn tensioner can ruin a brand-new belt quickly.',
          query: `${vehicleName} belt tensioner idler pulley kit`,
        },
        {
          id: 'tool',
          title: 'Serpentine belt service tool',
          description: 'Low-profile wrench tool for tight engine-bay access.',
          reason: 'This job is much easier with the correct leverage tool.',
          query: `${vehicleName} serpentine belt tool`,
        },
        {
          id: 'breaker-bar',
          title: 'Breaker bar and ratchet set',
          description: 'Helps release the automatic tensioner cleanly before routing the new belt.',
          reason: 'A long handle saves knuckles when the belt path is tight.',
          query: `1/2 inch breaker bar automotive`,
        },
        {
          id: 'shop-towels',
          title: 'Shop towels and cleaning supplies',
          description: 'Keep the accessory drive clean while the belt is off.',
          reason: 'Clean pulleys and hands make inspection easier and help reduce slip.',
          query: 'blue shop towels automotive',
        },
      ];
    case 'spark-plug-type':
      return [
        {
          id: 'plugs',
          title: 'Correct spark plug set',
          description: `${sparkType} plugs for ${vehicleName}.`,
          reason: `Typical quantity is ${sparkQuantity}${sparkGap ? ` and common gap spec is ${sparkGap}` : ''}.`,
          query: `${vehicleName} ${sparkType} spark plugs`,
        },
        {
          id: 'socket',
          title: 'Spark plug socket set',
          description: 'Magnetic or rubber-insert sockets for safe plug installation.',
          reason: 'Prevents cracked insulators and dropped plugs in deep wells.',
          query: `${vehicleName} spark plug socket set`,
        },
        {
          id: 'torque',
          title: '3/8-inch torque wrench',
          description: 'Torque to spec and avoid stripping aluminum threads.',
          reason: 'Plug thread damage is expensive and fully avoidable.',
          query: `3/8 inch torque wrench automotive`,
        },
        {
          id: 'gap-gauge',
          title: 'Gap gauge and anti-seize kit',
          description: 'Helpful for checking plug gap and protecting service threads.',
          reason: 'Small install tools prevent big ignition problems later.',
          query: `${vehicleName} spark plug gap gauge anti seize`,
        },
        {
          id: 'coil-grease',
          title: 'Dielectric grease and coil boots',
          description: 'Protect connectors and coil boots during plug service.',
          reason: 'Moisture protection helps prevent repeat misfires and corrosion.',
          query: `${vehicleName} dielectric grease coil boot`,
        },
      ];
    case 'oil-type':
      return [
        {
          id: 'oil',
          title: 'Engine oil that matches spec',
          description: `${oilWeight ?? 'Manufacturer-specified'} engine oil for ${vehicleName}.`,
          reason: oilCapacity ? `Typical fill is around ${oilCapacity} depending on engine.` : 'Oil spec and fill amount vary by engine option.',
          query: `${vehicleName} ${oilWeight ?? ''} full synthetic motor oil`.trim(),
        },
        {
          id: 'filter',
          title: 'Exact-fit oil filter',
          description: 'Filter options specific to this model family.',
          reason: 'Correct filter fitment protects oil pressure and bypass behavior.',
          query: `${vehicleName} oil filter`,
        },
        {
          id: 'drain-hardware',
          title: 'Drain plug gasket and service extras',
          description: 'Small parts that prevent leaks after service.',
          reason: 'Fresh crush washers reduce post-change seepage risk.',
          query: `${vehicleName} oil drain plug gasket`,
        },
        {
          id: 'drain-pan',
          title: 'Oil drain pan and funnel',
          description: 'Keep the oil change clean from drain to refill.',
          reason: 'Simple cleanup tools reduce mess and save time in the garage.',
          query: `${vehicleName} oil drain pan funnel`,
        },
        {
          id: 'shop-towels',
          title: 'Shop towels for cleanup',
          description: 'Lint-free wipes for dipsticks, spills, and filter surfaces.',
          reason: 'The smallest supplies are often the most-used during DIY service.',
          query: 'shop towels automotive',
        },
      ];
    case 'fluid-capacity':
      return [
        {
          id: 'coolant',
          title: 'Correct coolant for this platform',
          description: 'Match chemistry and color family before topping off or flushing.',
          reason: 'Mixing coolant types can cause gel formation and overheating.',
          query: `${vehicleName} coolant`,
        },
        {
          id: 'trans-fluid',
          title: 'Transmission fluid for your gearbox',
          description: 'Fluid choice must match the transmission specification.',
          reason: 'Incorrect ATF is a common cause of poor shift quality.',
          query: `${vehicleName} transmission fluid`,
        },
        {
          id: 'brake-fluid',
          title: 'Brake fluid and bleed kit',
          description: 'DOT-rated fluid plus simple bleeding tools.',
          reason: 'Moisture-heavy brake fluid lowers boiling performance over time.',
          query: `${vehicleName} brake fluid DOT 3 DOT 4`,
        },
        {
          id: 'funnel',
          title: 'Long-neck funnel and extractor',
          description: 'Useful for topping off and moving fluids cleanly.',
          reason: 'These save time when the fill point is awkward or hidden.',
          query: `${vehicleName} fluid funnel extractor`,
        },
        {
          id: 'shop-towels',
          title: 'Shop towels and gloves',
          description: 'Basic cleanup gear for any fluid service job.',
          reason: 'Cleanup tools make every service easier and safer.',
          query: 'shop towels nitrile gloves automotive',
        },
      ];
    case 'transmission-fluid-type':
      return [
        {
          id: 'atf',
          title: 'OEM-spec transmission fluid',
          description: `${fluidType} fluid search for ${vehicleName}.`,
          reason: 'Transmission service should always match exact fluid specification.',
          query: `${vehicleName} transmission fluid type`,
        },
        {
          id: 'pump',
          title: 'Fluid transfer pump',
          description: 'Helpful for sealed transmissions with bottom-fill service.',
          reason: 'Prevents under-fill and spill-heavy refills.',
          query: `transmission fluid transfer pump`,
        },
        {
          id: 'kit',
          title: 'Pan gasket and filter kit',
          description: 'Complete service kit where pan filters are replaceable.',
          reason: 'A proper service kit helps avoid repeat labor.',
          query: `${vehicleName} transmission filter kit`,
        },
        {
          id: 'funnel',
          title: 'Fluid transfer pump',
          description: 'Helpful for sealed transmissions and bottom-fill service.',
          reason: 'A pump keeps refill clean and reduces the chance of under-fill.',
          query: `transmission fluid transfer pump`,
        },
        {
          id: 'shop-towels',
          title: 'Shop towels and pan gasket supplies',
          description: 'Keep the service area clean and the pan sealed.',
          reason: 'Transmission service is easier when cleanup gear is already on hand.',
          query: `${vehicleName} shop towels transmission gasket`,
        },
      ];
    case 'coolant-type':
      return [
        {
          id: 'coolant',
          title: 'Coolant that matches spec',
          description: `${coolantType} options for ${vehicleName}.`,
          reason: 'Correct chemistry prevents corrosion and avoids incompatible mix issues.',
          query: `${vehicleName} coolant type`,
        },
        {
          id: 'flush-kit',
          title: 'Cooling system flush kit',
          description: 'Funnels, adapters, and tools for cleaner coolant service.',
          reason: 'A complete flush setup improves refill accuracy and air bleeding.',
          query: `${vehicleName} coolant flush kit`,
        },
        {
          id: 'tester',
          title: 'Coolant concentration tester',
          description: 'Quickly verify freeze and boil protection after service.',
          reason: 'Simple testing reduces repeat failures and comeback risk.',
          query: `coolant tester automotive`,
        },
        {
          id: 'funnel',
          title: 'Spill-free funnel kit',
          description: 'Makes coolant refills and burping much easier.',
          reason: 'A good funnel cuts down on air pockets and messy refills.',
          query: `${vehicleName} spill free coolant funnel`,
        },
        {
          id: 'hose-tools',
          title: 'Hose clamp pliers and shop towels',
          description: 'Useful for clamp work, drips, and quick cleanup.',
          reason: 'Cooling-system service almost always needs cleanup gear too.',
          query: `${vehicleName} hose clamp pliers shop towels`,
        },
      ];
    default:
      return [];
  }
}

function applyTopPageOverride(page: ToolPage, offers: ToolIntentOffer[]): ToolIntentOffer[] {
  const override = TOP_PAGE_OFFER_OVERRIDES[page.slug];
  if (!override || !offers.length) return offers;

  const next = [...offers];
  next[0] = {
    ...next[0],
    title: override.primaryTitle,
    description: override.primaryDescription,
    reason: override.primaryReason,
    query: override.primaryQuery,
  };

  if (next[1] && override.secondaryQuery) {
    next[1] = {
      ...next[1],
      query: override.secondaryQuery,
    };
  }

  if (next[2] && override.tertiaryQuery) {
    next[2] = {
      ...next[2],
      query: override.tertiaryQuery,
    };
  }

  return next;
}

export function buildToolIntentOffers(page: ToolPage): ToolIntentOffer[] {
  const defaults = buildDefaultToolIntentOffers(page);
  return applyTopPageOverride(page, defaults);
}
