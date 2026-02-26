/**
 * NHTSA Service — Free public APIs, no key required.
 * Provides real recalls, complaints, and safety data per vehicle.
 * Always fails gracefully — never crashes the guide pipeline.
 */

export interface NHTSARecall {
  component: string;
  summary: string;
  consequence: string;
  remedy: string;
  reportReceivedDate: string;
  nhtsaCampaignNumber: string;
}

export interface NHTSAComplaintSummary {
  topIssues: string[];
  totalCount: number;
  mostCommonComponent: string | null;
}

export interface NHTSAData {
  recalls: NHTSARecall[];
  complaints: NHTSAComplaintSummary;
  hasActiveRecalls: boolean;
  fetchedAt: string;
}

// Simple in-memory cache — keyed by "year|make|model", 1hr TTL
const cache = new Map<string, { data: NHTSAData; ts: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000;

/** Normalize make/model for NHTSA API (uppercase, spaces → %20 handled by URL) */
function normalize(s: string): string {
  return s.trim().toUpperCase();
}

/** Build NHTSA-safe cache key */
function cacheKey(year: string, make: string, model: string): string {
  return `${year}|${normalize(make)}|${normalize(model)}`;
}

async function fetchRecalls(year: string, make: string, model: string): Promise<NHTSARecall[]> {
  try {
    const url = `https://api.nhtsa.gov/recalls/recallsByVehicle?make=${encodeURIComponent(normalize(make))}&model=${encodeURIComponent(normalize(model))}&modelYear=${encodeURIComponent(year)}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const json = await res.json();
    const results = json?.results ?? [];
    return results.map((r: any): NHTSARecall => ({
      component: r.Component ?? '',
      summary: r.Summary ?? '',
      consequence: r.Consequence ?? '',
      remedy: r.Remedy ?? '',
      reportReceivedDate: r.ReportReceivedDate ?? '',
      nhtsaCampaignNumber: r.NHTSACampaignNumber ?? '',
    }));
  } catch {
    return [];
  }
}

async function fetchComplaints(year: string, make: string, model: string): Promise<NHTSAComplaintSummary> {
  try {
    const url = `https://api.nhtsa.gov/complaints/complaintsByVehicle?make=${encodeURIComponent(normalize(make))}&model=${encodeURIComponent(normalize(model))}&modelYear=${encodeURIComponent(year)}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return { topIssues: [], totalCount: 0, mostCommonComponent: null };
    const json = await res.json();
    const results: any[] = json?.results ?? [];

    if (!results.length) return { topIssues: [], totalCount: 0, mostCommonComponent: null };

    // Count complaints by component
    const componentCounts: Record<string, number> = {};
    results.forEach(r => {
      const comp = r.components ?? r.component ?? 'Unknown';
      componentCounts[comp] = (componentCounts[comp] ?? 0) + 1;
    });

    const sorted = Object.entries(componentCounts).sort((a, b) => b[1] - a[1]);
    const topIssues = sorted.slice(0, 4).map(([comp, count]) => `${comp} (${count} complaints)`);
    const mostCommonComponent = sorted[0]?.[0] ?? null;

    return {
      topIssues,
      totalCount: results.length,
      mostCommonComponent,
    };
  } catch {
    return { topIssues: [], totalCount: 0, mostCommonComponent: null };
  }
}

/**
 * Main entry point — fetches both recalls and complaints in parallel.
 * Results are cached in memory for 1 hour per vehicle.
 */
export async function getVehicleNHTSAData(year: string, make: string, model: string): Promise<NHTSAData> {
  const key = cacheKey(year, make, model);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return cached.data;

  const [recalls, complaints] = await Promise.all([
    fetchRecalls(year, make, model),
    fetchComplaints(year, make, model),
  ]);

  const data: NHTSAData = {
    recalls,
    complaints,
    hasActiveRecalls: recalls.length > 0,
    fetchedAt: new Date().toISOString(),
  };

  cache.set(key, { data, ts: Date.now() });
  return data;
}

/** Format recalls as concise safety warning strings for AI prompts */
export function recallsToSafetyWarnings(recalls: NHTSARecall[]): string[] {
  return recalls.slice(0, 3).map(r =>
    `⚠️ ACTIVE RECALL (${r.nhtsaCampaignNumber}): ${r.component} — ${r.summary.slice(0, 200)}`
  );
}

/** Format NHTSA data as a compact context block for Gemini prompts */
export function nhtsaToPromptContext(data: NHTSAData): string {
  const lines: string[] = ['=== REAL NHTSA SAFETY DATA (use this, do not invent your own) ==='];

  if (data.recalls.length > 0) {
    lines.push(`\nACTIVE RECALLS (${data.recalls.length} total):`);
    data.recalls.slice(0, 5).forEach(r => {
      lines.push(`• [${r.nhtsaCampaignNumber}] ${r.component}: ${r.summary.slice(0, 300)}`);
      if (r.consequence) lines.push(`  Consequence: ${r.consequence.slice(0, 150)}`);
    });
  } else {
    lines.push('\nACTIVE RECALLS: None found for this vehicle.');
  }

  if (data.complaints.totalCount > 0) {
    lines.push(`\nNHTSA COMPLAINTS (${data.complaints.totalCount} total):`);
    data.complaints.topIssues.forEach(issue => lines.push(`• ${issue}`));
  }

  lines.push('\n=== END NHTSA DATA ===');
  return lines.join('\n');
}
