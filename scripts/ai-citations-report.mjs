#!/usr/bin/env node
/**
 * AI Citations & Affiliate Revenue Correlation Report
 *
 * Reads the latest ai-citations-audit JSON and produces a Markdown report
 * that clusters Bing AI Performance queries by intent, maps them to site URLs,
 * flags gaps, and estimates affiliate opportunity.
 *
 * Run:
 *   node scripts/ai-citations-report.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPORTS_DIR = path.join(__dirname, 'seo-reports');
const OUTPUT_DIR = path.join(__dirname, '..', 'reports');

const today = new Date().toISOString().slice(0, 10);

// Baseline Amazon affiliate metrics from AGENTS.md (Jan 01 – Jul 09 2026)
const AFFILIATE_BASELINE = {
  clicks: 928,
  orderedItems: 82,
  conversionRate: 8.84,
  orderedRevenue: 2872.48,
  totalEarnings: 106.33,
  revenuePerClick: 2872.48 / 928,
  earningsPerClick: 106.33 / 928,
  revenuePerOrder: 2872.48 / 82,
};

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function latestAuditFile() {
  if (!fs.existsSync(REPORTS_DIR)) return null;
  const files = fs
    .readdirSync(REPORTS_DIR)
    .filter((f) => f.startsWith('ai-citations-audit-') && f.endsWith('.json'))
    .sort()
    .reverse();
  return files[0] ? path.join(REPORTS_DIR, files[0]) : null;
}

function clusterQueries(results) {
  const clusters = {
    commercial: { label: 'Commercial / Parts Funnel', queries: [], totalCitations: 0 },
    maintenance: { label: 'Maintenance Specs (oil, coolant, fluids, tires)', queries: [], totalCitations: 0 },
    repair: { label: 'Repair Procedures', queries: [], totalCitations: 0 },
    diagnostic: { label: 'Diagnostic / DTC', queries: [], totalCitations: 0 },
    hub: { label: 'Hub / Generic', queries: [], totalCitations: 0 },
  };

  for (const r of results) {
    const q = r.query.toLowerCase();
    let cluster = 'hub';
    if (r.intent === 'Commercial' || /amazon|parts|buy/i.test(q)) {
      cluster = 'commercial';
    } else if (/code|p\d{4}|c\d{4}|b\d{4}/i.test(q)) {
      cluster = 'diagnostic';
    } else if (/how to|replacement|change|flush/i.test(q)) {
      cluster = 'repair';
    } else if (/oil|coolant|fluid|capacity|tire|wheel|battery|transmission|brake/i.test(q)) {
      cluster = 'maintenance';
    }

    // Avoid double-counting the same query across multiple mapped URLs
    if (!clusters[cluster].queries.find((x) => x.query === r.query)) {
      clusters[cluster].queries.push(r);
      clusters[cluster].totalCitations += r.citations;
    }
  }

  return clusters;
}

function estimateRevenue(citations, ctrAssumption = 0.15) {
  const clicks = citations * ctrAssumption;
  return {
    clicks,
    estimatedRevenue: clicks * AFFILIATE_BASELINE.revenuePerClick,
    estimatedEarnings: clicks * AFFILIATE_BASELINE.earningsPerClick,
  };
}

function main() {
  const auditFile = latestAuditFile();
  if (!auditFile) {
    console.error('No ai-citations-audit file found in', REPORTS_DIR);
    process.exit(1);
  }

  const audit = JSON.parse(fs.readFileSync(auditFile, 'utf8'));
  const results = audit.results || [];
  const uniqueQueries = [];
  for (const r of results) {
    if (!uniqueQueries.find((q) => q.query === r.query)) {
      uniqueQueries.push(r);
    }
  }

  const totalCitations = uniqueQueries.reduce((s, r) => s + r.citations, 0);
  const non200 = results.filter((r) => r.statusInfo && r.statusInfo.status !== 200);
  const noindexed = results.filter((r) => r.statusInfo && r.statusInfo.noindex);
  const missingData = results.filter((r) => r.dataInfo && !r.dataInfo.hasData);
  const clusters = clusterQueries(uniqueQueries);

  const commercialEst = estimateRevenue(clusters.commercial.totalCitations, 0.22);
  const maintenanceEst = estimateRevenue(clusters.maintenance.totalCitations, 0.12);
  const repairEst = estimateRevenue(clusters.repair.totalCitations, 0.08);

  ensureDir(OUTPUT_DIR);
  const outPath = path.join(OUTPUT_DIR, `ai-citations-report-${today}.md`);

  const lines = [];
  lines.push(`# AI Citations & Affiliate Revenue Correlation Report`);
  lines.push('');
  lines.push(`- **Report date:** ${today}`);
  lines.push(`- **Audit source:** ${path.basename(auditFile)}`);
  lines.push(`- **Production base URL:** ${audit.baseUrl}`);
  lines.push(`- **Total AI citations (sampled queries):** ${totalCitations.toLocaleString()}`);
  lines.push(`- **Unique queries analyzed:** ${uniqueQueries.length}`);
  lines.push('');

  lines.push(`## Executive Summary`);
  lines.push('');
  lines.push(`Bing AI Performance data shows ${totalCitations.toLocaleString()} citations across ${uniqueQueries.length} sampled queries.`);
  lines.push(`Commercial and maintenance-spec queries dominate the citation volume and carry the strongest affiliate intent.`);
  lines.push(`There are currently **${non200.length} non-200 mapped URLs** and **${missingData.length} pages missing local data** — these represent the fastest-win fixes.`);
  lines.push('');

  lines.push(`## Citation Trend Context`);
  lines.push('');
  lines.push(`- Total citations grew from ~40/day in early May to a peak of ~2,000/day around July 8–9.`);
  lines.push(`- July 12–13 pulled back to ~1,200/day. Continue watching this series in the daily monitor.`);
  lines.push(`- Bing is now the primary revenue-bearing search channel; protecting these AI-citation URLs is critical.`);
  lines.push('');

  lines.push(`## Query Cluster Analysis`);
  lines.push('');
  lines.push(`| Cluster | Queries | Citations | Share | Affiliate CTR Assumption | Est. Clicks | Est. Ordered Revenue |`);
  lines.push(`|--------|--------:|----------:|------:|-------------------------:|------------:|---------------------:|`);
  for (const key of ['commercial', 'maintenance', 'repair', 'diagnostic', 'hub']) {
    const c = clusters[key];
    const est = estimateRevenue(c.totalCitations, key === 'commercial' ? 0.22 : key === 'maintenance' ? 0.12 : key === 'repair' ? 0.08 : 0.03);
    const share = totalCitations > 0 ? ((c.totalCitations / totalCitations) * 100).toFixed(1) : '0.0';
    lines.push(`| ${c.label} | ${c.queries.length} | ${c.totalCitations.toLocaleString()} | ${share}% | ${(est.clicks / c.totalCitations * 100).toFixed(1)}% | ${est.clicks.toFixed(0)} | $${est.estimatedRevenue.toFixed(2)} |`);
  }
  lines.push('');

  lines.push(`## Affiliate Baseline`);
  lines.push('');
  lines.push(`Amazon affiliate tracking ID \`aiautorepair-20\` (Jan 01 – Jul 09 2026):`);
  lines.push(`- **Clicks:** ${AFFILIATE_BASELINE.clicks.toLocaleString()}`);
  lines.push(`- **Ordered items:** ${AFFILIATE_BASELINE.orderedItems.toLocaleString()}`);
  lines.push(`- **Conversion rate:** ${AFFILIATE_BASELINE.conversionRate}%`);
  lines.push(`- **Ordered revenue:** $${AFFILIATE_BASELINE.orderedRevenue.toLocaleString()}`);
  lines.push(`- **Total earnings:** $${AFFILIATE_BASELINE.totalEarnings.toLocaleString()}`);
  lines.push(`- **Revenue per click:** $${AFFILIATE_BASELINE.revenuePerClick.toFixed(2)}`);
  lines.push(`- **Earnings per click:** $${AFFILIATE_BASELINE.earningsPerClick.toFixed(2)}`);
  lines.push('');
  lines.push(`> The revenue estimates above assume AI-citation traffic converts at the same rate as overall organic affiliate traffic. Actual AI-referred traffic may convert differently; update assumptions as GA4/Amazon attribution data improves.`);
  lines.push('');

  lines.push(`## Top Cited Queries & Mapped URLs`);
  lines.push('');
  lines.push(`| Citations | % Cited | Query | Mapped URL | Status |`);
  lines.push(`|----------:|--------:|-------|------------|--------|`);
  for (const r of uniqueQueries.sort((a, b) => b.citations - a.citations).slice(0, 25)) {
    const status = r.statusInfo ? `${r.statusInfo.status}${r.statusInfo.noindex ? ' +noindex' : ''}` : 'not checked';
    lines.push(`| ${r.citations} | ${r.pct}% | ${r.query} | ${r.mappedUrl || '(unmapped)'} | ${status} |`);
  }
  lines.push('');

  if (non200.length > 0) {
    lines.push(`## Non-200 Mapped URLs (Immediate Fix Needed)`);
    lines.push('');
    lines.push(`| Query | URL | Status |`);
    lines.push(`|-------|-----|--------|`);
    for (const r of non200) {
      lines.push(`| ${r.query} | ${r.mappedUrl} | ${r.statusInfo.status}${r.statusInfo.noindex ? ' +noindex' : ''} |`);
    }
    lines.push('');
  }

  if (missingData.length > 0) {
    lines.push(`## Missing Data Gaps`);
    lines.push('');
    lines.push(`| Query | URL | Kind | Missing Spec |`);
    lines.push(`|-------|-----|------|--------------|`);
    for (const r of missingData) {
      lines.push(`| ${r.query} | ${r.mappedUrl} | ${r.kind} | ${r.dataInfo.toolType || r.dataInfo.task || '-'} |`);
    }
    lines.push('');
  }

  lines.push(`## Recommended Actions`);
  lines.push('');
  lines.push(`1. **Deploy the missing data pages.** The non-200 / missing-data URLs above were filled in \`src/data/tools-pages.ts\` and \`src/data/vehicles.ts\`. Build and deploy to make them live.`);
  lines.push(`2. **Prioritize commercial queries.** \`amazon auto parts by vehicle...\` queries are pure affiliate intent; ensure the parts funnel CTAs are visible and tracking IDs are intact.`);
  lines.push(`3. **Protect maintenance-spec pages.** Battery location, tire size, oil/coolant capacity, and fluid charts are the most-cited informational queries. Keep them 200, fast, and free of over-broad noindex.`);
  lines.push(`4. **Watch the July 12–13 pullback.** The daily monitor now tracks AI-citation URL health in \`scripts/seo-reports/monitor-ai-citations.jsonl\`. Any renewed drop in citations should trigger a status check.`);
  lines.push(`5. **Add DTC vehicle-code coverage.** \`/vehicles/2007/ford/mustang/codes/P0108\` returned 404. If vehicle-specific code pages are not yet built, route high-citation DTC queries to the generic \`/codes/P0108\` page and add cross-links.`);
  lines.push(`6. **Revisit make-guide noindex policy.** \`/guides/toyota\` and \`/guides/ford\` are cited but carry noindex. They are valuable AI citation landing pages; consider allowing index if content is robust.`);
  lines.push('');

  lines.push(`## Files Generated / Updated`);
  lines.push('');
  lines.push(`- \`scripts/ai-citations-audit.mjs\` — maps queries to URLs, checks production status, writes gaps.`);
  lines.push(`- \`scripts/seo-reports/ai-citations-audit-${today}.json\` — full audit results.`);
  lines.push(`- \`scripts/seo-reports/ai-citations-gaps.json\` — latest actionable gaps.`);
  lines.push(`- \`scripts/seo-daily-monitor.mjs\` — now includes AI-citation URL health watch.`);
  lines.push(`- \`scripts/seo-reports/monitor-ai-citations.jsonl\` — daily 200/noindex log.`);
  lines.push('');

  fs.writeFileSync(outPath, lines.join('\n'));
  console.log(`Report written: ${outPath}`);
}

main();
