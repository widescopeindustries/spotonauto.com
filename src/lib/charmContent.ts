import 'server-only';
import { CHARM_ARCHIVE_BASE, CHARM_RAW_CONTENT_BASE } from '@/lib/charmBase';

/**
 * Fetch OEM content by content hash from the raw HTML store.
 *
 * Content is stored on R2 as html/{hash}.html, or can be fetched
 * from the VPS raw-html directory via a lightweight proxy.
 * Falls back gracefully when content isn't available yet.
 */

const CONTENT_BASE = CHARM_RAW_CONTENT_BASE;
const IMAGE_BASE = CHARM_ARCHIVE_BASE;
const R2_PUBLIC_BASE = process.env.R2_PUBLIC_BASE ?? '';

// Circuit breaker
let failures = 0;
let openUntil = 0;
const FAILURE_THRESHOLD = 3;
const COOLDOWN_MS = 3 * 60 * 1000;

function isOpen(): boolean {
  if (failures >= FAILURE_THRESHOLD && Date.now() < openUntil) return true;
  if (Date.now() >= openUntil) failures = 0;
  return false;
}

function recordFailure(): void {
  failures++;
  if (failures >= FAILURE_THRESHOLD) openUntil = Date.now() + COOLDOWN_MS;
}

function recordSuccess(): void {
  failures = 0;
  openUntil = 0;
}

export interface ContentPage {
  html: string;
  title: string;
  status: number;
}

/**
 * Sanitize raw CHARM HTML for rendering on our site.
 * Strips chrome, rewrites image URLs, removes scripts.
 */
function sanitizeHtml(raw: string): string {
  return raw
    // Remove scripts and styles
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    // Rewrite image src to our proxy
    .replace(/src='\/images\//g, `src='${IMAGE_BASE}/images/`)
    .replace(/src="\/images\//g, `src="${IMAGE_BASE}/images/`)
    // Rewrite internal hyperlinks to our manual route
    .replace(/href='\/hyperlink\//g, "href='/manual/")
    .replace(/href="\/hyperlink\//g, 'href="/manual/')
    // Strip CHARM branding elements
    .replace(/<div[^>]*class=['"]?breadcrumbs['"]?[^>]*>[\s\S]*?<\/div>/gi, '')
    .replace(/<button[\s\S]*?<\/button>/gi, '');
}

/**
 * Extract title from HTML content.
 */
function extractTitle(html: string): string {
  const match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (match) {
    return match[1].replace(/<[^>]+>/g, '').trim();
  }
  return '';
}

/**
 * Fetch OEM content page by its content hash.
 * Tries R2 first (if configured), falls back to VPS raw-html proxy.
 */
export async function fetchContentByHash(hash: string): Promise<ContentPage> {
  if (isOpen()) {
    return { html: '', title: '', status: 503 };
  }

  // Validate hash format (64 hex chars)
  if (!/^[a-f0-9]{64}$/.test(hash)) {
    return { html: '', title: '', status: 400 };
  }

  // Try R2 first if configured
  if (R2_PUBLIC_BASE) {
    try {
      const r2Url = `${R2_PUBLIC_BASE}/html/${hash}.html`;
      const res = await fetch(r2Url, {
        signal: AbortSignal.timeout ? AbortSignal.timeout(5000) : undefined,
        next: { revalidate: 86400 },
      });
      if (res.ok) {
        recordSuccess();
        const raw = await res.text();
        const html = sanitizeHtml(raw);
        return { html, title: extractTitle(raw), status: 200 };
      }
    } catch {
      // Fall through to VPS
    }
  }

  // Fall back to VPS raw-html proxy (nginx serves /content/{hash} from disk)
  try {
    const vpsUrl = `${CONTENT_BASE}/content/${hash}`;
    const res = await fetch(vpsUrl, {
      signal: AbortSignal.timeout ? AbortSignal.timeout(2500) : undefined, // Reduce to 2.5s
      next: { revalidate: 86400 },
    });
    if (res.ok) {
      recordSuccess();
      const raw = await res.text();
      const html = sanitizeHtml(raw);
      return { html, title: extractTitle(raw), status: 200 };
    }
    recordFailure();
    return { html: '', title: '', status: res.status };
  } catch (e) {
    recordFailure();
    console.error(`VPS content fetch failed for ${hash}: ${e instanceof Error ? e.message : String(e)}`);
    return { html: '', title: '', status: 503 };
  }
}

/**
 * Extract DTC codes mentioned in HTML content.
 * Returns unique codes found in the text.
 */
export function extractDtcCodes(html: string): string[] {
  const plain = html.replace(/<[^>]+>/g, ' ');
  const matches = plain.match(/\b[BPCU]\d{4}\b/g);
  if (!matches) return [];
  return [...new Set(matches)].sort();
}

/**
 * Extract entity references from a diagnostic step for graph linking.
 * Looks for connectors, fuses, sensors, components mentioned in text.
 */
export function extractStepEntities(stepText: string): Array<{
  type: 'connector' | 'fuse' | 'sensor' | 'component' | 'location';
  label: string;
  searchTerms: string[];
}> {
  const entities: Array<{
    type: 'connector' | 'fuse' | 'sensor' | 'component' | 'location';
    label: string;
    searchTerms: string[];
  }> = [];

  // Connectors: C205, C101, etc.
  const connectors = stepText.match(/\b[Cc]onnector\s+[A-Z]?\d{2,4}\b/g)
    ?? stepText.match(/\b[A-Z]\d{3,4}\b/g) ?? [];
  for (const c of connectors) {
    entities.push({ type: 'connector', label: c, searchTerms: [c.toLowerCase(), 'connector', 'location'] });
  }

  // Fuses: Fuse 23, F23, FUSE #12
  const fuses = stepText.match(/\b[Ff]use\s*#?\s*\d{1,3}\b/g)
    ?? stepText.match(/\bF\d{1,3}\b/g) ?? [];
  for (const f of fuses) {
    entities.push({ type: 'fuse', label: f, searchTerms: [f.toLowerCase(), 'fuse', 'relay', 'location'] });
  }

  // Sensors: O2 sensor, MAF sensor, etc.
  const sensors = stepText.match(/\b\w+\s+sensor\b/gi) ?? [];
  for (const s of sensors) {
    entities.push({ type: 'sensor', label: s, searchTerms: [s.toLowerCase(), 'location', 'testing'] });
  }

  return entities;
}
