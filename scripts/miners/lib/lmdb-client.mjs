/**
 * Shared LMDB backend client for corpus miners.
 * All fetch operations go through here.
 */

const LMDB_BASE = process.env.LMDB_BASE || 'http://127.0.0.1:8080';
const DEFAULT_TIMEOUT = 15000;

export async function fetchPage(urlPath, opts = {}) {
  const url = LMDB_BASE + urlPath;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'alloemmanuals.com/1.0 corpus-miner' },
      signal: AbortSignal.timeout(opts.timeout || DEFAULT_TIMEOUT),
    });
    if (!res.ok) return null;
    return await res.text();
  } catch (err) {
    if (opts.verbose) console.error('Fetch error:', url, err.message);
    return null;
  }
}

export function encodePath(s) {
  return encodeURIComponent(s).replace(/%2C/g, ',').replace(/%20/g, '%20');
}

/**
 * Generic HTML table parser.
 * Returns array of row objects keyed by header text.
 */
export function parseTable(html, opts = {}) {
  const rows = [];
  const tableMatch = html.match(/<table[^>]*>([\s\S]*?)<\/table>/i);
  if (!tableMatch) return rows;
  const tableHtml = tableMatch[1];

  // Extract headers
  const headers = [];
  const headerRegex = /<th[^>]*>([\s\S]*?)<\/th>/gi;
  let hm;
  while ((hm = headerRegex.exec(tableHtml)) !== null) {
    const text = cleanCell(hm[1]);
    headers.push(text);
  }

  const hasTh = headers.length > 0;

  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch;
  let rowIndex = 0;
  while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
    const rowHtml = rowMatch[1];
    const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
    const cells = [];
    let cm;
    while ((cm = cellRegex.exec(rowHtml)) !== null) {
      cells.push(cleanCell(cm[1]));
    }

    if (cells.length === 0) continue;

    // If no <th>, use first row as headers
    if (!hasTh && rowIndex === 0) {
      cells.forEach(c => headers.push(c));
      rowIndex++;
      continue;
    }

    // Skip rows that look like headers
    const firstCell = cells[0]?.toLowerCase() || '';
    const skipWords = ['fluid type', 'operation', 'code', 'component', 'torque'];
    if (skipWords.some(w => firstCell.includes(w)) && rowIndex < 3) {
      rowIndex++;
      continue;
    }

    const obj = {};
    for (let i = 0; i < Math.max(cells.length, headers.length); i++) {
      const key = headers[i] || `col${i}`;
      obj[key] = cells[i] || '';
    }
    rows.push(obj);
    rowIndex++;
  }

  return rows;
}

function cleanCell(html) {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Discover models for a given make/year from the LMDB index.
 */
export async function discoverModels(make, year) {
  const path = '/' + encodePath(make) + '/' + year + '/';
  const html = await fetchPage(path);
  if (!html) return [];

  const models = [];
  const regex = /<a\s+href=["']\/[^"\/]+\/\d+\/([^"']+)["'][^>]*>([^<]+)<\/a>/gi;
  let m;
  while ((m = regex.exec(html)) !== null) {
    const modelPath = decodeURIComponent(m[1]).replace(/\/$/, '');
    const text = m[2].trim();
    if (text && !text.toLowerCase().includes('download') && !text.toLowerCase().includes('.zip')) {
      models.push({ name: modelPath, display: text });
    }
  }
  return models;
}

/**
 * Discover years for a given make.
 */
export async function discoverYears(make) {
  const path = '/' + encodePath(make) + '/';
  const html = await fetchPage(path);
  if (!html) return [];

  const years = [];
  const regex = /<a\s+href=["']\/[^"\/]+\/(\d+)\/["'][^>]*>\d+<\/a>/gi;
  let m;
  while ((m = regex.exec(html)) !== null) {
    years.push(parseInt(m[1], 10));
  }
  return [...new Set(years)].sort((a, b) => a - b);
}

/**
 * Run tasks with limited concurrency.
 */
export async function runBatch(items, concurrency, fn) {
  const results = [];
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const i = index++;
      try {
        const r = await fn(items[i], i);
        results[i] = r;
      } catch (err) {
        results[i] = err;
      }
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);
  return results;
}
