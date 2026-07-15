import https from 'https';
import fs from 'fs';

const API_KEY = 'ed56683793774b0896e6a680bd7559d7';
const SITE_URL = 'https://alloemmanuals.com';
const OUT = 'scripts/seo-reports/bwt-audit-2026-07-10.json';

function bingGet(path) {
  return new Promise((resolve, reject) => {
    https.get({
      hostname: 'ssl.bing.com',
      path: `/webmaster/api.svc/json${path}&apikey=${API_KEY}`,
      headers: { 'Content-Type': 'application/json' },
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
        catch { resolve({ status: res.statusCode, data: body }); }
      });
    }).on('error', reject);
  });
}

function bingPost(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = https.request({
      hostname: 'ssl.bing.com',
      path: `/webmaster/api.svc/json${path}?apikey=${API_KEY}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
        catch { resolve({ status: res.statusCode, data: body }); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

const results = {};

async function get(name, path) {
  try {
    const res = await bingGet(path);
    results[name] = res;
    console.log(`✓ ${name}: status ${res.status}`);
  } catch (e) {
    results[name] = { error: e.message };
    console.log(`✗ ${name}: ${e.message}`);
  }
}

async function post(name, path, body) {
  try {
    const res = await bingPost(path, body);
    results[name] = res;
    console.log(`✓ ${name}: status ${res.status}`);
  } catch (e) {
    results[name] = { error: e.message };
    console.log(`✗ ${name}: ${e.message}`);
  }
}

console.log('Pulling Bing Webmaster Tools data...\n');

await get('SubmittedFeeds', `/GetFeeds?siteUrl=${encodeURIComponent(SITE_URL)}`);

// Feed details for each submitted feed
const feeds = results.SubmittedFeeds?.data?.d || [];
for (const feed of feeds) {
  const feedUrl = typeof feed === 'string' ? feed : feed?.Url;
  if (!feedUrl) continue;
  const safeName = feedUrl.replace(/[^a-z0-9]/gi, '_');
  await get(`FeedDetails_${safeName}`, `/GetFeedDetails?siteUrl=${encodeURIComponent(SITE_URL)}&feedUrl=${encodeURIComponent(feedUrl)}`);
}

await get('RankAndTrafficStats', `/GetRankAndTrafficStats?siteUrl=${encodeURIComponent(SITE_URL)}`);
await get('KeywordStats', `/GetKeywordStats?siteUrl=${encodeURIComponent(SITE_URL)}`);
await get('CrawlStats', `/GetCrawlStats?siteUrl=${encodeURIComponent(SITE_URL)}`);
await get('IndexCounts', `/GetIndexCounts?siteUrl=${encodeURIComponent(SITE_URL)}`);
await get('InboundLinks', `/GetInboundLinks?siteUrl=${encodeURIComponent(SITE_URL)}`);
await get('OutboundLinks', `/GetOutboundLinks?siteUrl=${encodeURIComponent(SITE_URL)}`);
await get('BlockedUrls', `/GetBlockedUrls?siteUrl=${encodeURIComponent(SITE_URL)}`);

// URL-level stats
for (const url of [
  'https://alloemmanuals.com/',
  'https://alloemmanuals.com/tools/bmw-540i-spark-plug-type',
  'https://alloemmanuals.com/repair/2018/mazda/mazda2/mass-air-flow-sensor-replacement',
  'https://alloemmanuals.com/wiring',
  'https://alloemmanuals.com/diagnose',
]) {
  await get(`UrlTraffic_${url.replace(/[^a-z0-9]/gi, '_')}`, `/GetUrlTraffic?siteUrl=${encodeURIComponent(SITE_URL)}&url=${encodeURIComponent(url)}`);
}

fs.writeFileSync(OUT, JSON.stringify(results, null, 2));
console.log(`\nWrote ${OUT}`);
