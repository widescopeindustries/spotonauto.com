// services/affiliateService.ts
// Multi-retailer affiliate link generator for auto parts

import { AffiliateLink, AffiliateProvider, PartWithLinks } from '../types';

// Affiliate Tags - Set these in your .env.local
const AMAZON_TAG = process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG || 'antigravity-20';
const ROCKAUTO_AID = process.env.NEXT_PUBLIC_ROCKAUTO_AFFILIATE_ID || '';
const AUTOZONE_AID = process.env.NEXT_PUBLIC_AUTOZONE_AFFILIATE_ID || '';

// Part category detection for smarter linking
const PART_CATEGORIES = {
  brake: /brake|pad|rotor|caliper|drum|shoe/i,
  engine: /alternator|starter|belt|pulley|gasket|timing|spark|coil|injector|pump|manifold|valve/i,
  electrical: /battery|fuse|relay|sensor|switch|wire|connector|module/i,
  suspension: /strut|shock|spring|control arm|ball joint|tie rod|bushing|sway bar|hub|bearing/i,
  fluid: /oil|fluid|coolant|antifreeze|transmission|brake fluid|power steering/i,
  filter: /filter|air filter|oil filter|fuel filter|cabin filter/i,
} as const;

// High-ticket items that deserve more prominent display
const HIGH_TICKET_PARTS = /alternator|starter|strut|shock|compressor|catalytic|manifold|radiator|transmission|turbo|supercharger|differential|axle/i;

// OEM-quality parts that RockAuto excels at
const OEM_PARTS = /sensor|module|actuator|solenoid|pump|compressor|alternator|starter/i;

/**
 * Detect part category for styling and badge assignment
 */
function detectCategory(partName: string): PartWithLinks['category'] {
  for (const [category, pattern] of Object.entries(PART_CATEGORIES)) {
    if (pattern.test(partName)) {
      return category as PartWithLinks['category'];
    }
  }
  return 'other';
}

/**
 * Generate Amazon affiliate link
 * Strategy: Search page with vehicle + part for fitment accuracy
 */
function generateAmazonLink(partName: string, vehicleString: string): AffiliateLink {
  const cleanVehicle = vehicleString.replace(/[^a-zA-Z0-9\s]/g, '');
  const cleanPart = partName.replace(/[^a-zA-Z0-9\s]/g, '');
  const query = `${cleanVehicle} ${cleanPart}`.trim();
  const encodedQuery = encodeURIComponent(query);

  const url = `https://www.amazon.com/s?k=${encodedQuery}&i=automotive&tag=${AMAZON_TAG}`;

  return {
    provider: 'Amazon',
    url,
    buttonText: 'Check Amazon',
    badge: 'Prime',
    priceRange: 'mid',
    icon: 'amazon'
  };
}

/**
 * Generate RockAuto affiliate link
 * Strategy: Best for OEM and aftermarket parts at wholesale prices
 * RockAuto uses search-based linking
 */
function generateRockAutoLink(partName: string, vehicleString: string): AffiliateLink {
  // Parse vehicle string (e.g., "2015 Toyota Camry")
  const parts = vehicleString.split(' ');
  const year = parts[0] || '';
  const make = parts[1] || '';
  const model = parts.slice(2).join(' ') || '';

  // RockAuto search URL format
  const searchQuery = encodeURIComponent(`${year} ${make} ${model} ${partName}`);

  // RockAuto affiliate link format (they use a simple referral system)
  // If you have an affiliate ID, append it; otherwise use direct search
  let url = `https://www.rockauto.com/en/catalog/?carcode=${encodeURIComponent(`${year},${make},${model}`)}&parttype=${encodeURIComponent(partName)}`;

  // Fallback to search if carcode doesn't work
  url = `https://www.rockauto.com/en/partsearch/?partnum=${searchQuery}`;

  // Simple referral tracking via URL
  if (ROCKAUTO_AID) {
    url += `&affiliate=${ROCKAUTO_AID}`;
  }

  const isOEM = OEM_PARTS.test(partName);

  return {
    provider: 'RockAuto',
    url,
    buttonText: 'RockAuto Prices',
    badge: isOEM ? 'OEM Parts' : 'Wholesale',
    priceRange: 'low',
    icon: 'rockauto'
  };
}

