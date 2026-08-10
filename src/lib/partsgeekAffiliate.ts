const DEFAULT_CJ_PUBLISHER_ID = '7974446'; // alloemmanuals CID
const PARTSGEEK_LINK_ID = '15733452'; // PartsGeek Evergreen Link ID

export const CJ_PUBLISHER_ID =
  process.env.NEXT_PUBLIC_CJ_PUBLISHER_ID?.trim() || DEFAULT_CJ_PUBLISHER_ID;

/**
 * Builds a CJ tracking URL for PartsGeek.com targeting a specific search query or OEM part
 */
export function buildPartsGeekSearchUrl(query: string, subId?: string): string {
  const cleanQuery = encodeURIComponent(query.trim());
  const destination = `https://www.partsgeek.com/ss/?ssq=${cleanQuery}`;
  
  const params = new URLSearchParams({
    url: destination,
  });

  if (subId) {
    params.set('sid', subId);
  }

  return `https://www.anrdoezrs.net/click-${CJ_PUBLISHER_ID}-${PARTSGEEK_LINK_ID}?${params.toString()}`;
}

/**
 * Builds a CJ tracking URL for PartsGeek.com targeting a specific vehicle make (e.g. Ford, Toyota)
 */
export function buildPartsGeekMakeUrl(make: string, subId?: string): string {
  const cleanMake = make.toLowerCase().replace(/[^a-z0-9]/g, '');
  const destination = `https://www.partsgeek.com/makes/${cleanMake}.html`;
  
  const params = new URLSearchParams({
    url: destination,
  });

  if (subId) {
    params.set('sid', subId);
  }

  return `https://www.anrdoezrs.net/click-${CJ_PUBLISHER_ID}-${PARTSGEEK_LINK_ID}?${params.toString()}`;
}

/**
 * Builds a CJ tracking URL for PartsGeek.com targeting a specific vehicle model (e.g. F-150, Camry)
 */
export function buildPartsGeekModelUrl(make: string, model: string, subId?: string): string {
  const cleanMake = make.toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanModel = model.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  const destination = `https://www.partsgeek.com/models/${cleanModel}/${cleanMake}.html`;
  
  const params = new URLSearchParams({
    url: destination,
  });

  if (subId) {
    params.set('sid', subId);
  }

  return `https://www.anrdoezrs.net/click-${CJ_PUBLISHER_ID}-${PARTSGEEK_LINK_ID}?${params.toString()}`;
}
