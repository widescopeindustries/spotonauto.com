// ─── charm.li HTML Parser ──────────────────────────────────────────────────────
// Parses HTML responses from data.spotonauto.com (Operation CHARM LMDB proxy)
// into structured data for the /manual/* browser route.

const CHARM_BASE = process.env.CHARM_CONTENT_BASE ?? 'https://data.spotonauto.com';
const CHARM_IMAGE_BASE = CHARM_BASE;

// ─── Circuit Breaker ───────────────────────────────────────────────────────────
// When the VPS is down, every repair page waits for the full timeout before
// rendering.  The circuit breaker trips after FAILURE_THRESHOLD consecutive
// failures and skips the fetch entirely for COOLDOWN_MS, returning the fallback
// immediately (~0 ms instead of 15 s).
// ────────────────────────────────────────────────────────────────────────────────
const FAILURE_THRESHOLD = 2;   // trip after 2 consecutive failures
const COOLDOWN_MS = 5 * 60 * 1000; // stay open for 5 minutes before retrying
let circuitFailures = 0;
let circuitOpenUntil = 0;

function isCircuitOpen(): boolean {
  if (circuitFailures >= FAILURE_THRESHOLD && Date.now() < circuitOpenUntil) {
    return true; // skip fetch — VPS is known-down
  }
  if (Date.now() >= circuitOpenUntil) {
    circuitFailures = 0; // reset after cooldown — allow a retry
  }
  return false;
}

function recordFailure(): void {
  circuitFailures++;
  if (circuitFailures >= FAILURE_THRESHOLD) {
    circuitOpenUntil = Date.now() + COOLDOWN_MS;
  }
}

function recordSuccess(): void {
  circuitFailures = 0;
  circuitOpenUntil = 0;
}

const FETCH_TIMEOUT_MS = 3000; // 3s instead of 15s — fail fast

const FETCH_OPTS: RequestInit = {
  headers: { 'User-Agent': 'SpotOnAuto/1.0 (+https://spotonauto.com) repair-guide-builder' },
  signal: typeof AbortSignal !== 'undefined' && AbortSignal.timeout
    ? AbortSignal.timeout(FETCH_TIMEOUT_MS)
    : undefined,
};

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
export async function fetchCharmPage(pathSegments: string[] = []): Promise<CharmPage> {
  // ── Circuit breaker: skip fetch entirely when VPS is known-down ──
  if (isCircuitOpen()) {
    return {
      title: 'Manual Temporarily Unavailable',
      isNavigation: false,
      links: [],
      contentHtml: '',
      status: 503,
    };
  }

  // Re-encode each segment for the upstream URL
  const encodedPath = pathSegments.map(s => encodeURIComponent(s).replace(/\(/g, '%28').replace(/\)/g, '%29')).join('/');
  // Ensure trailing slash — the LMDB proxy requires it for directory listings
  const url = `${CHARM_BASE}/${encodedPath}${encodedPath ? '/' : ''}`;
  try {
    const res = await fetch(url, { ...FETCH_OPTS, next: { revalidate: 86400 } });

    if (!res.ok) {
      recordFailure();
      return {
        title: 'Page Not Found',
        isNavigation: false,
        links: [],
        contentHtml: '',
        status: res.status,
      };
    }

    const html = await res.text();
    recordSuccess();
    return parseCharmHtml(html, pathSegments);
  } catch {
    recordFailure();
    return {
      title: 'Manual Temporarily Unavailable',
      isNavigation: false,
      links: [],
      contentHtml: '',
      status: 504,
    };
  }
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
    const segments = cleanHref.split('/').filter(Boolean).map(s => decodeURIComponent(s));
    return '/manual/' + segments.map(s => encodeURIComponent(s)).join('/');
  }

  // Relative path — prepend parent segments
  const relativeSegments = cleanHref.split('/').filter(Boolean).map(s => decodeURIComponent(s));
  const fullSegments = [...parentSegments, ...relativeSegments];
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
    const segment = sanitizeCharmBrandingText(decodeURIComponent(pathSegments[i]));
    const href = '/manual/' + pathSegments.slice(0, i + 1).map(s => encodeURIComponent(s)).join('/');
    crumbs.push({ label: segment, href });
  }

  return crumbs;
}

// ─── SEO Helpers ───────────────────────────────────────────────────────────────

export function buildManualTitle(pathSegments: string[]): string {
  if (pathSegments.length === 0) {
    return 'Factory Service Manuals | 1982-2013 | SpotOnAuto';
  }

  const decoded = pathSegments.map(s => sanitizeCharmBrandingText(decodeURIComponent(s)));
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

  const decoded = pathSegments.map(s => sanitizeCharmBrandingText(decodeURIComponent(s)));

  if (pathSegments.length === 1) {
    return `Free ${decoded[0]} factory service manuals. Browse repair procedures, wiring diagrams, torque specs, and diagnostic information for all ${decoded[0]} models (1982-2013).`;
  }

  if (pathSegments.length === 2) {
    return `Free ${decoded[1]} ${decoded[0]} factory service manual. Repair procedures, torque specs, wiring diagrams, and diagnostic information.`;
  }

  const vehicle = decoded.slice(0, 3).join(' ');
  return `${decoded[decoded.length - 1]} for the ${vehicle}. Factory service manual with repair procedures, torque specs, and diagnostic information.`;
}