/**
 * Generate AutoZone affiliate link
 * Strategy: Local pickup same-day, great for urgent repairs
 */
function generateAutoZoneLink(partName: string, vehicleString: string): AffiliateLink {
  const parts = vehicleString.split(' ');
  const year = parts[0] || '';
  const make = parts[1] || '';
  const model = parts.slice(2).join(' ') || '';

  // AutoZone search URL
  const searchQuery = encodeURIComponent(`${year} ${make} ${model} ${partName}`);
  let url = `https://www.autozone.com/searchresult?searchText=${searchQuery}`;

  // AutoZone affiliate tracking (Commission Junction typically)
  if (AUTOZONE_AID) {
    url = `https://www.autozone.com/searchresult?searchText=${searchQuery}&ref=${AUTOZONE_AID}`;
  }

  return {
    provider: 'AutoZone',
    url,
    buttonText: 'AutoZone - Pickup Today',
    badge: 'Local Pickup',
    priceRange: 'mid',
    icon: 'autozone'
  };
}

/**
 * Generate all affiliate links for a single part
 * Currently only Amazon (RockAuto has no program, AutoZone not approved)
 */
export function generatePartLinks(partName: string, vehicleString: string): AffiliateLink[] {
  const links: AffiliateLink[] = [
    generateAmazonLink(partName, vehicleString),
    // RockAuto - no affiliate program
    // AutoZone - not approved
  ];

  return links;
}

/**
 * Generate enhanced part data with all links and metadata
 * Use this for the new comparison display
 */
export function generatePartWithLinks(partName: string, vehicleString: string): PartWithLinks {
  const isHighTicket = HIGH_TICKET_PARTS.test(partName);
  const category = detectCategory(partName);
  const links = generatePartLinks(partName, vehicleString);

  return {
    name: partName,
    links,
    isHighTicket,
    category
  };
}

/**
 * Batch process all parts from a repair guide
 */
export function generateAllPartsWithLinks(parts: string[], vehicleString: string): PartWithLinks[] {
  return parts.map(part => generatePartWithLinks(part, vehicleString));
}

/**
 * Generate tool affiliate links (Amazon-only for tools)
 */
export function generateToolLinks(toolName: string): AffiliateLink[] {
  const query = encodeURIComponent(toolName);
  const amazonUrl = `https://www.amazon.com/s?k=${query}&i=automotive&tag=${AMAZON_TAG}`;

  return [
    {
      provider: 'Amazon',
      url: amazonUrl,
      buttonText: 'Find Tool',
      badge: 'Prime',
      priceRange: 'mid',
      icon: 'amazon'
    }
  ];
}

/**
 * Generate a "shop all parts" link for the vehicle
 */
export function generateShopAllLink(vehicleString: string, provider: AffiliateProvider): AffiliateLink {
  const encoded = encodeURIComponent(vehicleString + ' parts');

  switch (provider) {
    case 'Amazon':
      return {
        provider: 'Amazon',
        url: `https://www.amazon.com/s?k=${encoded}&i=automotive&tag=${AMAZON_TAG}`,
        buttonText: 'Shop All on Amazon',
        badge: 'Prime',
        icon: 'amazon'
      };
    case 'RockAuto':
      return {
        provider: 'RockAuto',
        url: `https://www.rockauto.com/`,
        buttonText: 'Browse RockAuto',
        badge: 'Wholesale',
        icon: 'rockauto'
      };
    case 'AutoZone':
      return {
        provider: 'AutoZone',
        url: `https://www.autozone.com/searchresult?searchText=${encoded}`,
        buttonText: 'Shop AutoZone',
        badge: 'Local Pickup',
        icon: 'autozone'
      };
  }
}
