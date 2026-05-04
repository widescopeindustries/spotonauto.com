/**
 * Content cleaner for LEMON / CHARM manual archive pages.
 * Strips navigation chrome, rewrites internal image URLs, and normalizes whitespace.
 */

const IMAGE_BASE_DEFAULT = process.env.MANUAL_IMAGE_BASE_URL || '';

export interface CleanedContent {
  /** Human-readable title extracted from the raw content header */
  title: string;
  /** Clean body text with normalized whitespace */
  body: string;
  /** List of image references found in the content */
  images: ImageReference[];
  /** Estimated word count */
  wordCount: number;
}

export interface ImageReference {
  /** Original URL as found in the source */
  originalUrl: string;
  /** Rewritten public URL if a base is configured */
  publicUrl: string;
  /** Alt text or context if available */
  context: string;
}

const BRANDING_PATTERNS = [
  /LEMON Manuals: Repair Knowledge Reimagined/gi,
  /~\s*LEMON Manuals/gi,
  / scientia non olet · About LEMON Manuals/gi,
  // Breadcrumbs: Home >> Make >> Year >> Model >> System >> Section
  /Home\s*>>\s*[\w\s().,%-]+(?:\s*>>\s*[\w\s().,%-]+)*/gi,
  /You are viewing the "split tree" of links[\s\S]*?Collapse All/gi,
  /Expand All \(for easy ctrl-f\)/gi,
  /Collapse All/gi,
  /View "full tree" with all links on one page[\s\S]*?but easier to use ctrl-f\)/gi,
];

const LEADING_JUNK_PATTERNS = [
  // Strip the entire nav prefix: "Title — YYYY Make Model Service Manual : Title"
  /^\s*(?:Repair and Diagnosis\s*[:—]\s*)?[A-Za-z][A-Za-z0-9\s&\-/]+?\s*—\s*\d{4}\s+[A-Za-z]+\s+[A-Za-z0-9\s().,%-]+?\s+Service Manual\s*[:—\-]?\s*/i,
];

function rewriteImageUrl(url: string): string {
  if (!IMAGE_BASE_DEFAULT) return url;
  // Replace 127.0.0.1:8080 or localhost references with the public image base
  return url.replace(/^https?:\/\/127\.0\.0\.1:\d+/, IMAGE_BASE_DEFAULT).replace(/^https?:\/\/localhost:\d+/, IMAGE_BASE_DEFAULT);
}

function extractImages(text: string): { images: ImageReference[]; textWithoutImages: string } {
  const images: ImageReference[] = [];
  const imageRegex = /\[IMAGE:\s*(https?:\/\/[^\]]+)\]/gi;
  let match: RegExpExecArray | null;

  while ((match = imageRegex.exec(text)) !== null) {
    const originalUrl = match[1].trim();
    images.push({
      originalUrl,
      publicUrl: rewriteImageUrl(originalUrl),
      context: '',
    });
  }

  const textWithoutImages = text.replace(imageRegex, '');
  return { images, textWithoutImages };
}

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

function extractTitle(text: string): string {
  // Try to find a title like "Repair and Diagnosis: Description and Operation"
  // Match at the very start of the content
  const titleMatch = text.match(/^([A-Za-z][A-Za-z0-9\s&\-/]+?:\s*[A-Za-z][A-Za-z0-9\s&\-/]+?)\s*—/);
  if (titleMatch) return titleMatch[1].trim();

  // Also try simple "Title —" pattern
  const simpleMatch = text.match(/^([A-Za-z][A-Za-z0-9\s&\-/]+?)\s*—/);
  if (simpleMatch) return simpleMatch[1].trim();

  // Fallback: first reasonable line
  const firstLine = text.split('\n')[0]?.trim() || '';
  if (firstLine.length > 3 && firstLine.length < 120) return firstLine;
  return 'Manual Section';
}

/**
 * Clean raw manual archive HTML/text into readable Markdown-like plain text.
 */
export function cleanManualContent(raw: string, knownTitle?: string): CleanedContent {
  if (!raw || !raw.trim()) {
    return { title: knownTitle || 'Empty Section', body: '', images: [], wordCount: 0 };
  }

  let text = raw;

  // Extract images before we strip brackets
  const { images, textWithoutImages } = extractImages(text);
  text = textWithoutImages;

  // Strip branding and navigation
  text = stripBranding(text);
  text = stripLeadingJunk(text);

  // Normalize whitespace
  text = normalizeWhitespace(text);

  // Extract title from cleaned text, or fall back to known title
  const title = knownTitle && knownTitle.length > 0 ? knownTitle : extractTitle(text);

  // Remove title duplication if it appears again at the start (with or without "Repair and Diagnosis:")
  const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const titleRegex = new RegExp(`^(?:Repair and Diagnosis:?\\s*)?${escapedTitle}\\s*[—:]?\\s*`, 'i');
  text = text.replace(titleRegex, '');
  // Also remove "Repair and Diagnosis: Title" if title itself doesn't include that prefix
  if (!title.toLowerCase().startsWith('repair and diagnosis')) {
    const prefixRegex = new RegExp(`^Repair and Diagnosis:?\\s*${escapedTitle}\\s*[—:]?\\s*`, 'i');
    text = text.replace(prefixRegex, '');
  }

  // Final cleanup
  text = normalizeWhitespace(text);

  const wordCount = text.split(/\s+/).filter((w) => w.length > 0).length;

  return {
    title,
    body: text,
    images,
    wordCount,
  };
}

/**
 * Format a cleaned section for MCP text output.
 */
export function formatSectionForMcp(
  section: {
    path: string;
    make: string;
    year: number;
    model: string;
    source: string;
    sectionTitle: string;
    contentFull?: string;
    contentPreview: string;
  },
  options: { includeImages?: boolean } = {}
): string {
  const raw = section.contentFull || section.contentPreview;
  const cleaned = cleanManualContent(raw, section.sectionTitle);

  let output = `# ${cleaned.title}\n`;
  output += `Vehicle: ${section.year} ${section.make} ${section.model}\n`;
  output += `Source: ${section.source}\n`;
  output += `Path: ${section.path}\n`;
  if (cleaned.wordCount > 0) {
    output += `Word count: ~${cleaned.wordCount}\n`;
  }
  output += `\n${cleaned.body}\n`;

  if (options.includeImages && cleaned.images.length > 0) {
    output += `\n## Images (${cleaned.images.length})\n`;
    for (const img of cleaned.images) {
      output += `- ${img.publicUrl}\n`;
    }
  }

  return output;
}
