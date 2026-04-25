#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const REPORTS_DIR = path.join(__dirname, 'seo-reports');
const today = new Date();
const todayKey = today.toISOString().slice(0, 10);
const weekStart = new Date(today);
weekStart.setDate(weekStart.getDate() - 6);

const TOP_QUERY_PAGES = [
  { slug: 'chevrolet-silverado-tire-size', url: 'https://spotonauto.com/tools/chevrolet-silverado-tire-size' },
  { slug: 'ford-focus-oil-type', url: 'https://spotonauto.com/tools/ford-focus-oil-type' },
  { slug: 'toyota-sienna-tire-size', url: 'https://spotonauto.com/tools/toyota-sienna-tire-size' },
  { slug: 'ford-edge-oil-type', url: 'https://spotonauto.com/tools/ford-edge-oil-type' },
  { slug: 'jeep-compass-oil-capacity', url: 'https://spotonauto.com/tools/jeep-compass-oil-capacity' },
];

function run(cmd) {
  try {
    return execSync(cmd, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch (_error) {
    return '';
  }
}

function runJson(cmd) {
  const output = run(cmd);
  if (!output) return null;
  try {
    return JSON.parse(output);
  } catch (_error) {
    return null;
  }
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toISOString().slice(0, 10);
}

function collectCommits() {
  const since = weekStart.toISOString().slice(0, 10);
  const raw = run(`git log --since='${since} 00:00:00' --date=iso-strict --pretty=format:'%h|%ad|%s|%an'`);
  if (!raw) return [];

  return raw
    .split('\n')
    .map((line) => line.split('|'))
    .filter((parts) => parts.length >= 4)
    .map(([shortSha, date, subject, author]) => ({
      shortSha,
      date,
      subject,
      author,
    }));
}

function collectDeployRuns() {
  const data = runJson('gh run list --workflow .github/workflows/deploy-production.yml --limit 20 --json databaseId,displayTitle,status,conclusion,createdAt,updatedAt,event,url,headSha');
  if (!Array.isArray(data)) {
    return {
      available: false,
      runs: [],
      successCount: 0,
      failureCount: 0,
    };
  }

  const weekRuns = data.filter((runItem) => {
    const created = new Date(runItem.createdAt);
    return !Number.isNaN(created.getTime()) && created >= weekStart;
  });

  const successCount = weekRuns.filter((runItem) => runItem.conclusion === 'success').length;
  const failureCount = weekRuns.filter((runItem) => runItem.conclusion === 'failure').length;

  return {
    available: true,
    runs: weekRuns,
    successCount,
    failureCount,
  };
}

function collectTopPageCoverage() {
  const sourcePath = path.join(ROOT, 'src', 'data', 'tools-pages.ts');
  const source = fs.readFileSync(sourcePath, 'utf8');

  return TOP_QUERY_PAGES.map((page) => ({
    ...page,
    presentInData: source.includes(`slug: '${page.slug}'`),
  }));
}

function createMarkdown(report) {
  const deploySummary = report.deploy.available
    ? `${report.deploy.successCount} success / ${report.deploy.failureCount} failed (${report.deploy.runs.length} runs)`
    : 'GitHub CLI unavailable (deploy run data not collected)';

  const commitLines = report.commits.length
    ? report.commits
        .slice(0, 15)
        .map((commit) => `- ${formatDate(commit.date)} \`${commit.shortSha}\` ${commit.subject} (${commit.author})`)
        .join('\n')
    : '- No commits detected in the last 7 days.';

  const topPages = report.topQueryCoverage
    .map((page) => `- ${page.presentInData ? '✅' : '❌'} ${page.slug} (${page.url})`)
    .join('\n');

  const runLines = report.deploy.available && report.deploy.runs.length
    ? report.deploy.runs
        .slice(0, 10)
        .map((runItem) => `- ${formatDate(runItem.createdAt)} ${runItem.conclusion || runItem.status} · ${runItem.displayTitle} · ${runItem.event}`)
        .join('\n')
    : '- No deploy runs in last 7 days.';

  return [
    '# Weekly Launch Report',
    '',
    `- Generated: ${report.generatedAt}`,
    `- Window: ${report.window.start} to ${report.window.end}`,
    `- Branch: ${report.branch}`,
    `- HEAD: ${report.head.shortSha}`,
    '',
    '## Deployment Health',
    '',
    `- Summary: ${deploySummary}`,
    '',
    runLines,
    '',
    '## Shipping Activity',
    '',
    `- Commits this week: ${report.commits.length}`,
    '',
    commitLines,
    '',
    '## Top Query Coverage (Tier 1)',
    '',
    topPages,
    '',
  ].join('\n');
}

function main() {
  ensureDir(REPORTS_DIR);

  const commits = collectCommits();
  const deploy = collectDeployRuns();
  const topQueryCoverage = collectTopPageCoverage();

  const report = {
    generatedAt: today.toISOString(),
    window: {
      start: weekStart.toISOString().slice(0, 10),
      end: todayKey,
    },
    branch: run('git branch --show-current') || 'unknown',
    head: {
      shortSha: run('git rev-parse --short HEAD') || 'unknown',
      fullSha: run('git rev-parse HEAD') || 'unknown',
    },
    commits,
    deploy,
    topQueryCoverage,
  };

  const jsonPath = path.join(REPORTS_DIR, `weekly-launch-report-${todayKey}.json`);
  const mdPath = path.join(REPORTS_DIR, `weekly-launch-report-${todayKey}.md`);

  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(mdPath, `${createMarkdown(report)}\n`);

  console.log(`Wrote ${path.relative(ROOT, jsonPath)}`);
  console.log(`Wrote ${path.relative(ROOT, mdPath)}`);
}

main();
