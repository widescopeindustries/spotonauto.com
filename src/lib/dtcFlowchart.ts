import type { LiveDtcFlowStep, LiveDtcFlowchart } from '@/types/dtc-flowchart';
import { findDiagnosticTroubleCodeIndexes } from '@/lib/manualEmbeddingsStore';

const CHARM_BASE = 'https://data.spotonauto.com';
const REQUEST_TIMEOUT_MS = 12000;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const MAX_CANDIDATES = 12;

const flowCache = new Map<string, { expiresAt: number; data: LiveDtcFlowchart | null }>();

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function decodeEntities(text: string): string {
  return text
    .replace(/&#09;/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&plusmn;/g, '±')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_m, num) => String.fromCharCode(Number(num)));
}

function extractMainHtml(html: string): string {
  const mainMatch =
    html.match(/<div\s+class=['"]main['"]\s*>([\s\S]*?)<\/div>\s*<div\s+class=['"]theme-colors footer['"]/i) ||
    html.match(/<div\s+class=['"]main['"]\s*>([\s\S]*?)<\/div>/i);
  return mainMatch?.[1] || '';
}

function htmlToLines(mainHtml: string): string[] {
  const withBreaks = mainHtml
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|li|div|h1|h2|h3|h4|h5|h6|ul|ol)>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n')
    .replace(/<span[^>]*>/gi, '')
    .replace(/<\/span>/gi, '');

  const noTags = withBreaks.replace(/<[^>]+>/g, ' ');
  const decoded = decodeEntities(noTags);

  return decoded
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function sectionText(lines: string[], startLabel: string, endLabels: string[]): string | undefined {
  const startIdx = lines.findIndex((line) => line.toLowerCase() === startLabel.toLowerCase());
  if (startIdx === -1) return undefined;

  let endIdx = lines.length;
  for (const label of endLabels) {
    const idx = lines.findIndex(
      (line, i) => i > startIdx && line.toLowerCase() === label.toLowerCase()
    );
    if (idx !== -1 && idx < endIdx) endIdx = idx;
  }

  const text = lines.slice(startIdx + 1, endIdx).join(' ').trim();
  return text || undefined;
}

function extractPossibleCauses(lines: string[]): string[] {
  const startIdx = lines.findIndex((line) => line.toLowerCase() === 'possible causes');
  if (startIdx === -1) return [];

  const endLabels = ['Diagnostic Test', 'Diagnostic Tests'];
  let endIdx = lines.length;
  for (const label of endLabels) {
    const idx = lines.findIndex(
      (line, i) => i > startIdx && line.toLowerCase() === label.toLowerCase()
    );
    if (idx !== -1 && idx < endIdx) endIdx = idx;
  }

  return lines
    .slice(startIdx + 1, endIdx)
    .map((line) => line.replace(/^-+\s*/, '').trim())
    .filter((line) => line.length > 0 && !/^always perform/i.test(line))
    .slice(0, 24);
}

function parseFlowSteps(lines: string[]): LiveDtcFlowStep[] {
  const diagIdx = lines.findIndex((line) => /^Diagnostic Test/i.test(line));
  const workflowIdx = lines.findIndex((line) =>
    /^(Work Flow|Trouble Diagnosis|Diagnostic Procedure|Inspection Procedure)/i.test(line)
  );

  let flowLines: string[] = [];
  if (diagIdx !== -1) {
    flowLines = lines.slice(diagIdx + 1);
  } else if (workflowIdx !== -1) {
    flowLines = lines.slice(workflowIdx + 1);
  } else {
    flowLines = lines;
  }

  const stepStartIndexes: number[] = [];

  for (let i = 0; i < flowLines.length; i++) {
    if (/^\d+\.\s*/.test(flowLines[i])) {
      stepStartIndexes.push(i);
    }
  }

  const steps: LiveDtcFlowStep[] = [];

  for (let i = 0; i < stepStartIndexes.length; i++) {
    const start = stepStartIndexes[i];
    const end = i + 1 < stepStartIndexes.length ? stepStartIndexes[i + 1] : flowLines.length;
    const segment = flowLines.slice(start, end).filter(Boolean);
    if (segment.length === 0) continue;

    const first = segment[0];
    const stepMatch = first.match(/^(\d+)\.\s*(.*)$/);
    if (!stepMatch) continue;

    const step = Number(stepMatch[1]);
    const title = (stepMatch[2] || '').trim() || `Step ${step}`;

    let question: string | undefined;
    for (let j = segment.length - 1; j >= 0; j--) {
      if (segment[j].endsWith('?')) {
        question = segment[j];
        break;
      }
    }

    const yesLine = segment.find((line) => /^Yes\b/i.test(line));
    const noLine = segment.find((line) => /^No\b/i.test(line));

    const yesAction = yesLine ? yesLine.replace(/^Yes\s*(?:>>|->|:)?\s*/i, '').trim() : undefined;
    const noAction = noLine ? noLine.replace(/^No\s*(?:>>|->|:)?\s*/i, '').trim() : undefined;

    const details = segment
      .slice(1)
      .filter((line) => line !== question && !/^Yes\s*>>/i.test(line) && !/^No\s*>>/i.test(line))
      .filter((line) => line.length > 0)
      .slice(0, 6);

    steps.push({
      step,
      title,
      question,
      yesAction,
      noAction,
      details,
    });
  }

  return steps.slice(0, 24);
}

function normalizePath(path: string): string {
  if (!path) return '/';
  const withLeadingSlash = path.startsWith('/') ? path : `/${path}`;
  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`;
}

function resolveHref(basePath: string, href: string): string {
  if (!href) return basePath;
  if (href.startsWith('http://') || href.startsWith('https://')) {
    return new URL(href).pathname;
  }
  const baseUrl = new URL(`${CHARM_BASE}${normalizePath(basePath)}`);
  const resolved = new URL(href, baseUrl);
  return resolved.pathname;
}

async function fetchHtml(path: string): Promise<string | null> {
  const url = `${CHARM_BASE}${normalizePath(path)}`;
  try {
    const resp = await fetch(url, {
      headers: { 'User-Agent': 'SpotOnAuto/1.0 (dtc-flowchart-loader)' },
      signal: typeof AbortSignal !== 'undefined' && AbortSignal.timeout
        ? AbortSignal.timeout(REQUEST_TIMEOUT_MS)
        : undefined,
      cache: 'no-store',
    });
    if (!resp.ok) return null;
    return await resp.text();
  } catch {
    return null;
  }
}

interface CandidateIndex {
  path: string;
  make: string;
  year: number;
  model: string;
}

async function findCandidateIndexes(code: string): Promise<CandidateIndex[]> {
  return findDiagnosticTroubleCodeIndexes(code, MAX_CANDIDATES);
}

function findCodeHref(indexHtml: string, code: string): string | null {
  const codeRegex = new RegExp(`href=['"]([^'"]*${escapeRegex(code)}[^'"]*/?)['"]`, 'i');
  const match = indexHtml.match(codeRegex);
  return match?.[1] || null;
}

function buildSourceVehicle(candidate: CandidateIndex): string {
  const year = candidate.year ? `${candidate.year}` : '';
  return [year, candidate.make, candidate.model].filter(Boolean).join(' ').trim();
}

function parseFlowchart(code: string, path: string, candidate: CandidateIndex, html: string): LiveDtcFlowchart | null {
  const mainHtml = extractMainHtml(html);
  if (!mainHtml) return null;

  const lines = htmlToLines(mainHtml);
  if (lines.length === 0) return null;

  const heading = lines[0] && !/^P\d{4}/i.test(lines[0]) ? lines[0] : undefined;
  const whenMonitored = sectionText(lines, 'When Monitored', ['Set Condition', 'Possible Causes', 'Diagnostic Test']);
  const setCondition = sectionText(lines, 'Set Condition', ['Possible Causes', 'Diagnostic Test']);
  const possibleCauses = extractPossibleCauses(lines);
  const steps = parseFlowSteps(lines);

  if (steps.length === 0) return null;

  return {
    code: code.toUpperCase(),
    heading,
    sourcePath: normalizePath(path),
    sourceUrl: `${CHARM_BASE}${normalizePath(path)}`,
    sourceVehicle: buildSourceVehicle(candidate),
    whenMonitored,
    setCondition,
    possibleCauses,
    steps,
  };
}

export async function fetchLiveDtcFlowchart(codeInput: string): Promise<LiveDtcFlowchart | null> {
  const code = codeInput.toUpperCase().trim();
  if (!/^[A-Z][0-9A-Z]{4}$/.test(code)) return null;

  const cached = flowCache.get(code);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  try {
    const candidates = await findCandidateIndexes(code);
    for (const candidate of candidates) {
      const indexPath = normalizePath(candidate.path);
      const indexHtml = await fetchHtml(indexPath);
      if (!indexHtml) continue;

      const codeHref = findCodeHref(indexHtml, code);
      if (!codeHref) continue;

      const codePath = resolveHref(indexPath, codeHref);
      const flowHtml = await fetchHtml(codePath);
      if (!flowHtml) continue;

      const parsed = parseFlowchart(code, codePath, candidate, flowHtml);
      if (!parsed) continue;

      flowCache.set(code, { data: parsed, expiresAt: Date.now() + CACHE_TTL_MS });
      return parsed;
    }
  } catch {
    // graceful fallback; caller handles null
  }

  flowCache.set(code, { data: null, expiresAt: Date.now() + 10 * 60 * 1000 });
  return null;
}
