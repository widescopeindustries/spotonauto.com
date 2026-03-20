/**
 * SpotOn Auto - Internal Link Redirect Audit
 *
 * Crawls a seed set of pages, extracts internal links, and reports
 * any links that return redirects/errors instead of 200.
 *
 * Usage:
 *   node scripts/internal-link-audit.js
 *   node scripts/internal-link-audit.js --base https://spotonauto.com --max-links 600 --export
 */

const fs = require('fs');
const path = require('path');

function getArg(name, fallback = null) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return fallback;
  return process.argv[idx + 1] || fallback;
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

function fmtNum(n) {
  return Number(n || 0).toLocaleString();
}

function csvEscape(v) {
  const str = String(v ?? '');
  if (str.includes('"') || str.includes(',') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function extractLinks(html, baseUrl) {
  const out = [];
  const re = /<a[^>]+href=["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(html))) {
    const raw = m[1].trim();
    if (
      !raw ||
      raw.startsWith('#') ||
      raw.startsWith('mailto:') ||
      raw.startsWith('tel:') ||
      raw.startsWith('javascript:')
    ) {
      continue;
    }

    try {
      const u = new URL(raw, baseUrl);
      if (u.hostname === 'spotonauto.com' || u.hostname === 'www.spotonauto.com') {
        u.hash = '';
        out.push(u.toString());
      }
    } catch {
      // ignore malformed href
    }
  }
  return [...new Set(out)];
}

async function fetchHtml(url) {
  const res = await fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(10000),
    headers: { 'user-agent': 'SpotOnAuto-InternalLinkAudit/1.0' },
  });
  return res.text();
}

async function checkUrl(url) {
  try {
    let res = await fetch(url, {
      method: 'HEAD',
      redirect: 'manual',
      signal: AbortSignal.timeout(10000),
      headers: { 'user-agent': 'SpotOnAuto-InternalLinkAudit/1.0' },
    });

    if (res.status === 405) {
      res = await fetch(url, {
        method: 'GET',
        redirect: 'manual',
        signal: AbortSignal.timeout(10000),
        headers: { 'user-agent': 'SpotOnAuto-InternalLinkAudit/1.0' },
      });
    }

    return {
      url,
      status: res.status,
      location: res.headers.get('location') || '',
    };
  } catch (err) {
    return {
      url,
      status: 'ERR',
      location: String(err.message || err),
    };
  }
}

async function main() {
  const base = getArg('base', 'https://spotonauto.com');
  const maxLinks = Number(getArg('max-links', '600'));
  const shouldExport = hasFlag('export');

  const seed = [
    `${base}/`,
    `${base}/repairs`,
    `${base}/tools`,
    `${base}/codes`,
    `${base}/guides`,
    `${base}/community`,
    `${base}/wiring`,
  ];

  const recrawlPath = path.join(__dirname, 'seo-reports', 'recrawl-priority-2026-02-28.txt');
  if (fs.existsSync(recrawlPath)) {
    const extra = fs
      .readFileSync(recrawlPath, 'utf8')
      .split('\n')
      .map(x => x.trim())
      .filter(Boolean)
      .slice(0, 50);
    seed.push(...extra);
  }

  const discovered = new Set();
  const seedFailures = [];
  for (const page of [...new Set(seed)]) {
    try {
      const html = await fetchHtml(page);
      for (const link of extractLinks(html, page)) {
        discovered.add(link);
      }
    } catch (err) {
      seedFailures.push({
        page,
        error: String(err.message || err),
      });
    }
  }

  if (discovered.size === 0 && seedFailures.length > 0) {
    console.error('\nSeed fetch failures prevented internal link discovery:\n');
    for (const failure of seedFailures.slice(0, 20)) {
      console.error(`  ${failure.page} :: ${failure.error}`);
    }
    process.exit(1);
  }

  const links = [...discovered].slice(0, maxLinks);
  const queue = [...links];
  const results = [];
  const concurrency = 30;

  const workers = Array.from({ length: concurrency }, async () => {
    while (queue.length) {
      const link = queue.pop();
      results.push(await checkUrl(link));
    }
  });
  await Promise.all(workers);

  const counts = results.reduce((acc, row) => {
    acc[row.status] = (acc[row.status] || 0) + 1;
    return acc;
  }, {});

  const redirects = results.filter(r => [301, 302, 307, 308].includes(r.status));
  const errors = results.filter(r => ![200, 301, 302, 307, 308].includes(r.status));

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║            SpotOn Auto - Internal Link Redirect Audit       ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  console.log(`Base URL:          ${base}`);
  console.log(`Seed pages:        ${fmtNum([...new Set(seed)].length)}`);
  console.log(`Discovered links:  ${fmtNum(discovered.size)}`);
  console.log(`Checked links:     ${fmtNum(results.length)}\n`);

  if (seedFailures.length > 0) {
    console.log(`Seed fetch errors: ${fmtNum(seedFailures.length)}\n`);
  }

  console.log('Status counts:');
  for (const [status, count] of Object.entries(counts).sort((a, b) => String(a[0]).localeCompare(String(b[0])))) {
    console.log(`  ${String(status).padEnd(4)} ${fmtNum(count)}`);
  }

  console.log('\nRedirecting internal links:\n');
  if (!redirects.length) {
    console.log('  None');
  } else {
    for (const r of redirects.slice(0, 100)) {
      console.log(`  ${r.status} ${r.url} -> ${r.location}`);
    }
  }

  console.log('\nNon-200/non-redirect links:\n');
  if (!errors.length) {
    console.log('  None');
  } else {
    for (const r of errors.slice(0, 100)) {
      console.log(`  ${r.status} ${r.url} :: ${r.location}`);
    }
  }

  if (shouldExport) {
    const outDir = path.join(__dirname, 'seo-reports');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const today = new Date().toISOString().slice(0, 10);
    const outPath = path.join(outDir, `internal-link-audit-${today}.csv`);
    const lines = [
      'url,status,location',
      ...results.map(r => [csvEscape(r.url), csvEscape(r.status), csvEscape(r.location)].join(',')),
    ];
    fs.writeFileSync(outPath, lines.join('\n'));
    console.log(`\nExported CSV: ${outPath}`);
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
