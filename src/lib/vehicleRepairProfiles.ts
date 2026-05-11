import profilesJson from '@/data/vehicle-repair-profiles.json';
import { slugifyRoutePart } from '@/data/vehicles';

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

export interface GeneratedRepairProfile {
  titleSuffix?: string;
  descriptionSuffix?: string;
  extraKeywords?: string[];
  supportNote?: GeneratedSupportNote;
  faq?: GeneratedFAQ;
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

export function getGeneratedRepairProfile(
  year: string | number,
  make: string,
  model: string,
  task: string,
): GeneratedRepairProfile | null {
  buildIndexes();
  const key = `${String(year)}:${slugifyRoutePart(make)}:${slugifyRoutePart(model)}:${slugifyRoutePart(task)}`;
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

export function findNearestRepairProfile(
  year: number,
  make: string,
  model: string,
  task: string,
): NearestMatch | null {
  buildIndexes();
  const sMake = slugifyRoutePart(make);
  const sModel = slugifyRoutePart(model);
  const sTask = slugifyRoutePart(task);

  // 1. Exact match
  const exact = getGeneratedRepairProfile(year, make, model, task);
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
  const taskKey = `${sMake}:${sModel}:${sTask}`;
  const sameTaskProfiles = TASK_INDEX.get(taskKey);
  if (sameTaskProfiles && sameTaskProfiles.length > 0) {
    let closest = sameTaskProfiles[0];
    let minDiff = Math.abs(sameTaskProfiles[0].year - year);
    for (const p of sameTaskProfiles) {
      const diff = Math.abs(p.year - year);
      if (diff < minDiff) {
        minDiff = diff;
        closest = p;
      }
    }
    return {
      profile: closest.profile,
      matchedYear: closest.year,
      matchedMake: sMake,
      matchedModel: sModel,
      matchedTask: sTask,
      matchType: 'same-task-different-year',
      yearDiff: minDiff,
    };
  }

  // 3. Same make/model, any task (pick the one with most bullets/detail)
  const modelKey = `${sMake}:${sModel}`;
  const sameModelProfiles = MODEL_INDEX.get(modelKey);
  if (sameModelProfiles && sameModelProfiles.length > 0) {
    // Prefer same task family (e.g., "battery-replacement" vs "battery" queries)
    const taskFamily = sTask.split('-')[0];
    const familyMatch = sameModelProfiles.find(p =>
      slugifyRoutePart(p.task).startsWith(taskFamily)
    );
    if (familyMatch) {
      return {
        profile: familyMatch.profile,
        matchedYear: familyMatch.year,
        matchedMake: sMake,
        matchedModel: sModel,
        matchedTask: slugifyRoutePart(familyMatch.task),
        matchType: 'same-model-different-task',
        yearDiff: Math.abs(familyMatch.year - year),
      };
    }
    // Otherwise pick the profile with the most content
    const best = sameModelProfiles.reduce((a, b) => {
      const score = (p: StoredProfile) =>
        (p.profile.supportNote?.bullets?.length || 0) +
        (p.profile.faq ? 2 : 0) +
        (p.profile.titleSuffix ? 1 : 0);
      return score(a) >= score(b) ? a : b;
    });
    return {
      profile: best.profile,
      matchedYear: best.year,
      matchedMake: sMake,
      matchedModel: sModel,
      matchedTask: slugifyRoutePart(best.task),
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

export function getProfilesForVehicle(
  year: string | number,
  make: string,
  model: string,
): VehicleProfileEntry[] {
  buildIndexes();
  const sMake = slugifyRoutePart(make);
  const sModel = slugifyRoutePart(model);
  const yearNum = typeof year === 'string' ? parseInt(year, 10) : year;

  const modelProfiles = MODEL_INDEX.get(`${sMake}:${sModel}`);
  if (!modelProfiles) return [];

  return modelProfiles
    .filter((p) => p.year === yearNum)
    .map((p) => ({
      year: p.year,
      make: sMake,
      model: sModel,
      task: slugifyRoutePart(p.task),
      profile: p.profile,
    }))
    .sort((a, b) => (a.task > b.task ? 1 : -1));
}

export function countGeneratedProfiles(): number {
  buildIndexes();
  return PROFILE_MAP.size;
}
