// services/affiliateService.ts
// Multi-retailer affiliate link generator for auto parts

import { AffiliateLink, AffiliateProvider, PartWithLinks } from '../types';

// Affiliate Tags - Set these in your .env.local
const AMAZON_TAG = process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG || 'antigravity-20';

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
 * Generate all affiliate links for a single part
 * Currently only Amazon (RockAuto and AutoZone removed per request)
 */
export function generatePartLinks(partName: string, vehicleString: string): AffiliateLink[] {
  const links: AffiliateLink[] = [
    generateAmazonLink(partName, vehicleString)
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

  // Default to Amazon if provider is not found or removed
  return {
    provider: 'Amazon',
    url: `https://www.amazon.com/s?k=${encoded}&i=automotive&tag=${AMAZON_TAG}`,
    buttonText: 'Shop All on Amazon',
    badge: 'Prime',
    icon: 'amazon'
  };
}