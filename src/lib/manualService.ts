/**
 * Shared manual service — bridges the Next.js app with the manual-api database.
 */

import {
  getSectionByPath,
  getChildSections,
  searchManualEmbeddings,
  type ManualSectionMatchRow,
} from './manualEmbeddingsStore';

export {
  searchManualEmbeddings,
  getSectionByPath,
  getChildSections,
} from './manualEmbeddingsStore';

export type { ManualSectionMatchRow } from './manualEmbeddingsStore';

import {
  fetchCharmPage,
  type CharmPage,
  type CharmLink,
} from './charmParser';

// ─── Content cleaning ────────────────────────────────────────────────────────

const BRANDING_PATTERNS = [
  /LEMON Manuals: Repair Knowledge Reimagined/gi,
  /~\s*LEMON Manuals/gi,
  / scientia non olet · About LEMON Manuals/gi,
  /Home\s*>>\s*[\w\s().,%-]+(?:\s*>>\s*[\w\s().,%-]+)*/gi,
  /You are viewing the "split tree" of links[\s\S]*?Collapse All/gi,
  /Expand All \(for easy ctrl-f\)/gi,
  /Collapse All/gi,
  /View "full tree" with all links on one page[\s\S]*?but easier to use ctrl-f\)/gi,
];

const LEADING_JUNK_PATTERNS = [
  /^\s*(?:Repair and Diagnosis\s*[:—])?[A-Za-z][A-Za-z0-9\s&\-/]+?\s*—\s*\d{4}\s+[A-Za-z]+\s+[A-Za-z0-9\s().,%-]+?\s+Service Manual\s*[:—\-]?\s*/i,
];

function stripBranding(text: string): string {
  for (const pattern of BRANDING_PATTERNS) {
    text = text.replace(pattern, '');
  }
  return text;
}

function stripLeadingJunk(text: string): string {
  for (const pattern of LEADING_JUNK_PATTERNS) {
    text = text.replace(pattern, '');
  }
  return text;
}

function normalizeWhitespace(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function cleanManualContent(raw: string, knownTitle?: string): { title: string; body: string } {
  if (!raw || !raw.trim()) {
    return { title: knownTitle || 'Empty Section', body: '' };
  }

  let text = raw;
  text = stripBranding(text);
  text = stripLeadingJunk(text);
  text = normalizeWhitespace(text);

  const title = knownTitle && knownTitle.length > 0
    ? knownTitle
    : (text.match(/^([A-Za-z][A-Za-z0-9\s&\-/]+?:\s*[A-Za-z][A-Za-z0-9\s&\-/]+?)\s*—/)?.[1] ||
       text.match(/^([A-Za-z][A-Za-z0-9\s&\-/]+?)\s*—/)?.[1] ||
       text.split('\n')[0]?.trim() ||
       'Manual Section');

  const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  text = text.replace(new RegExp(`^(?:Repair and Diagnosis:?\\s*)?${escapedTitle}\\s*[—:]?\\s*`, 'i'), '');
  if (!title.toLowerCase().startsWith('repair and diagnosis')) {
    text = text.replace(new RegExp(`^Repair and Diagnosis:?\\s*${escapedTitle}\\s*[—:]?\\s*`, 'i'), '');
  }

  text = normalizeWhitespace(text);
  return { title, body: text };
}

function textToSimpleHtml(text: string): string {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  return paragraphs
    .map((p) => {
      if (p.startsWith('CAUTION:') || p.startsWith('WARNING:') || p.startsWith('NOTE:')) {
        return `<p class="manual-caution"><strong>${p.split(':')[0]}:</strong>${p.slice(p.indexOf(':') + 1)}</p>`;
      }
      if (/^[A-Z][A-Za-z0-9\s&\-/:]+$/.test(p) && p.length < 120) {
        return `<h3 class="manual-heading">${p}</h3>`;
      }
      return `<p>${p.replace(/\n/g, '<br/>')}</p>`;
    })
    .join('\n');
}

function sectionToCharmLink(section: { path: string; sectionTitle: string }): CharmLink {
  const segments = section.path.split('/').filter(Boolean);
  const href = '/manual/' + segments.map((s) => encodeURIComponent(s)).join('/');
  return {
    label: section.sectionTitle || segments[segments.length - 1] || 'Untitled',
    href,
    isFolder: false,
  };
}

// ─── Fetch with DB fallback ──────────────────────────────────────────────────

export async function fetchManualPage(
  pathSegments: string[] = [],
  options: { allowParentRecovery?: boolean } = {},
): Promise<CharmPage> {
  const dbPath = '/' + pathSegments.map((s) => encodeURIComponent(s)).join('/');

  const dbSection = await getSectionByPath(dbPath).catch(() => null);

  if (dbSection) {
    const children = await getChildSections(dbPath).catch(() => []);

    if (children.length > 0) {
      return {
        title: dbSection.sectionTitle,
        isNavigation: true,
        links: children.map(sectionToCharmLink),
        contentHtml: '',
        status: 200,
      };
    }

    const cleaned = cleanManualContent(
      dbSection.contentFull || dbSection.contentPreview || '',
      dbSection.sectionTitle,
    );

    return {
      title: cleaned.title,
      isNavigation: false,
      links: [],
      contentHtml: textToSimpleHtml(cleaned.body),
      status: 200,
    };
  }

  return fetchCharmPage(pathSegments, options);
}
