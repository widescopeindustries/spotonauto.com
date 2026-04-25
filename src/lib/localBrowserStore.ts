import { SubscriptionTier } from '@/types';
import type { User } from '@/types';

const LOCAL_USER_KEY = 'spotonauto-local-user-v1';

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function readLocalJson<T>(key: string, fallback: T): T {
  if (!canUseStorage()) return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeLocalJson(key: string, value: unknown): void {
  if (!canUseStorage()) return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Best-effort persistence only.
  }
}

export function removeLocalJson(key: string): void {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(key);
}

function makeLocalUserId(email: string): string {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return `local_${Math.random().toString(36).slice(2, 10)}`;
  return `local_${btoa(normalized).replace(/=+/g, '').replace(/[^a-z0-9]/gi, '').slice(0, 18)}`;
}

export function loadLocalUser(): User | null {
  const user = readLocalJson<User | null>(LOCAL_USER_KEY, null);
  if (!user) return null;
  if (!user.id || !user.email || !user.tier) return null;
  return user;
}

export function saveLocalUser(input: { email: string; tier?: SubscriptionTier }): User {
  const user: User = {
    id: makeLocalUserId(input.email),
    email: input.email.trim(),
    tier: (input.tier ?? SubscriptionTier.Free) as SubscriptionTier,
  };
  writeLocalJson(LOCAL_USER_KEY, user);
  return user;
}

export function clearLocalUser(): void {
  removeLocalJson(LOCAL_USER_KEY);
}

export function hasLocalStorage(): boolean {
  return canUseStorage();
}
