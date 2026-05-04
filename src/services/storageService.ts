import { RepairGuide, HistoryItem, GroundingSource } from '../types';
import { hasLocalStorage, loadLocalUser, readLocalJson, writeLocalJson } from '@/lib/localBrowserStore';

export interface SavedManualReference {
  uri: string;
  title: string;
  guideId: string;
  guideTitle: string;
  vehicle: string;
  savedAt: number;
}

function getHistoryKey(userId: string): string {
  return `spotonauto-history-v1:${userId}`;
}

interface StoredGuideEnvelope {
  guide: RepairGuide;
  savedAt: number;
}

function getStoredGuides(userId: string): StoredGuideEnvelope[] {
  return readLocalJson<StoredGuideEnvelope[]>(getHistoryKey(userId), []);
}

function saveStoredGuides(userId: string, items: StoredGuideEnvelope[]): void {
  writeLocalJson(getHistoryKey(userId), items.slice(0, 100));
}

function buildHistoryItem(entry: StoredGuideEnvelope): HistoryItem {
  const manualReferenceCount = (entry.guide.sources || []).filter(isManualSource).length;
  return {
    id: entry.guide.id,
    title: entry.guide.title,
    vehicle: entry.guide.vehicle,
    timestamp: entry.savedAt,
    manualReferenceCount,
  };
}

function isManualSource(source: GroundingSource): boolean {
  return source?.kind === 'manual' || Boolean(source?.uri?.includes('/manual/'));
}

export const getHistory = async (): Promise<HistoryItem[]> => {
  if (!hasLocalStorage()) return [];
  const user = loadLocalUser();
  if (!user) return [];

  return getStoredGuides(user.id)
    .map((entry) => buildHistoryItem(entry));
};

export const saveGuide = async (guide: RepairGuide): Promise<void> => {
  if (!hasLocalStorage()) return;
  const user = loadLocalUser();
  if (!user) return;

  const stored = getStoredGuides(user.id).filter((item) => item.guide.id !== guide.id);
  saveStoredGuides(user.id, [
    { guide, savedAt: Date.now() },
    ...stored,
  ]);
};

export const getGuideById = async (slugId: string): Promise<RepairGuide | null> => {
  if (!hasLocalStorage()) return null;
  const user = loadLocalUser();
  if (!user) return null;

  const entry = getStoredGuides(user.id).find((item) => item.guide.id === slugId);
  return entry?.guide ?? null;
};

export const getSavedManualReferences = async (): Promise<SavedManualReference[]> => {
  if (!hasLocalStorage()) return [];
  const user = loadLocalUser();
  if (!user) return [];

  const seen = new Set<string>();
  const references: SavedManualReference[] = [];

  for (const entry of getStoredGuides(user.id)) {
    for (const source of entry.guide.sources || []) {
      if (!isManualSource(source) || !source.uri) continue;
      const key = `${entry.guide.id}:${source.uri}`;
      if (seen.has(key)) continue;
      seen.add(key);
      references.push({
        uri: source.uri,
        title: source.title || 'Factory manual reference',
        guideId: entry.guide.id,
        guideTitle: entry.guide.title,
        vehicle: entry.guide.vehicle,
        savedAt: entry.savedAt,
      });
    }
  }

  return references;
};
