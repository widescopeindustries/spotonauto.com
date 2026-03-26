import 'server-only';

/**
 * DTC Cross-Vehicle Data
 *
 * Reads the DTC cross-vehicle index from Cloudflare KV.
 * This tells us which vehicles have OEM manual coverage for a given DTC code,
 * extracted from the Operation CHARM corpus (442M LMDB entries, 22K+ vehicles).
 */

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID ?? '';
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN ?? '';
const KV_NAMESPACE_ID = process.env.CLOUDFLARE_KV_NAMESPACE_ID ?? '';

const KV_BASE = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/storage/kv/namespaces/${KV_NAMESPACE_ID}`;

// Circuit breaker (shared with cloudflareKV.ts pattern)
let failures = 0;
let openUntil = 0;

function isOpen(): boolean {
  if (failures >= 3 && Date.now() < openUntil) return true;
  if (Date.now() >= openUntil) failures = 0;
  return false;
}

function recordFailure(): void {
  failures++;
  if (failures >= 3) openUntil = Date.now() + 3 * 60 * 1000;
}

function recordSuccess(): void {
  failures = 0;
  openUntil = 0;
}

async function kvGet(key: string): Promise<string | null> {
  if (!ACCOUNT_ID || !API_TOKEN || !KV_NAMESPACE_ID) return null;
  if (isOpen()) return null;

  try {
    const resp = await fetch(`${KV_BASE}/values/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
      signal: AbortSignal.timeout ? AbortSignal.timeout(5000) : undefined,
      next: { revalidate: 86400 }, // Cache for 24 hours
    });

    if (!resp.ok) {
      if (resp.status === 404) return null;
      recordFailure();
      return null;
    }

    recordSuccess();
    return await resp.text();
  } catch {
    recordFailure();
    return null;
  }
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DtcVehicleEntry {
  id: string;
  make: string;
  year: number;
  model: string;
}

export interface DtcCrossVehicleDetail {
  code: string;
  vehicleCount: number;
  systems: string[];
  contentHashes: string[];
  sampleTitles: string[];
  vehicles: DtcVehicleEntry[];
}

export interface DtcCrossVehicleSummary {
  /** Number of vehicles with OEM manual coverage for this code */
  n: number;
  /** Top systems where this code appears */
  sys: string[];
  /** Top makes affected */
  makes: Array<{ make: string; count: number }>;
  /** Year range [min, max] */
  yr: [number, number] | null;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Get detailed cross-vehicle data for a specific DTC code.
 * Returns the full list of vehicles with OEM manual coverage.
 */
export async function getDtcCrossVehicleDetail(code: string): Promise<DtcCrossVehicleDetail | null> {
  const raw = await kvGet(`dtc:${code.toUpperCase()}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DtcCrossVehicleDetail;
  } catch {
    return null;
  }
}

/**
 * Get compact summary for a DTC code (vehicle count, top makes, year range).
 * Looks up the individual dtc:{CODE} key first (small, cacheable),
 * then falls back to the per-prefix shard (under 1MB each).
 * Never fetches the full 3.1MB dtc:summary — too large for Next.js cache.
 */
export async function getDtcCrossVehicleSummary(code: string): Promise<DtcCrossVehicleSummary | null> {
  const upperCode = code.toUpperCase();

  // Try individual code key first — small and cacheable
  const detailRaw = await kvGet(`dtc:${upperCode}`);
  if (detailRaw) {
    try {
      const detail = JSON.parse(detailRaw) as DtcCrossVehicleDetail;
      // Build a summary from the detail
      const makeCounts: Record<string, number> = {};
      let minYear = 9999;
      let maxYear = 0;
      for (const v of detail.vehicles) {
        makeCounts[v.make] = (makeCounts[v.make] || 0) + 1;
        if (v.year < minYear) minYear = v.year;
        if (v.year > maxYear) maxYear = v.year;
      }
      return {
        n: detail.vehicleCount,
        sys: detail.systems.slice(0, 3),
        makes: Object.entries(makeCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([make, count]) => ({ make, count })),
        yr: minYear < 9999 ? [minYear, maxYear] : null,
      };
    } catch {
      // fall through
    }
  }

  // Try prefix shard (B, P, C, or U — each under 1MB)
  const prefix = upperCode.charAt(0);
  const shardRaw = await kvGet(`dtc:summary:${prefix}`);
  if (shardRaw) {
    try {
      const shard = JSON.parse(shardRaw) as Record<string, DtcCrossVehicleSummary>;
      return shard[upperCode] ?? null;
    } catch {
      // fall through
    }
  }

  return null;
}

/**
 * Format a cross-vehicle summary for display.
 * Returns a human-readable string like "Found in OEM manuals for 47 vehicles (1998-2013)"
 */
export function formatDtcCoverage(summary: DtcCrossVehicleSummary): string {
  const parts: string[] = [];
  parts.push(`Found in OEM manuals for ${summary.n} vehicle${summary.n === 1 ? '' : 's'}`);
  if (summary.yr) {
    parts[0] += ` (${summary.yr[0]}–${summary.yr[1]})`;
  }
  return parts.join('. ');
}

/**
 * Get the top makes affected by a DTC code, formatted for display.
 */
export function getTopMakesDisplay(summary: DtcCrossVehicleSummary, limit: number = 5): string {
  return summary.makes
    .slice(0, limit)
    .map((m) => m.make)
    .join(', ');
}
