// Cloudflare KV has been retired from the runtime stack.
// Keep the public API shape so dependent code can continue to fall back
// gracefully while the KG server remains the single source of truth.

import { scoreVehicleModelMatch } from '@/lib/vehicleIdentity';

export interface KVContentEntry {
  hash: string;
  type: string;
  title: string;
}

export interface KVVehicleData {
  v: {
    id: string;
    make: string;
    year: number;
    model: string;
    variant: string;
    slug: string;
    makeSlug: string;
    modelSlug: string;
  };
  sc: number;
  cc: number;
  sys: Record<string, KVContentEntry[]>;
}

function noDataVehicle(make: string, year: number, model: string): KVVehicleData | null {
  if (!make || !year || !model) return null;
  return null;
}

export async function getVehicleFromKV(make: string, year: number, model: string): Promise<KVVehicleData | null> {
  return noDataVehicle(make, year, model);
}

export function findRelevantKVContent(
  sys: Record<string, KVContentEntry[]>,
  task: string,
): Array<{ system: string; entry: KVContentEntry }> {
  const taskLower = task.toLowerCase();
  const taskWords = taskLower.split(/\s+/).filter((w) => w.length > 3);
  const results: Array<{ system: string; entry: KVContentEntry; score: number }> = [];

  for (const [systemName, entries] of Object.entries(sys)) {
    for (const entry of entries) {
      const haystack = `${systemName} ${entry.type} ${entry.title}`.toLowerCase();
      const score = taskWords.reduce((sum, word) => sum + (haystack.includes(word) ? 1 : 0), 0);
      if (score > 0) {
        results.push({ system: systemName, entry, score });
      }
    }
  }

  return results
    .sort((a, b) => b.score - a.score || scoreVehicleModelMatch(a.entry.title, b.entry.title))
    .map(({ system, entry }) => ({ system, entry }));
}
