import profilesJson from '@/data/vehicle-repair-profiles.json';
import { slugifyRoutePart } from '@/data/vehicles';
import { getLocalPool } from './manualEmbeddingsStore';

export interface GeneratedSupportNote {
  eyebrow: string;
  title: string;
  intro: string;
  bullets: string[];
  tone: 'cyan' | 'emerald' | 'amber' | 'violet';
}

export interface GeneratedFAQ {
  question: string;
  answer: string;
}

export interface GeneratedPart {
  name: string;
  partNumber?: string;
  quantity?: string;
  notes?: string;
}

export interface GeneratedTool {
  name: string;
  size?: string;
  notes?: string;
}

export interface GeneratedTorqueSpec {
  component: string;
  value: string;
  notes?: string;
}

export interface GeneratedAffiliateLinks {
  parts?: {
    amazon?: string;
  };
  tools?: {
    amazon?: string;
  };
}

export interface GeneratedRepairProfile {
  titleSuffix?: string;
  descriptionSuffix?: string;
  extraKeywords?: string[];
  supportNote?: GeneratedSupportNote;
  faq?: GeneratedFAQ;
  faqs?: GeneratedFAQ[];
  partsNeeded?: GeneratedPart[];
  toolsNeeded?: GeneratedTool[];
  torqueSpecs?: GeneratedTorqueSpec[];
  affiliateLinks?: GeneratedAffiliateLinks;
}

interface StoredProfile {
  key: string;
  year: number;
  make: string;
  model: string;
  task: string;
  profile: GeneratedRepairProfile;
}

const PROFILE_MAP = new Map<string, GeneratedRepairProfile>();

// Arrays for nearest-match lookups
let ALL_PROFILES: StoredProfile[] = [];
let MODEL_INDEX = new Map<string, StoredProfile[]>(); // "make:model" -> profiles
let TASK_INDEX = new Map<string, StoredProfile[]>();  // "make:model:task" -> profiles

function buildIndexes(): void {
  if (ALL_PROFILES.length > 0) return;
  for (const entry of (profilesJson.profiles as StoredProfile[])) {
    if (entry?.key && entry?.profile) {
      ALL_PROFILES.push(entry);
      PROFILE_MAP.set(entry.key, entry.profile);
      const mm = `${slugifyRoutePart(entry.make)}:${slugifyRoutePart(entry.model)}`;
      const mmt = `${mm}:${slugifyRoutePart(entry.task)}`;
      if (!MODEL_INDEX.has(mm)) MODEL_INDEX.set(mm, []);
      MODEL_INDEX.get(mm)!.push(entry);
      if (!TASK_INDEX.has(mmt)) TASK_INDEX.set(mmt, []);
      TASK_INDEX.get(mmt)!.push(entry);
    }
  }
}

export async function getGeneratedRepairProfile(
  year: string | number,
  make: string,
  model: string,
  task: string,
): Promise<GeneratedRepairProfile | null> {
  const sMake = slugifyRoutePart(make);
  const sModel = slugifyRoutePart(model);
  const sTask = slugifyRoutePart(task);
  const key = `${String(year)}:${sMake}:${sModel}:${sTask}`;

  // 1. Check PostgreSQL first
  const pool = getLocalPool();
  if (pool) {
    try {
      const { rows } = await pool.query(
        `SELECT profile FROM public.vehicle_repair_profiles WHERE key = $1`,
        [key],
      );
      if (rows && rows.length > 0) {
        return rows[0].profile as GeneratedRepairProfile;
      }
    } catch (e) {
      console.error(`Database error in getGeneratedRepairProfile:`, e);
    }
  }

  // 2. Fall back to static JSON
  buildIndexes();
  return PROFILE_MAP.get(key) || null;
}

export interface NearestMatch {
  profile: GeneratedRepairProfile;
  matchedYear: number;
  matchedMake: string;
  matchedModel: string;
  matchedTask: string;
  matchType: 'exact' | 'same-task-different-year' | 'same-model-different-task';
  yearDiff: number;
}

