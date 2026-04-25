import { RepairGuide, HistoryItem } from '../types';
import { hasLocalStorage, loadLocalUser, readLocalJson, writeLocalJson } from '@/lib/localBrowserStore';

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
  return {
    id: entry.guide.id,
    title: entry.guide.title,
    vehicle: entry.guide.vehicle,
    timestamp: entry.savedAt,
  };
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
