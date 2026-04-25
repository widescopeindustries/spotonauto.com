const DEFAULT_CHARM_ARCHIVE_BASE =
  process.env.CHARM_ARCHIVE_BASE
  ?? process.env.GRAPH_BACKEND_BASE_URL
  ?? 'http://127.0.0.1:8080';
const DEFAULT_CHARM_RAW_CONTENT_BASE =
  process.env.GRAPH_BACKEND_BASE_URL
  ?? 'http://127.0.0.1:8080';

function normalizeBase(value: string): string {
  return value.replace(/\/+$/, '');
}

/**
 * Runtime archive navigation and image fetches should prefer the cached proxy.
 * Override with CHARM_ARCHIVE_BASE when needed.
 */
export const CHARM_ARCHIVE_BASE = normalizeBase(
  DEFAULT_CHARM_ARCHIVE_BASE,
);

/**
 * Hash-addressed raw HTML content is still served by the direct backend unless
 * a dedicated raw-content origin is configured.
 */
export const CHARM_RAW_CONTENT_BASE = normalizeBase(
  process.env.CHARM_RAW_CONTENT_BASE
    ?? process.env.CHARM_CONTENT_BASE
    ?? DEFAULT_CHARM_RAW_CONTENT_BASE,
);