export async function findNearestRepairProfile(
  year: number,
  make: string,
  model: string,
  task: string,
): Promise<NearestMatch | null> {
  const sMake = slugifyRoutePart(make);
  const sModel = slugifyRoutePart(model);
  const sTask = slugifyRoutePart(task);

  // 1. Exact match
  const exact = await getGeneratedRepairProfile(year, make, model, task);
  if (exact) {
    return {
      profile: exact,
      matchedYear: year,
      matchedMake: sMake,
      matchedModel: sModel,
      matchedTask: sTask,
      matchType: 'exact',
      yearDiff: 0,
    };
  }

  // 2. Same make/model/task, closest year
  let dbClosestYear: { profile: GeneratedRepairProfile; year: number } | null = null;
  const pool = getLocalPool();
  if (pool) {
    try {
      const { rows } = await pool.query(
        `SELECT year, profile FROM public.vehicle_repair_profiles 
         WHERE LOWER(make) = LOWER($1) AND LOWER(model) = LOWER($2) AND LOWER(task) = LOWER($3)`,
        [sMake, sModel, sTask],
      );
      if (rows && rows.length > 0) {
        let minDiff = Math.abs(rows[0].year - year);
        let bestRow = rows[0];
        for (const row of rows) {
          const diff = Math.abs(row.year - year);
          if (diff < minDiff) {
            minDiff = diff;
            bestRow = row;
          }
        }
        dbClosestYear = { profile: bestRow.profile as GeneratedRepairProfile, year: bestRow.year };
      }
    } catch (e) {
      console.error(`Database error in findNearestRepairProfile (year lookup):`, e);
    }
  }

  buildIndexes();
  const taskKey = `${sMake}:${sModel}:${sTask}`;
  const sameTaskProfiles = TASK_INDEX.get(taskKey) || [];
  let staticClosestYear: StoredProfile | null = null;
  if (sameTaskProfiles.length > 0) {
    let minDiff = Math.abs(sameTaskProfiles[0].year - year);
    staticClosestYear = sameTaskProfiles[0];
    for (const p of sameTaskProfiles) {
      const diff = Math.abs(p.year - year);
      if (diff < minDiff) {
        minDiff = diff;
        staticClosestYear = p;
      }
    }
  }

  let bestClosestYear: { profile: GeneratedRepairProfile; year: number } | null = null;
  if (dbClosestYear && staticClosestYear) {
    const dbDiff = Math.abs(dbClosestYear.year - year);
    const staticDiff = Math.abs(staticClosestYear.year - year);
    bestClosestYear = dbDiff <= staticDiff ? dbClosestYear : { profile: staticClosestYear.profile, year: staticClosestYear.year };
  } else {
    bestClosestYear = dbClosestYear || (staticClosestYear ? { profile: staticClosestYear.profile, year: staticClosestYear.year } : null);
  }

  if (bestClosestYear) {
    return {
      profile: bestClosestYear.profile,
      matchedYear: bestClosestYear.year,
      matchedMake: sMake,
      matchedModel: sModel,
      matchedTask: sTask,
      matchType: 'same-task-different-year',
      yearDiff: Math.abs(bestClosestYear.year - year),
    };
  }

  // 3. Same make/model, any task (pick the one with most bullets/detail)
  const dbModelProfiles: { task: string; year: number; profile: GeneratedRepairProfile }[] = [];
  if (pool) {
    try {
      const { rows } = await pool.query(
        `SELECT task, year, profile FROM public.vehicle_repair_profiles 
         WHERE LOWER(make) = LOWER($1) AND LOWER(model) = LOWER($2)`,
        [sMake, sModel],
      );
      for (const row of rows) {
        dbModelProfiles.push({
          task: slugifyRoutePart(row.task),
          year: row.year,
          profile: row.profile as GeneratedRepairProfile,
        });
      }
    } catch (e) {
      console.error(`Database error in findNearestRepairProfile (model lookup):`, e);
    }
  }

  const staticModelProfiles = MODEL_INDEX.get(`${sMake}:${sModel}`) || [];
  const mergedModelProfiles = new Map<string, { task: string; year: number; profile: GeneratedRepairProfile }>();
  for (const p of staticModelProfiles) {
    mergedModelProfiles.set(`${p.year}:${slugifyRoutePart(p.task)}`, { task: slugifyRoutePart(p.task), year: p.year, profile: p.profile });
  }
  for (const p of dbModelProfiles) {
    mergedModelProfiles.set(`${p.year}:${p.task}`, p);
  }

  const allModelProfiles = Array.from(mergedModelProfiles.values());
  if (allModelProfiles.length > 0) {
    const taskFamily = sTask.split('-')[0];
    const familyMatch = allModelProfiles.find((p) => p.task.startsWith(taskFamily));
    if (familyMatch) {
      return {
        profile: familyMatch.profile,
        matchedYear: familyMatch.year,
        matchedMake: sMake,
        matchedModel: sModel,
        matchedTask: familyMatch.task,
        matchType: 'same-model-different-task',
        yearDiff: Math.abs(familyMatch.year - year),
      };
    }

    const best = allModelProfiles.reduce((a, b) => {
      const score = (p: typeof allModelProfiles[0]) =>
        (p.profile.supportNote?.bullets?.length || 0) +
        (p.profile.faqs?.length ? p.profile.faqs.length * 2 : (p.profile.faq ? 2 : 0)) +
        (p.profile.titleSuffix ? 1 : 0);
      return score(a) >= score(b) ? a : b;
    });

    return {
      profile: best.profile,
      matchedYear: best.year,
      matchedMake: sMake,
      matchedModel: sModel,
      matchedTask: best.task,
      matchType: 'same-model-different-task',
      yearDiff: Math.abs(best.year - year),
    };
  }

  return null;
}

