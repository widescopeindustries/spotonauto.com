import { CHARM_ARCHIVE_BASE } from '@/lib/charmBase';

// ─── Factory Manual Archive HTML Parser ───────────────────────────────────────
// Parses HTML responses from the cached manual archive into structured data
// for the /manual/* browser route.

const CHARM_BASE = CHARM_ARCHIVE_BASE;
const CHARM_IMAGE_BASE = CHARM_BASE;
const DIRECT_CHARM_FALLBACK_BASE = 'https://charm.li';
const CHARM_ORIGINS = Array.from(new Set([CHARM_BASE, DIRECT_CHARM_FALLBACK_BASE]));

const FETCH_TIMEOUT_MS = 8000;
const FETCH_RETRIES = 1;
const RETRY_DELAY_MS = 250;

function buildFetchOpts(): RequestInit {
  return {
    headers: { 'User-Agent': 'SpotOnAuto/1.0 (+https://spotonauto.com) repair-guide-builder' },
    signal: typeof AbortSignal !== 'undefined' && AbortSignal.timeout
      ? AbortSignal.timeout(FETCH_TIMEOUT_MS)
      : undefined,
    // Prevent stale cached 404s from pinning valid manual pages as missing.
    cache: 'no-store',
  };
}

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface CharmLink {
  /** Display text */
  label: string;
  /** Relative href (already decoded) for building /manual/... links */
  href: string;
  /** Whether this is a folder-only node (has children but no direct link) */
  isFolder: boolean;
  /** Nested children (for folder groupings like "Camry" → engine variants) */
  children?: CharmLink[];
}

export interface CharmPage {
  /** Page title extracted from <h1> */
  title: string;
  /** Whether this is a navigation page (has link lists) or a content page */
  isNavigation: boolean;
  /** Links for navigation pages */
  links: CharmLink[];
  /** Raw HTML content for content/leaf pages (sanitized, with rewritten URLs) */
  contentHtml: string;
  /** HTTP status from upstream */
  status: number;
}

function sanitizeCharmBrandingText(text: string): string {
  return text
    .replace(/Operation\s+CHARM/gi, '')
    .replace(/charm\.li/gi, '')
    .replace(/\(\s*\)/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[\s:,-]+|[\s:,-]+$/g, '')
    .trim();
}

// ─── Fetch ─────────────────────────────────────────────────────────────────────

/**
 * Fetch a page from the CHARM LMDB proxy.
 * @param pathSegments - decoded path segments from Next.js catch-all route
 * @returns Parsed CharmPage
 */
