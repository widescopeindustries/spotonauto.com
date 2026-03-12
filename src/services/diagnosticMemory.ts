import type { Vehicle } from '@/types';

const DIAGNOSTIC_SESSIONS_KEY = 'spoton-diagnostic-sessions-v1';
const DIAGNOSTIC_DRAFT_KEY = 'spoton-diagnostic-draft-v1';
const MAX_STORED_SESSIONS = 8;

export interface StoredDiagnosticMessage {
  id: string;
  type: 'system' | 'user';
  text: string;
  imageUrl?: string | null;
}

export interface DiagnosticSessionSnapshot {
  id: string;
  vehicle: Vehicle;
  initialProblem: string;
  messages: StoredDiagnosticMessage[];
  history: any[];
  createdAt: string;
  updatedAt: string;
}

export interface DiagnosticDraftState {
  year: string;
  make: string;
  model: string;
  symptom: string;
  updatedAt: string;
}

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function normalizeVehicleKey(vehicle: Vehicle): string {
  return `${vehicle.year}|${vehicle.make}|${vehicle.model}`.trim().toLowerCase();
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseStorage()) return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  if (!canUseStorage()) return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Failed to persist ${key}:`, error);
  }
}

function isStoredMessage(value: unknown): value is StoredDiagnosticMessage {
  if (!value || typeof value !== 'object') return false;

  const message = value as StoredDiagnosticMessage;
  return (
    typeof message.id === 'string' &&
    (message.type === 'system' || message.type === 'user') &&
    typeof message.text === 'string'
  );
}

function isSessionSnapshot(value: unknown): value is DiagnosticSessionSnapshot {
  if (!value || typeof value !== 'object') return false;

  const snapshot = value as DiagnosticSessionSnapshot;
  return (
    typeof snapshot.id === 'string' &&
    !!snapshot.vehicle &&
    typeof snapshot.vehicle.year === 'string' &&
    typeof snapshot.vehicle.make === 'string' &&
    typeof snapshot.vehicle.model === 'string' &&
    Array.isArray(snapshot.messages) &&
    snapshot.messages.every(isStoredMessage) &&
    Array.isArray(snapshot.history) &&
    typeof snapshot.createdAt === 'string' &&
    typeof snapshot.updatedAt === 'string'
  );
}

function getAllSessions(): DiagnosticSessionSnapshot[] {
  const sessions = readJson<unknown[]>(DIAGNOSTIC_SESSIONS_KEY, []);
  return sessions.filter(isSessionSnapshot);
}

export function getLatestDiagnosticSession(): DiagnosticSessionSnapshot | null {
  return getAllSessions()[0] ?? null;
}

export function getDiagnosticSession(sessionId: string): DiagnosticSessionSnapshot | null {
  return getAllSessions().find((session) => session.id === sessionId) ?? null;
}

export function findLatestDiagnosticSessionForVehicle(vehicle: Vehicle): DiagnosticSessionSnapshot | null {
  const vehicleKey = normalizeVehicleKey(vehicle);
  return getAllSessions().find((session) => normalizeVehicleKey(session.vehicle) === vehicleKey) ?? null;
}

export function saveDiagnosticSession(snapshot: DiagnosticSessionSnapshot): void {
  const nextSessions = [
    snapshot,
    ...getAllSessions().filter((session) => session.id !== snapshot.id),
  ]
    .sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt))
    .slice(0, MAX_STORED_SESSIONS);

  writeJson(DIAGNOSTIC_SESSIONS_KEY, nextSessions);
}

export function deleteDiagnosticSession(sessionId: string): void {
  const nextSessions = getAllSessions().filter((session) => session.id !== sessionId);
  writeJson(DIAGNOSTIC_SESSIONS_KEY, nextSessions);
}

export function getDiagnosticDraft(): DiagnosticDraftState | null {
  const draft = readJson<DiagnosticDraftState | null>(DIAGNOSTIC_DRAFT_KEY, null);
  if (!draft) return null;

  if (
    typeof draft.year !== 'string' ||
    typeof draft.make !== 'string' ||
    typeof draft.model !== 'string' ||
    typeof draft.symptom !== 'string' ||
    typeof draft.updatedAt !== 'string'
  ) {
    return null;
  }

  return draft;
}

export function saveDiagnosticDraft(draft: Omit<DiagnosticDraftState, 'updatedAt'>): void {
  const hasContent = [draft.year, draft.make, draft.model, draft.symptom].some((value) => value.trim().length > 0);

  if (!hasContent) {
    clearDiagnosticDraft();
    return;
  }

  writeJson(DIAGNOSTIC_DRAFT_KEY, {
    ...draft,
    updatedAt: new Date().toISOString(),
  });
}

export function clearDiagnosticDraft(): void {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(DIAGNOSTIC_DRAFT_KEY);
}