export interface VehicleProfileEntry {
  year: number;
  make: string;
  model: string;
  task: string;
  profile: GeneratedRepairProfile;
}

export async function getProfilesForVehicle(
  year: string | number,
  make: string,
  model: string,
): Promise<VehicleProfileEntry[]> {
  const sMake = slugifyRoutePart(make);
  const sModel = slugifyRoutePart(model);
  const yearNum = typeof year === 'string' ? parseInt(year, 10) : year;

  const dbEntries: VehicleProfileEntry[] = [];

  // 1. Query PostgreSQL
  const pool = getLocalPool();
  if (pool) {
    try {
      const { rows } = await pool.query(
        `SELECT task, profile FROM public.vehicle_repair_profiles 
         WHERE year = $1 AND LOWER(make) = LOWER($2) AND LOWER(model) = LOWER($3)`,
        [yearNum, sMake, sModel],
      );
      for (const row of rows) {
        dbEntries.push({
          year: yearNum,
          make: sMake,
          model: sModel,
          task: slugifyRoutePart(row.task),
          profile: row.profile as GeneratedRepairProfile,
        });
      }
    } catch (e) {
      console.error(`Database error in getProfilesForVehicle:`, e);
    }
  }

  // 2. Fetch from static JSON fallback
  buildIndexes();
  const staticProfiles = MODEL_INDEX.get(`${sMake}:${sModel}`) || [];
  const staticEntries = staticProfiles
    .filter((p) => p.year === yearNum)
    .map((p) => ({
      year: p.year,
      make: sMake,
      model: sModel,
      task: slugifyRoutePart(p.task),
      profile: p.profile,
    }));

  const mergedMap = new Map<string, VehicleProfileEntry>();
  for (const entry of staticEntries) {
    mergedMap.set(entry.task, entry);
  }
  for (const entry of dbEntries) {
    mergedMap.set(entry.task, entry);
  }

  return Array.from(mergedMap.values()).sort((a, b) => (a.task > b.task ? 1 : -1));
}

export async function countGeneratedProfiles(): Promise<number> {
  let dbCount = 0;
  const pool = getLocalPool();
  if (pool) {
    try {
      const { rows } = await pool.query(
        `SELECT COUNT(*) FROM public.vehicle_repair_profiles`,
      );
      if (rows && rows.length > 0) {
        dbCount = parseInt(rows[0].count, 10);
      }
    } catch (e) {
      console.error(`Database error in countGeneratedProfiles:`, e);
    }
  }
  buildIndexes();
  return dbCount + PROFILE_MAP.size;
}
