/**
 * Manual's Curated Kits — Direct-revenue product line.
 *
 * Each kit is pre-assembled for an exact vehicle + job.
 * Two tiers: OEM Exact (premium) and Smart Budget (value).
 *
 * Phase 1: Waitlist validation (email capture)
 * Phase 2: Stripe checkout + fulfillment
 */

export interface KitItem {
  name: string;
  description: string;
  oemBrand: string;
  budgetBrand: string;
}

export interface OilChangeKit {
  slug: string;
  make: string;
  model: string;
  yearRange: string;
  engineOptions: string[];
  oilSpec: {
    viscosity: string;
    capacity: string;
    type: string;
  };
  items: KitItem[];
  pricing: {
    oemExact: number;
    smartBudget: number;
    subscriptionYearOem: number;
    subscriptionYearBudget: number;
  };
}

const KITS: OilChangeKit[] = [
  {
    slug: 'toyota-camry',
    make: 'Toyota',
    model: 'Camry',
    yearRange: '2018–2024',
    engineOptions: ['2.5L 4-cyl', '3.5L V6'],
    oilSpec: { viscosity: '0W-16', capacity: '4.8 quarts', type: 'Full Synthetic' },
    items: [
      { name: 'Engine Oil', description: '4.8 quarts 0W-16 full synthetic', oemBrand: 'Toyota Genuine 0W-16', budgetBrand: 'Mobil 1 Advanced Fuel Economy 0W-16' },
      { name: 'Oil Filter', description: 'Exact-fit canister filter', oemBrand: 'Toyota 04152-YZZA1', budgetBrand: 'FRAM Ultra Synthetic XG10575' },
      { name: 'Drain Plug Gasket', description: 'Aluminum crush washer', oemBrand: 'Toyota 90430-12031', budgetBrand: 'Dorman 095-147' },
      { name: 'Shop Rags', description: '6-pack lint-free blue towels', oemBrand: 'Scott Shop Towels', budgetBrand: 'Avalon Terry Cloth Rags' },
      { name: 'Oil Filter Wrench', description: 'Cap-style wrench for Toyota filters', oemBrand: 'Toyota SST', budgetBrand: 'Motivx Tools MX2330' },
      { name: 'Funnel', description: 'Long-neck no-spill funnel', oemBrand: 'Toyota Funnel', budgetBrand: 'LUMAX LX-1604' },
    ],
    pricing: { oemExact: 89, smartBudget: 59, subscriptionYearOem: 299, subscriptionYearBudget: 199 },
  },
  {
    slug: 'honda-civic',
    make: 'Honda',
    model: 'Civic',
    yearRange: '2016–2024',
    engineOptions: ['1.5L Turbo', '2.0L 4-cyl'],
    oilSpec: { viscosity: '0W-20', capacity: '3.7–4.6 quarts', type: 'Full Synthetic' },
    items: [
      { name: 'Engine Oil', description: '4.0 quarts 0W-20 full synthetic', oemBrand: 'Honda Genuine 0W-20', budgetBrand: 'Castrol GTX Magnatec 0W-20' },
      { name: 'Oil Filter', description: 'Exact-fit spin-on filter', oemBrand: 'Honda 15400-PLM-A02', budgetBrand: 'Bosch Premium 3330' },
      { name: 'Drain Plug Washer', description: '14mm aluminum crush washer', oemBrand: 'Honda 94109-14000', budgetBrand: 'Dorman 095-147' },
      { name: 'Shop Rags', description: '6-pack lint-free blue towels', oemBrand: 'Scott Shop Towels', budgetBrand: 'Avalon Terry Cloth Rags' },
      { name: 'Oil Filter Wrench', description: '64mm cap wrench for Honda filters', oemBrand: 'Honda SST', budgetBrand: 'Motivx Tools MX2320' },
      { name: 'Funnel', description: 'Long-neck no-spill funnel', oemBrand: 'Honda Funnel', budgetBrand: 'LUMAX LX-1604' },
    ],
    pricing: { oemExact: 89, smartBudget: 59, subscriptionYearOem: 299, subscriptionYearBudget: 199 },
  },
  {
    slug: 'ford-f-150',
    make: 'Ford',
    model: 'F-150',
    yearRange: '2015–2024',
    engineOptions: ['2.7L EcoBoost', '3.5L EcoBoost', '5.0L V8', '3.5L PowerBoost'],
    oilSpec: { viscosity: '5W-30', capacity: '6.0–8.0 quarts', type: 'Full Synthetic' },
    items: [
      { name: 'Engine Oil', description: '6.0–8.0 quarts 5W-30 full synthetic', oemBrand: 'Motorcraft Synthetic Blend 5W-30', budgetBrand: 'Valvoline Advanced Full Synthetic 5W-30' },
      { name: 'Oil Filter', description: 'Exact-fit cartridge or spin-on', oemBrand: 'Motorcraft FL-500S', budgetBrand: 'FRAM Ultra Synthetic XG2' },
      { name: 'Drain Plug Gasket', description: '14mm aluminum crush washer', oemBrand: 'Ford W705101-S300', budgetBrand: 'Dorman 095-147' },
      { name: 'Shop Rags', description: '12-pack lint-free blue towels (truck jobs are messy)', oemBrand: 'Scott Shop Towels', budgetBrand: 'Avalon Terry Cloth Rags' },
      { name: 'Oil Filter Wrench', description: 'Cap-style or strap wrench', oemBrand: 'Ford SST', budgetBrand: 'Motivx Tools MX2320' },
      { name: 'Funnel', description: 'Long-neck no-spill funnel', oemBrand: 'Motorcraft Funnel', budgetBrand: 'LUMAX LX-1604' },
    ],
    pricing: { oemExact: 119, smartBudget: 79, subscriptionYearOem: 399, subscriptionYearBudget: 279 },
  },
  {
    slug: 'toyota-rav4',
    make: 'Toyota',
    model: 'RAV4',
    yearRange: '2019–2024',
    engineOptions: ['2.5L 4-cyl', '2.5L Hybrid'],
    oilSpec: { viscosity: '0W-16', capacity: '4.8 quarts', type: 'Full Synthetic' },
    items: [
      { name: 'Engine Oil', description: '4.8 quarts 0W-16 full synthetic', oemBrand: 'Toyota Genuine 0W-16', budgetBrand: 'Mobil 1 Advanced Fuel Economy 0W-16' },
      { name: 'Oil Filter', description: 'Exact-fit canister filter', oemBrand: 'Toyota 04152-YZZA1', budgetBrand: 'FRAM Ultra Synthetic XG10575' },
      { name: 'Drain Plug Gasket', description: 'Aluminum crush washer', oemBrand: 'Toyota 90430-12031', budgetBrand: 'Dorman 095-147' },
      { name: 'Shop Rags', description: '6-pack lint-free blue towels', oemBrand: 'Scott Shop Towels', budgetBrand: 'Avalon Terry Cloth Rags' },
      { name: 'Oil Filter Wrench', description: 'Cap-style wrench for Toyota filters', oemBrand: 'Toyota SST', budgetBrand: 'Motivx Tools MX2330' },
      { name: 'Funnel', description: 'Long-neck no-spill funnel', oemBrand: 'Toyota Funnel', budgetBrand: 'LUMAX LX-1604' },
    ],
    pricing: { oemExact: 89, smartBudget: 59, subscriptionYearOem: 299, subscriptionYearBudget: 199 },
  },
  {
    slug: 'chevrolet-silverado',
    make: 'Chevrolet',
    model: 'Silverado 1500',
    yearRange: '2019–2024',
    engineOptions: ['2.7L Turbo', '5.3L V8', '6.2L V8', '3.0L Duramax'],
    oilSpec: { viscosity: '0W-20', capacity: '8.0 quarts', type: 'Full Synthetic (Dexos)' },
    items: [
      { name: 'Engine Oil', description: '8.0 quarts 0W-20 full synthetic Dexos', oemBrand: 'ACDelco Dexos 0W-20', budgetBrand: 'Valvoline Modern Engine 0W-20' },
      { name: 'Oil Filter', description: 'Exact-fit cartridge or spin-on', oemBrand: 'ACDelco PF63E', budgetBrand: 'FRAM Ultra Synthetic XG10575' },
      { name: 'Drain Plug Gasket', description: '15mm aluminum crush washer', oemBrand: 'GM 11562588', budgetBrand: 'Dorman 095-148' },
      { name: 'Shop Rags', description: '12-pack lint-free blue towels', oemBrand: 'Scott Shop Towels', budgetBrand: 'Avalon Terry Cloth Rags' },
      { name: 'Oil Filter Wrench', description: 'Cap-style wrench for GM filters', oemBrand: 'GM SST', budgetBrand: 'Motivx Tools MX2320' },
      { name: 'Funnel', description: 'Long-neck no-spill funnel', oemBrand: 'ACDelco Funnel', budgetBrand: 'LUMAX LX-1604' },
    ],
    pricing: { oemExact: 119, smartBudget: 79, subscriptionYearOem: 399, subscriptionYearBudget: 279 },
  },
];

const KIT_BY_SLUG = new Map(KITS.map(k => [k.slug, k]));

export function getKit(slug: string): OilChangeKit | undefined {
  return KIT_BY_SLUG.get(slug);
}

export function getAllKits(): OilChangeKit[] {
  return KITS;
}

export function findKitForVehicle(make: string, model: string): OilChangeKit | undefined {
  const key = `${make.toLowerCase()}-${model.toLowerCase().replace(/\s+/g, '-')}`;
  return KITS.find(k => k.slug === key);
}
