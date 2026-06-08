// services/affiliateService.ts
// Multi-retailer affiliate link generator for auto parts

import { AffiliateLink, AffiliateProvider, PartWithLinks } from '../types';
import { buildAmazonSearchUrl } from '@/lib/amazonAffiliate';
import { buildTopdonProductUrl, TOPDON_PRODUCTS } from '@/lib/topdonAffiliate';
import { IMPACT_MERCHANTS } from '@/lib/impactAffiliate';
import { buildGeoAmazonSearchUrl } from '@/lib/amazonGeo';

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
  const url = buildAmazonSearchUrl(query);

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
 * Build a direct Impact merchant search URL (no API call needed).
 * Falls back to direct URL if Impact credentials aren't configured.
 */
function buildImpactSearchUrl(merchant: string, query: string): string {
  const encoded = encodeURIComponent(query);
  switch (merchant) {
    case 'advance_auto':
      return `https://shop.advanceautoparts.com/web/Search?searchTerm=${encoded}`;
    case 'suncent_auto':
      return `https://www.suncentauto.com/search.html?q=${encoded}`;
    case 'thinkcar':
      return `https://thinkcar.com/search?q=${encoded}`;
    case 'carparts_com':
      return `https://www.carparts.com/search?q=${encoded}`;
    default:
      return `https://www.amazon.com/s?k=${encoded}&tag=aiautorepair-20`;
  }
}

/**
 * Generate all affiliate links for a single part.
 * Amazon + Impact merchants (Advance Auto Parts 10%, SuncentAuto 15%, Thinkcar 20%)
 */
export function generatePartLinks(partName: string, vehicleString: string): AffiliateLink[] {
  const lowerPart = partName.toLowerCase();
  const cleanVehicle = vehicleString.replace(/[^a-zA-Z0-9\s]/g, '');
  const cleanPart = partName.replace(/[^a-zA-Z0-9\s]/g, '');
  const query = `${cleanVehicle} ${cleanPart}`.trim();

  const links: AffiliateLink[] = [
    generateAmazonLink(partName, vehicleString)
  ];

  // 1. Diagnostic Scanners -> Thinkcar (20% commission)
  if (/scanner|obd|scan tool|code reader|diagnostic tool/i.test(lowerPart)) {
    links.push({
      provider: 'Thinkcar' as AffiliateProvider,
      url: buildImpactSearchUrl('thinkcar', query),
      buttonText: 'Shop Thinkcar',
      badge: '20% Commission',
      priceRange: 'mid',
      icon: 'thinkcar'
    });
  }

  // 2. Lighting/Bulbs -> SuncentAuto (15% commission)
  if (/bulb|headlight|led|tail light|fog light|turn signal/i.test(lowerPart)) {
    links.push({
      provider: 'SuncentAuto' as AffiliateProvider,
      url: buildImpactSearchUrl('suncent_auto', query),
      buttonText: 'Shop SuncentAuto',
      badge: '15% Commission',
      priceRange: 'low',
      icon: 'suncentauto'
    });
  }

  // 3. Heavy/Mainstream Parts -> Advance Auto Parts (10% + local pickup)
  const isHeavyPart = /brake|pad|rotor|caliper|alternator|starter|radiator|battery|shock|strut|water pump|thermostat|cv axle|control arm|ball joint/i.test(lowerPart);
  if (isHeavyPart) {
    links.push({
      provider: 'Advance Auto Parts' as AffiliateProvider,
      url: buildImpactSearchUrl('advance_auto', query),
      buttonText: 'Shop Advance Auto',
      badge: '10% + Pickup',
      priceRange: 'mid',
      icon: 'advanceauto'
    });
  }

  // 4. General auto parts -> CarParts.com as extra option
  links.push({
    provider: 'CarParts.com' as AffiliateProvider,
    url: buildImpactSearchUrl('carparts_com', query),
    buttonText: 'Shop CarParts.com',
    badge: 'Compare',
    priceRange: 'mid',
    icon: 'carparts'
  });

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

// Keywords that indicate a diagnostic/scan tool context
const DIAGNOSTIC_TOOL_RE = /scan\s*tool|obd|diagnostic|code\s*reader|scanner|multimeter|test\s*light/i;
const BATTERY_TOOL_RE = /battery\s*tester|load\s*tester|charging\s*system|hydrometer/i;

/**
 * Generate tool affiliate links.
 * Includes Topdon alongside Amazon for scan tools and battery testers.
 */
export function generateToolLinks(toolName: string): AffiliateLink[] {
  const amazonUrl = buildAmazonSearchUrl(toolName);

  const links: AffiliateLink[] = [
    {
      provider: 'Amazon',
      url: amazonUrl,
      buttonText: 'Find Tool',
      badge: 'Prime',
      priceRange: 'mid',
      icon: 'amazon'
    }
  ];

  // Add Topdon for diagnostic scan tools
  if (DIAGNOSTIC_TOOL_RE.test(toolName)) {
    links.push({
      provider: 'Topdon',
      url: buildTopdonProductUrl(TOPDON_PRODUCTS.topscan.slug),
      buttonText: `Topdon TopScan — $${TOPDON_PRODUCTS.topscan.price}`,
      badge: 'OEM Parts',
      priceRange: 'mid',
      icon: 'topdon'
    });
  }

  // Add Topdon battery tester for battery tools
  if (BATTERY_TOOL_RE.test(toolName)) {
    links.push({
      provider: 'Topdon',
      url: buildTopdonProductUrl(TOPDON_PRODUCTS.bt50.slug),
      buttonText: `Topdon BT50 — $${TOPDON_PRODUCTS.bt50.price}`,
      badge: 'Best Value',
      priceRange: 'low',
      icon: 'topdon'
    });
  }

  return links;
}

/**
 * Generate a "shop all parts" link for the vehicle
 * Now returns multiple retailer options for maximum conversion
 */
export function generateShopAllLink(vehicleString: string, _provider: AffiliateProvider): AffiliateLink {
  return {
    provider: 'Amazon',
    url: buildAmazonSearchUrl(`${vehicleString} parts`),
    buttonText: 'Shop All on Amazon',
    badge: 'Prime',
    icon: 'amazon'
  };
}

/**
 * Generate a multi-retailer "shop all parts" card for vehicle hubs
 * Returns links to Amazon, Advance Auto Parts, and CarParts.com
 */
export function generateShopAllLinks(vehicleString: string): AffiliateLink[] {
  const query = `${vehicleString} auto parts`;
  return [
    {
      provider: 'Amazon',
      url: buildAmazonSearchUrl(query),
      buttonText: 'Shop Amazon',
      badge: 'Prime',
      priceRange: 'mid',
      icon: 'amazon'
    },
    {
      provider: 'Advance Auto Parts',
      url: buildImpactSearchUrl('advance_auto', query),
      buttonText: 'Shop Advance Auto',
      badge: '10% + Pickup',
      priceRange: 'mid',
      icon: 'advanceauto'
    },
    {
      provider: 'CarParts.com',
      url: buildImpactSearchUrl('carparts_com', query),
      buttonText: 'Shop CarParts.com',
      badge: 'Compare Prices',
      priceRange: 'mid',
      icon: 'carparts'
    },
  ];
}
