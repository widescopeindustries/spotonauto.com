/**
 * Tire Rack affiliate link builder.
 *
 * CJ Affiliate deep-link format:
 *   https://www.{cjDomain}.com/click-{pid}-{aid}?url={encodedDestination}
 *
 * The exact CJ domain, PID and AID come from the CJ dashboard Link Tools.
 * If CJ credentials are not configured, we still send users to the correct
 * Tire Rack search page (direct, non-affiliated).
 */

const CJ_DOMAIN = process.env.NEXT_PUBLIC_CJ_DOMAIN?.trim() || '';
const CJ_PID = process.env.NEXT_PUBLIC_CJ_PID?.trim() || '';
const CJ_AID_TIRE_RACK = process.env.NEXT_PUBLIC_CJ_AID_TIRE_RACK?.trim() || '';

export interface ParsedTireSize {
  width: number;
  ratio: number;
  diameter: number;
  serviceDesc?: string; // e.g. "91V" or "116H"
}

/**
 * Parse common tire size strings:
 *   P225/45R17
 *   225/45R17
 *   245/40ZR18
 *   LT265/70R17
 *   275/65R18 116H
 *   P225/45R17 91V
 *
 * Returns null if the string cannot be parsed.
 */
export function parseTireSize(size: string): ParsedTireSize | null {
  const normalized = size.replace(/\s+/g, ' ').trim();
  // Match: optional P/LT/ST, width 2-3 digits, aspect ratio 2 digits,
  // optional Z before R, diameter 2 digits, optional service description.
  const match = normalized.match(
    /^(?:P|LT|ST)?(\d{2,3})\/(\d{2,3})(?:ZR?|R)(\d{2})(?:\s+(\d{1,3}[A-Z]))?/i
  );
  if (!match) return null;

  const [, widthStr, ratioStr, diameterStr, serviceDesc] = match;
  return {
    width: parseInt(widthStr, 10),
    ratio: parseInt(ratioStr, 10),
    diameter: parseInt(diameterStr, 10),
    serviceDesc,
  };
}

/**
 * Build a Tire Rack URL that searches by exact tire size.
 * Tire Rack expects frontWidth with a trailing slash (e.g. "225/").
 */
export function buildTireRackSizeUrl(size: string): string {
  const parsed = parseTireSize(size);
  if (!parsed) {
    // Fallback: generic tire search on Tire Rack.
    return `https://www.tirerack.com/tires/TireSearchResults.jsp?search=${encodeURIComponent(size)}`;
  }

  const { width, ratio, diameter } = parsed;
  const params = new URLSearchParams({
    frontWidth: `${width}/`,
    frontRatio: String(ratio),
    frontDiameter: String(diameter),
    rearWidth: `${width}/`,
    rearRatio: String(ratio),
    rearDiameter: String(diameter),
  });

  return `https://www.tirerack.com/tires/TireSearchResults.jsp?${params.toString()}`;
}

/**
 * Build a Tire Rack URL that searches by vehicle year/make/model.
 * More forgiving than size search when the size string is unusual.
 */
export function buildTireRackVehicleUrl(
  year: string | number,
  make: string,
  model: string,
  trim?: string
): string {
  const params = new URLSearchParams({
    autoMake: make,
    autoModel: model,
    autoYear: String(year),
  });
  if (trim) {
    params.set('autoModClar', trim);
  }
  return `https://www.tirerack.com/tires/TireSearchResults.jsp?${params.toString()}`;
}

/**
 * Wrap a Tire Rack destination URL with CJ Affiliate tracking.
 * Returns direct Tire Rack URL if CJ credentials are missing.
 */
export function buildTireRackAffiliateUrl(
  destinationUrl: string,
  subtag?: string
): string {
  if (!CJ_DOMAIN || !CJ_PID || !CJ_AID_TIRE_RACK) {
    return destinationUrl;
  }

  const base = `https://www.${CJ_DOMAIN}/click-${CJ_PID}-${CJ_AID_TIRE_RACK}`;
  const params = new URLSearchParams({ url: destinationUrl });
  if (subtag) {
    params.set('sid', subtag);
  }
  return `${base}?${params.toString()}`;
}

/**
 * Convenience: direct-to-size Tire Rack affiliate link.
 */
export function getTireRackSizeAffiliateLink(size: string, subtag?: string): string {
  return buildTireRackAffiliateUrl(buildTireRackSizeUrl(size), subtag);
}

/**
 * Convenience: vehicle-based Tire Rack affiliate link.
 */
export function getTireRackVehicleAffiliateLink(
  year: string | number,
  make: string,
  model: string,
  trim?: string,
  subtag?: string
): string {
  return buildTireRackAffiliateUrl(
    buildTireRackVehicleUrl(year, make, model, trim),
    subtag
  );
}