export async function fetchCharmPage(
  pathSegments: string[] = [],
  options: { allowParentRecovery?: boolean } = {},
): Promise<CharmPage> {
  const { allowParentRecovery = true } = options;
  // Re-encode each segment for the upstream URL
  const encodedPath = pathSegments.map((s) => encodeCharmPathSegment(s)).join('/');
  let sawNotFound = false;
  let sawNonNotFoundFailure = false;
  let lastStatus = 504;

  // Try the cached proxy first, then direct CHARM as a resilient fallback.
  for (const origin of CHARM_ORIGINS) {
    const url = `${origin}/${encodedPath}${encodedPath ? '/' : ''}`;

    for (let attempt = 0; attempt <= FETCH_RETRIES; attempt += 1) {
      try {
        const res = await fetch(url, buildFetchOpts());

        if (res.ok) {
          const html = await res.text();
          return parseCharmHtml(html, pathSegments);
        }

        lastStatus = res.status;
        if (res.status === 404) {
          if (pathSegments.length >= 3) {
            console.warn(`[manual] upstream 404 for ${url} (path=${pathSegments.join(' / ')})`);
          }
          sawNotFound = true;
          break;
        }

        sawNonNotFoundFailure = true;

        if (attempt === FETCH_RETRIES) {
          console.warn(`[manual] upstream returned ${res.status} for ${url}`);
        }
      } catch (error) {
        sawNonNotFoundFailure = true;
        if (attempt === FETCH_RETRIES) {
          console.warn(`[manual] fetch failed for ${url}`, error);
          lastStatus = 504;
        }
      }

      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }

  // Recovery path:
  // if the leaf URL 404s due encoding/variant drift, fetch the parent page,
  // resolve the canonical child href, and retry once using that href.
  if (allowParentRecovery && sawNotFound && pathSegments.length >= 3) {
    const recovered = await recoverFromParentNavigation(pathSegments);
    if (recovered) {
      console.warn(`[manual] recovered via parent navigation (path=${pathSegments.join(' / ')})`);
      return recovered;
    }
    console.warn(`[manual] parent recovery failed (path=${pathSegments.join(' / ')})`);
  }

  // Treat as true 404 only when every attempted origin resolved as 404.
  // If at least one origin had a non-404 failure (timeout/5xx/403), surface
  // a temporary error instead of a false "not found" page.
  if (sawNotFound && !sawNonNotFoundFailure) {
    return {
      title: 'Page Not Found',
      isNavigation: false,
      links: [],
      contentHtml: '',
      status: 404,
    };
  }

  return {
    title: 'Manual Temporarily Unavailable',
    isNavigation: false,
    links: [],
    contentHtml: '',
    status: lastStatus,
  };
}

function normalizeLookupText(value: string): string {
  return safeDecodeUriComponent(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function flattenLinks(links: CharmLink[]): CharmLink[] {
  const out: CharmLink[] = [];
  for (const link of links) {
    if (link.href) out.push(link);
    if (link.children && link.children.length > 0) {
      out.push(...flattenLinks(link.children));
    }
  }
  return out;
}

async function recoverFromParentNavigation(pathSegments: string[]): Promise<CharmPage | null> {
  const parentSegments = pathSegments.slice(0, -1);
  const requestedLeaf = normalizeLookupText(pathSegments[pathSegments.length - 1] ?? '');
  if (!requestedLeaf) return null;

  const parentPage = await fetchCharmPage(parentSegments, { allowParentRecovery: false });
  if (parentPage.status !== 200 || !parentPage.isNavigation || parentPage.links.length === 0) {
    return null;
  }

  const candidates = flattenLinks(parentPage.links).filter((link) => link.href.startsWith('/manual/'));
  if (candidates.length === 0) return null;

  let bestMatch: CharmLink | null = null;
  let bestScore = 0;

  for (const candidate of candidates) {
    const labelNorm = normalizeLookupText(candidate.label);
    if (!labelNorm) continue;

    let score = 0;
    if (labelNorm === requestedLeaf) score = 100;
    else if (labelNorm.includes(requestedLeaf) || requestedLeaf.includes(labelNorm)) score = 80;
    else {
      const requestedTokens = requestedLeaf.split(' ').filter(Boolean);
      const overlap = requestedTokens.filter((token) => token.length > 1 && labelNorm.includes(token)).length;
      if (overlap > 0) score = 50 + overlap;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = candidate;
    }
  }

  if (!bestMatch || bestScore < 70) {
    return null;
  }

  const recoveredSegments = bestMatch.href
    .replace(/^\/manual\//, '')
    .split('/')
    .filter(Boolean)
    .map((segment) => safeDecodeUriComponent(segment));

  if (recoveredSegments.length === 0) return null;

  const recoveredPage = await fetchCharmPage(recoveredSegments, { allowParentRecovery: false });
  return recoveredPage.status === 200 ? recoveredPage : null;
}

// ─── Parser ────────────────────────────────────────────────────────────────────

function parseCharmHtml(html: string, pathSegments: string[]): CharmPage {
  // Extract <h1> title
  const titleMatch = html.match(/<h1>([\s\S]*?)<\/h1>/i);
  const rawTitle = titleMatch ? sanitizeCharmBrandingText(stripTags(titleMatch[1]).trim()) : 'Service Manual';

  // Extract main div content
  const mainMatch = html.match(/<div\s+class=['"]main['"]\s*>([\s\S]*?)<\/div>\s*\n?\s*<div\s+class/i);
  const mainContent = mainMatch ? mainMatch[1] : '';

  // Determine if this is a navigation page (has a <ul> with <a href=...> links)
  // vs a content page (has actual text, images, tables but no link tree)
  const hasLinkList = /<ul>[\s\S]*?<a\s+href=/i.test(mainContent);
  const hasContentBeyondLinks = hasSubstantiveContent(mainContent);

  if (hasLinkList && !hasContentBeyondLinks) {
    // Navigation page — parse the link tree
    const links = parseLinkTree(mainContent, pathSegments);
    return {
      title: rawTitle,
      isNavigation: true,
      links,
      contentHtml: '',
      status: 200,
    };
  }

  // Content/leaf page — sanitize and rewrite HTML
  const contentHtml = sanitizeContentHtml(mainContent, pathSegments);
  return {
    title: rawTitle,
    isNavigation: false,
    links: [],
    contentHtml,
    status: 200,
  };
}

/**
 * Detect whether the main content has substantive text/images beyond just a link tree.
 * Content pages have <h2>, <h3>, <p>, <table>, <img> tags with actual text.
 */
function hasSubstantiveContent(html: string): boolean {
  // Remove the <ul>...</ul> blocks and buttons, then check what's left
  const withoutLists = html
    .replace(/<button[^>]*>[\s\S]*?<\/button>/gi, '')
    .replace(/<h1>[\s\S]*?<\/h1>/gi, '')
    .replace(/<ul[\s\S]*?<\/ul>/gi, '');

  const textContent = stripTags(withoutLists).trim();
  // If there's meaningful text content or images outside of lists, it's a content page
  const hasImages = /<img\s/i.test(withoutLists);
  const hasTables = /<table/i.test(withoutLists);
  const hasHeadings = /<h[2-6]/i.test(withoutLists);

  return textContent.length > 50 || hasImages || hasTables || hasHeadings;
}

// ─── Link Tree Parser ──────────────────────────────────────────────────────────

function parseLinkTree(html: string, parentSegments: string[]): CharmLink[] {
  const links: CharmLink[] = [];
  // Match top-level <li> items. The HTML is not well-formed so we parse carefully.
  // Pattern: <li...><a href='...' name='...'>Label</a> or <li...>Label<ul>...children...</ul>

  // Simple regex-based parser for the flat/nested link structure
  // Split by <li to get individual items at the current nesting level
  const items = splitListItems(html);

  for (const item of items) {
    const parsed = parseListItem(item, parentSegments);
    if (parsed) {
      links.push(parsed);
    }
  }

  return links;
}

/**
 * Split HTML into top-level <li> items, respecting nesting.
 * CHARM HTML uses <li> without closing </li> tags, so items are implicitly
 * delimited by the next <li> at the same <ul> nesting depth.
 */
function splitListItems(html: string): string[] {
  const items: string[] = [];
  // Find the first <ul> and extract its content
  const ulMatch = html.match(/<ul>([\s\S]*)<\/ul>/i);
  if (!ulMatch) return items;

  const content = ulMatch[1];
  let ulDepth = 0; // tracks nested <ul> depth (0 = top level)
  let currentItem = '';
  let inItem = false;

  const tagRegex = /<(\/?)(ul|li)(?:\s[^>]*)?\s*>/gi;
  let lastIndex = 0;
  let match;

  while ((match = tagRegex.exec(content)) !== null) {
    const fullTag = match[0];
    const isClosing = match[1] === '/';
    const tagName = match[2].toLowerCase();
    const beforeTag = content.slice(lastIndex, match.index);

    if (tagName === 'li' && !isClosing) {
      if (ulDepth === 0) {
        // New top-level <li> — flush previous item
        if (inItem && currentItem) {
          items.push(currentItem);
        }
        currentItem = beforeTag + fullTag;
        inItem = true;
      } else {
        // Nested <li> inside a sub-<ul> — append to current item
        currentItem += beforeTag + fullTag;
      }
    } else if (tagName === 'li' && isClosing) {
      // Optional </li> — just append (doesn't affect splitting logic)
      if (inItem) currentItem += beforeTag + fullTag;
    } else if (tagName === 'ul' && !isClosing) {
      if (inItem) currentItem += beforeTag + fullTag;
      ulDepth++;
    } else if (tagName === 'ul' && isClosing) {
      ulDepth = Math.max(0, ulDepth - 1);
      if (inItem) currentItem += beforeTag + fullTag;
    }

    lastIndex = match.index + fullTag.length;
  }

  // Remaining text after the last tag
  if (inItem) {
    currentItem += content.slice(lastIndex);
    items.push(currentItem);
  }

  return items;
}

function parseListItem(itemHtml: string, parentSegments: string[]): CharmLink | null {
  // Check for a direct link: <a href='...'>Label</a>
  const linkMatch = itemHtml.match(/<a\s+href='([^']*)'[^>]*>([^<]*)<\/a>/i)
    || itemHtml.match(/<a\s+href="([^"]*)"[^>]*>([^<]*)<\/a>/i);

  // Check for a folder-only node: <a name='...'>Label</a> (no href, just name)
  const folderMatch = itemHtml.match(/<a\s+name='([^']*)'[^>]*>([^<]*)<\/a>/i)
    || itemHtml.match(/<a\s+name="([^"]*)"[^>]*>([^<]*)<\/a>/i);

  // Check for nested <ul> children
  const nestedUlMatch = itemHtml.match(/<ul>([\s\S]*)<\/ul>/i);

  if (linkMatch) {
    const [, rawHref, label] = linkMatch;
    const href = normalizeCharmHref(rawHref, parentSegments);

    const result: CharmLink = {
      label: sanitizeCharmBrandingText(decodeHtmlEntities(label.trim())),
      href,
      isFolder: false,
    };

    // If there are also nested children, parse them
    if (nestedUlMatch) {
      const childItems = splitListItems(`<ul>${nestedUlMatch[1]}</ul>`);
      const children: CharmLink[] = [];
      for (const child of childItems) {
        const parsed = parseListItem(child, parentSegments);
        if (parsed) children.push(parsed);
      }
      if (children.length > 0) {
        result.children = children;
      }
    }

    return result;
  }

  if (folderMatch) {
    const [, , label] = folderMatch;

    const result: CharmLink = {
      label: sanitizeCharmBrandingText(decodeHtmlEntities(label.trim())),
      href: '',
      isFolder: true,
    };

    if (nestedUlMatch) {
      const childItems = splitListItems(`<ul>${nestedUlMatch[1]}</ul>`);
      const children: CharmLink[] = [];
      for (const child of childItems) {
        const parsed = parseListItem(child, parentSegments);
        if (parsed) children.push(parsed);
      }
      if (children.length > 0) {
        result.children = children;
      }
    }

    return result;
  }

  // Plain text label followed by nested list (e.g., "Camry<ul>...")
  const textLabelMatch = itemHtml.match(/^<li[^>]*>\s*([^<]+)/i);
  if (textLabelMatch && nestedUlMatch) {
    const label = textLabelMatch[1].trim();
    if (!label) return null;

    const result: CharmLink = {
      label: sanitizeCharmBrandingText(decodeHtmlEntities(label)),
      href: '',
      isFolder: true,
    };

    const childItems = splitListItems(`<ul>${nestedUlMatch[1]}</ul>`);
    const children: CharmLink[] = [];
    for (const child of childItems) {
      const parsed = parseListItem(child, parentSegments);
      if (parsed) children.push(parsed);
    }
    if (children.length > 0) {
      result.children = children;
    }

    return result;
  }

  return null;
}

/**
 * Convert a charm.li relative href to a /manual/... absolute path.
 * Handles both relative (e.g., 'Toyota/') and absolute (e.g., '/Toyota/2010/...') hrefs.
 */
function normalizeCharmHref(href: string, parentSegments: string[]): string {
  if (!href) return '';

  // Remove trailing slash for clean URLs
  let cleanHref = href.replace(/\/$/, '');

  if (cleanHref.startsWith('/')) {
    // Absolute path from CHARM root — decode and rebuild
    const segments = cleanHref.split('/').filter(Boolean).map(safeDecodeUriComponent);
    return '/manual/' + segments.map(s => encodeURIComponent(s)).join('/');
  }

  // Relative path — prepend parent segments
  const relativeSegments = cleanHref.split('/').filter(Boolean).map(safeDecodeUriComponent);
  const fullSegments = [...parentSegments.map(safeDecodeUriComponent), ...relativeSegments];
  return '/manual/' + fullSegments.map(s => encodeURIComponent(s)).join('/');
}

// ─── Content Sanitizer ─────────────────────────────────────────────────────────

function sanitizeContentHtml(html: string, pathSegments: string[]): string {
  let sanitized = html;

  // Remove <h1> (we render our own)
  sanitized = sanitized.replace(/<h1>[\s\S]*?<\/h1>/gi, '');

  // Remove expand/collapse buttons
  sanitized = sanitized.replace(/<button[^>]*id=['"](?:expand|collapse)-all['"][^>]*>[\s\S]*?<\/button>/gi, '');

  // Remove <script> and <style> tags
  sanitized = sanitized.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  sanitized = sanitized.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

  // Strip Operation CHARM branding text
  sanitized = sanitized.replace(/Operation\s+CHARM/gi, '');
  sanitized = sanitized.replace(/charm\.li/gi, '');

  // Rewrite image src to use absolute URLs from the data server
  sanitized = sanitized.replace(
    /(<img[^>]+src=['"])\/([^'"]+)(['"][^>]*>)/gi,
    `$1${CHARM_IMAGE_BASE}/$2$3`
  );

  // Rewrite internal links to /manual/... paths
  sanitized = sanitized.replace(
    /(<a[^>]+href=['"])([^'"#][^'"]*?)(['"][^>]*>)/gi,
    (_match, prefix, href, suffix) => {
      // Skip external links and anchor-only links
      if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:')) {
        return `${prefix}${href}${suffix}`;
      }
      const newHref = normalizeCharmHref(href, pathSegments);
      return `${prefix}${newHref}${suffix}`;
    }
  );

  // Remove empty list items and stray tags
  sanitized = sanitized.replace(/<li>\s*<\/li>/gi, '');

  return sanitized.trim();
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, '');
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_m, code) => String.fromCharCode(Number(code)));
}

function safeDecodeUriComponent(value: string): string {
  let decoded = value;
  for (let i = 0; i < 2; i += 1) {
    if (!/%[0-9a-fA-F]{2}/.test(decoded)) break;
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    } catch {
      break;
    }
  }
  return decoded;
}

function encodeCharmPathSegment(value: string): string {
  // Accept either already-encoded or decoded path segments.
  return encodeURIComponent(safeDecodeUriComponent(value))
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29');
}

// ─── Breadcrumb Builder ────────────────────────────────────────────────────────

export interface Breadcrumb {
  label: string;
  href: string;
}

export function buildBreadcrumbs(pathSegments: string[]): Breadcrumb[] {
  const crumbs: Breadcrumb[] = [
    { label: 'Home', href: '/' },
    { label: 'Service Manuals', href: '/manual' },
  ];

  for (let i = 0; i < pathSegments.length; i++) {
    const segment = sanitizeCharmBrandingText(safeDecodeUriComponent(pathSegments[i]));
    const href = '/manual/' + pathSegments.slice(0, i + 1).map(s => encodeURIComponent(safeDecodeUriComponent(s))).join('/');
    crumbs.push({ label: segment, href });
  }

  return crumbs;
}

// ─── SEO Helpers ───────────────────────────────────────────────────────────────

export function buildManualTitle(pathSegments: string[]): string {
  if (pathSegments.length === 0) {
    return 'Factory Service Manuals | 1982-2013 | SpotOnAuto';
  }

  const decoded = pathSegments.map(s => sanitizeCharmBrandingText(safeDecodeUriComponent(s)));
  const last = decoded[decoded.length - 1];

  if (pathSegments.length === 1) {
    return `${last} Service Manuals | SpotOnAuto`;
  }

  if (pathSegments.length === 2) {
    return `${decoded[1]} ${decoded[0]} Service Manuals | SpotOnAuto`;
  }

  // Deeper paths: show last segment + vehicle context
  const vehicle = decoded.slice(0, 3).join(' ');
  return `${last} - ${vehicle} Service Manual | SpotOnAuto`;
}

export function buildManualDescription(pathSegments: string[]): string {
  if (pathSegments.length === 0) {
    return 'Browse free factory service manuals for 82 makes of cars and trucks (1982-2013). Includes repair procedures, torque specs, wiring diagrams, and TSBs.';
  }

  const decoded = pathSegments.map(s => sanitizeCharmBrandingText(safeDecodeUriComponent(s)));

  if (pathSegments.length === 1) {
    return `Free ${decoded[0]} factory service manuals. Browse repair procedures, wiring diagrams, torque specs, and diagnostic information for all ${decoded[0]} models (1982-2013).`;
  }

  if (pathSegments.length === 2) {
    return `Free ${decoded[1]} ${decoded[0]} factory service manual. Repair procedures, torque specs, wiring diagrams, and diagnostic information.`;
  }

  const vehicle = decoded.slice(0, 3).join(' ');
  return `${decoded[decoded.length - 1]} for the ${vehicle}. Factory service manual with repair procedures, torque specs, and diagnostic information.`;
}
