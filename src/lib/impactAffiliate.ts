/**
 * Impact Radius Affiliate API Client
 *
 * This service manages programmatic affiliate link generation and conversion tracking
 * for higher-paying automotive networks (Advance Auto Parts, CarParts.com, etc.).
 */

const ACCOUNT_SID = process.env.IMPACT_ACCOUNT_SID;
const AUTH_TOKEN = process.env.IMPACT_AUTH_TOKEN;

// Default media property ID for AllOEMManuals (fetched from Impact dashboard)
const MEDIA_PROPERTY_ID = process.env.IMPACT_MEDIA_PROPERTY_ID || '3329204';

/**
 * Common Impact Automotive Merchant IDs
 */
export const IMPACT_MERCHANTS = {
  advance_auto: '2770',
  carparts_com: '3257',
  suncent_auto: '13612',
  thinkcar: '16912',
};

/**
 * Generate a deep-linked tracking URL for a specific product and merchant.
 */
export async function generateImpactTrackingUrl(
  productUrl: string,
  merchantId: string,
  subId1?: string
): Promise<string> {
  if (!ACCOUNT_SID || !AUTH_TOKEN) {
    console.warn('[Impact] Missing API credentials, falling back to direct URL.');
    return productUrl;
  }

  try {
    // Impact API uses Basic Auth with SID:Token
    const auth = Buffer.from(`${ACCOUNT_SID}:${AUTH_TOKEN}`).toString('base64');
    
    // Impact API endpoint for deep linking
    const apiEndpoint = `https://api.impact.com/Mediapartners/${ACCOUNT_SID}/TrackingLinks`;

    const params = new URLSearchParams({
      CampaignId: merchantId,
      DeepLink: productUrl,
    });

    if (subId1) params.append('SubId1', subId1);

    const response = await fetch(`${apiEndpoint}?${params.toString()}`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Impact API error: ${error.Message || response.statusText}`);
    }

    const data = await response.json();
    return data.TrackingLink || productUrl;
  } catch (error) {
    console.error('[Impact] Failed to generate tracking link:', error);
    return productUrl; // Fail safe to original URL
  }
}

/**
 * Higher-level router to pick the best merchant for a part type.
 */
export async function getBestAffiliateLink(
  partName: string,
  searchQuery: string,
  context?: { pageType?: string; vehicle?: string }
): Promise<{ url: string; provider: 'Impact' | 'Amazon'; merchant?: string }> {
  
  const lowerPart = partName.toLowerCase();
  
  // 1. Diagnostic Scanners -> Thinkcar (20% commission)
  if (lowerPart.includes('scanner') || lowerPart.includes('obd') || lowerPart.includes('scan tool')) {
    const directUrl = `https://thinkcar.com/search?q=${encodeURIComponent(searchQuery)}`;
    const trackingUrl = await generateImpactTrackingUrl(directUrl, IMPACT_MERCHANTS.thinkcar, context?.pageType);
    return { url: trackingUrl, provider: 'Impact', merchant: 'Thinkcar' };
  }

  // 2. Lighting/Bulbs -> SuncentAuto (15% commission)
  if (lowerPart.includes('bulb') || lowerPart.includes('headlight') || lowerPart.includes('led')) {
    const directUrl = `https://www.suncentauto.com/search.html?q=${encodeURIComponent(searchQuery)}`;
    const trackingUrl = await generateImpactTrackingUrl(directUrl, IMPACT_MERCHANTS.suncent_auto, context?.pageType);
    return { url: trackingUrl, provider: 'Impact', merchant: 'SuncentAuto' };
  }

  // 3. Heavy/Mainstream Parts -> Advance Auto Parts (10% + Local Pickup)
  const isHeavyPart = /brake|rotor|alternator|starter|radiator|battery|shock|strut/.test(lowerPart);
  if (isHeavyPart) {
    const directUrl = `https://shop.advanceautoparts.com/web/Search?searchTerm=${encodeURIComponent(searchQuery)}`;
    const trackingUrl = await generateImpactTrackingUrl(directUrl, IMPACT_MERCHANTS.advance_auto, context?.pageType);
    return { url: trackingUrl, provider: 'Impact', merchant: 'Advance Auto Parts' };
  }

  // 4. Fallback -> Amazon (4%)
  return { 
    url: `https://www.amazon.com/s?k=${encodeURIComponent(searchQuery)}&tag=aiautorepair-20`, 
    provider: 'Amazon' 
  };
}
