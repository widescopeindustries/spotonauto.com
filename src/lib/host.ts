export const CANONICAL_HOST = 'spotonauto.com';
export const LEGACY_HOSTS = new Set(['www.spotonauto.com']);

export function normalizeHost(host: string | null | undefined): string {
  return (host ?? '').trim().toLowerCase().split(':')[0];
}

export function isCanonicalHost(host: string | null | undefined): boolean {
  return normalizeHost(host) === CANONICAL_HOST;
}

export function isLegacyRedirectHost(host: string | null | undefined): boolean {
  return LEGACY_HOSTS.has(normalizeHost(host));
}

export function isPreviewHost(host: string | null | undefined): boolean {
  const normalized = normalizeHost(host);
  return normalized.endsWith('.vercel.app');
}

export function isIndexableHost(host: string | null | undefined): boolean {
  return isCanonicalHost(host);
}
