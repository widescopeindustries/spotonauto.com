function normalizeDate(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : null;
}

/**
 * Build-time/request-time sitemap freshness helper.
 * Falls back to "today" unless SITEMAP_LAST_MOD is pinned in the environment.
 */
export function getSitemapLastMod(): string {
  const envValue = normalizeDate(process.env.SITEMAP_LAST_MOD);
  if (envValue) return envValue;
  return new Date().toISOString().slice(0, 10);
}
