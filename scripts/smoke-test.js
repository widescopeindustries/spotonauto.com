#!/usr/bin/env node
/**
 * SpotOnAuto Smoke Test — run before every deploy
 * Usage: node scripts/smoke-test.js [base_url]
 * Default: https://www.spotonauto.com
 */

const BASE = process.argv[2] || 'https://www.spotonauto.com';
let passed = 0;
let failed = 0;
const results = [];

async function test(name, fn) {
  try {
    await fn();
    passed++;
    results.push(`  ✅ ${name}`);
  } catch (err) {
    failed++;
    results.push(`  ❌ ${name}: ${err.message}`);
  }
}

async function fetchOk(url, opts = {}) {
  const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(10000), ...opts });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res;
}

async function run() {
  console.log(`\n🔧 SpotOnAuto Smoke Test — ${BASE}\n`);

  // 1. Core pages load
  await test('Homepage loads (200)', async () => {
    await fetchOk(BASE);
  });

  await test('/diagnose loads (200)', async () => {
    await fetchOk(`${BASE}/diagnose`);
  });

  await test('/auth loads (200)', async () => {
    await fetchOk(`${BASE}/auth`);
  });

  await test('/guides loads (200)', async () => {
    await fetchOk(`${BASE}/guides`);
  });

  await test('/parts loads (200)', async () => {
    await fetchOk(`${BASE}/parts`);
  });

  // 2. API endpoints respond
  await test('generate-guide API responds (POST)', async () => {
    const res = await fetch(`${BASE}/api/generate-guide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'test' }),
      signal: AbortSignal.timeout(10000),
    });
    // 400 = expected (bad action), 500 = server broken
    if (res.status >= 500) throw new Error(`Server error: ${res.status}`);
    // 400 is fine — means the API is alive and validating
  });

  await test('vehicle-health API responds', async () => {
    const res = await fetch(`${BASE}/api/vehicle-health?year=2020&make=Toyota&model=Camry`, {
      signal: AbortSignal.timeout(10000),
    });
    if (res.status >= 500) throw new Error(`Server error: ${res.status}`);
  });

  // 3. Auth page serves form, not Loading...
  await test('/auth serves form (not stuck on Loading)', async () => {
    const res = await fetchOk(`${BASE}/auth`);
    const html = await res.text();
    // The HTML should contain the auth form or AuthForm component
    // It should NOT be only a loading spinner
    if (html.includes('Loading...') && !html.includes('Sign in') && !html.includes('email')) {
      throw new Error('Auth page stuck on Loading state');
    }
  });

  // 5. Repair guide page accessible without auth
  await test('/repair page accessible (no auth redirect)', async () => {
    const res = await fetch(`${BASE}/repair/2020/toyota/camry/oil-change`, {
      redirect: 'manual',
      signal: AbortSignal.timeout(10000),
    });
    // Should NOT redirect to /auth
    const location = res.headers.get('location') || '';
    if (location.includes('/auth')) {
      throw new Error(`Redirected to auth: ${location}`);
    }
  });

  // Report
  console.log(results.join('\n'));
  console.log(`\n${passed} passed, ${failed} failed\n`);

  if (failed > 0) {
    console.log('🚨 SMOKE TEST FAILED — do NOT deploy until fixed\n');
    process.exit(1);
  } else {
    console.log('✅ All clear — safe to deploy\n');
    process.exit(0);
  }
}

run().catch(err => {
  console.error('Smoke test crashed:', err.message);
  process.exit(1);
});
