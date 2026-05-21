/**
 * Utility for generating affiliate monetization links for parts, tools, and consumables.
 */

export interface AffiliateVehicle {
  year?: string | number;
  make?: string;
  model?: string;
}

const AMAZON_TAG = 'aiautorepair-20';

/**
 * Standardize and clean query term for better Amazon search matches
 */
function cleanQueryTerm(term: string): string {
  return term
    .replace(/\[IMAGE:[^\]]+\]/g, '') // strip image markers
    .replace(/[()\-+,.;:]/g, ' ')      // replace punctuation with space
    .replace(/\s+/g, ' ')              // collapse whitespace
    .trim();
}

/**
 * Generate Amazon Associates affiliate search URL for a given item,
 * optionally targeting a specific vehicle model to ensure exact fit.
 */
export function getAmazonAffiliateLink(
  itemName: string,
  vehicle?: AffiliateVehicle
): string {
  const cleanItem = cleanQueryTerm(itemName);
  let query = cleanItem;

  // Append vehicle context if available to guarantee part compatibility search
  if (vehicle && vehicle.make && vehicle.model) {
    const y = vehicle.year ? `${vehicle.year} ` : '';
    query = `${y}${vehicle.make} ${vehicle.model} ${cleanItem}`;
  }

  const encodedQuery = encodeURIComponent(query);
  return `https://www.amazon.com/s?k=${encodedQuery}&tag=${AMAZON_TAG}`;
}
