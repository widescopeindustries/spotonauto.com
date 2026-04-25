#!/usr/bin/env node

/*
  Production smoke test for SpotOnAuto.
  Usage:
    node scripts/smoke-prod.mjs
    BASE_URL=https://spotonauto.com node scripts/smoke-prod.mjs
*/

const BASE_URL = process.env.BASE_URL || 'https://spotonauto.com';

const checks = [
  { path: '/', expectedStatus: [200], titleIncludes: 'SpotOnAuto' },
  { path: '/auth', expectedStatus: [200] },
  { path: '/diagnose', expectedStatus: [200], bodyIncludes: 'Diagnostic' },
  { path: '/cel', expectedStatus: [200], bodyIncludes: 'LOOK UP', followRedirects: true },
  { path: '/second-opinion', expectedStatus: [200], bodyIncludes: 'Diagnose', followRedirects: true },
  { path: '/community', expectedStatus: [200], bodyIncludes: 'Community' },
  { path: '/community/new', expectedStatus: [200, 302, 307, 308] },
  { path: '/parts', expectedStatus: [200], bodyIncludes: 'earns from qualifying purchases' },
  { path: '/tools', expectedStatus: [200], bodyIncludes: 'Auto Repair Tools' },
  { path: '/codes', expectedStatus: [200], bodyIncludes: 'DTC' },
  { path: '/manual', expectedStatus: [200], bodyIncludes: 'Factory Service Manuals', bodyExcludes: 'Unable to load the service manual database right now' },
  { path: '/manual-navigator', expectedStatus: [200], bodyIncludes: 'Manual Navigator' },
  { path: '/api/manual-coverage?action=bootstrap', expectedStatus: [200], bodyIncludes: 'makeCount' },
  { path: '/api/manual-coverage?action=resolve&year=2011&make=Toyota&model=Camry%20L4-2.4L%20(2AZ-FXE)%20Hybrid', expectedStatus: [200], bodyIncludes: '"exact":true', cacheBust: true },
  { path: '/api/manual-coverage?action=resolve&year=1992&make=Acura&model=Integra', expectedStatus: [200], bodyIncludes: '"candidates":[{', cacheBust: true },
  { path: '/sitemap.xml', expectedStatus: [200], contentTypeIncludes: 'xml' },
  { path: '/repair/sitemap.xml', expectedStatus: [200], contentTypeIncludes: 'xml' },
  { path: '/wiring/sitemap.xml', expectedStatus: [200], contentTypeIncludes: 'xml' },
  { path: '/wiring/sitemap/16.xml', expectedStatus: [200], contentTypeIncludes: 'xml' },
  { path: '/blog', expectedStatus: [404] },
  { path: '/pricing', expectedStatus: [200] },
];

function extractTitle(html) {
  const m = html.match(/<title>([^<]+)<\/title>/i);
  return m ? m[1].trim() : '';
}

function extractCanonical(html) {
  const m = html.match(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
  return m ? m[1].trim() : '';
}

async function fetchWithBody(url, followRedirects = false, cacheBust = false) {
  const requestUrl = cacheBust
    ? `${url}${url.includes('?') ? '&' : '?'}_smoke=${Date.now()}`
    : url;
  const res = await fetch(requestUrl, { redirect: followRedirects ? 'follow' : 'manual' });
  const text = await res.text();
  return { res, text };
}

let failed = 0;

console.log(`Smoke testing: ${BASE_URL}`);
for (const check of checks) {
  const url = `${BASE_URL}${check.path}`;
  try {
    const { res, text } = await fetchWithBody(url, check.followRedirects, check.cacheBust);
    const statusOk = check.expectedStatus.includes(res.status);

    let ok = statusOk;
    const details = [`status=${res.status}`];

    const ct = res.headers.get('content-type') || '';
    if (check.contentTypeIncludes) {
      const ctOk = ct.toLowerCase().includes(check.contentTypeIncludes.toLowerCase());
      ok = ok && ctOk;
      details.push(`content-type=${ct || 'n/a'}`);
    }

    if (check.titleIncludes) {
      const title = extractTitle(text);
      const titleOk = title.toLowerCase().includes(check.titleIncludes.toLowerCase());
      ok = ok && titleOk;
      details.push(`title=${title || 'n/a'}`);
    }

    if (check.bodyIncludes) {
      const bodyOk = text.toLowerCase().includes(check.bodyIncludes.toLowerCase());
      ok = ok && bodyOk;
      details.push(`bodyContains=${bodyOk ? 'yes' : 'no'}`);
    }

    if (check.bodyExcludes) {
      const bodyExcluded = !text.toLowerCase().includes(check.bodyExcludes.toLowerCase());
      ok = ok && bodyExcluded;
      details.push(`bodyExcludes=${bodyExcluded ? 'yes' : 'no'}`);
    }

    if (check.path === '/diagnose') {
      const canonical = extractCanonical(text);
      details.push(`canonical=${canonical || 'n/a'}`);
    }

    const label = ok ? 'PASS' : 'FAIL';
    console.log(`${label} ${check.path} :: ${details.join(' | ')}`);
    if (!ok) failed++;
  } catch (err) {
    failed++;
    console.log(`FAIL ${check.path} :: error=${String(err.message || err)}`);
  }
}

try {
  const res = await fetch(`${BASE_URL}/`, { method: 'HEAD' });
  const csp = res.headers.get('content-security-policy') || '';
  const cspOk = csp.includes('fundingchoicesmessages.google.com');
  console.log(`${cspOk ? 'PASS' : 'FAIL'} CSP fundingchoices domain check`);
  if (!cspOk) failed++;
} catch (err) {
  failed++;
  console.log(`FAIL CSP fundingchoices domain check :: error=${String(err.message || err)}`);
}

if (failed > 0) {
  console.error(`\nSmoke failed: ${failed} check(s) failed.`);
  process.exit(1);
}

console.log('\nSmoke passed: all checks succeeded.');
