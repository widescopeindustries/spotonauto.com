import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { ManualDeliveryCache } from '../../src/lib/manualDeliveryCache.ts';

test('bounded cache coalesces, evicts, expires and retries rejected loads', async () => {
  const cache = new ManualDeliveryCache(2, 100);
  const policy = () => ({ ttl: 20, bytes: 10 });
  let loads = 0;
  const load = async () => { loads++; await new Promise(resolve => setTimeout(resolve, 5)); return 42; };
  assert.deepEqual(await Promise.all(Array.from({ length: 10 }, () => cache.get('a', load, policy))), Array(10).fill(42));
  assert.equal(loads, 1);
  await cache.get('b', load, policy); await cache.get('c', load, policy); await cache.get('a', load, policy);
  assert.equal(loads, 4);
  await new Promise(resolve => setTimeout(resolve, 25));
  await cache.get('a', load, policy); assert.equal(loads, 5);
  await assert.rejects(cache.get('failed', async () => { throw Error('temporary'); }, policy));
  assert.equal(await cache.get('failed', load, policy), 42);
  const noCache = () => ({ ttl: 0, bytes: 1 });
  await cache.get('temporary', load, noCache); await cache.get('temporary', load, noCache);
  assert.equal(loads, 8);
});

test('gateway preserves bodies, bounds admission, returns real misses and rejects temporary failures', async () => {
  const key = 'isolated-test-key';
  let preflightFailure = false;
  let slow = false;
  const body = '<!doctype html><html><head><script src="//scripts.mediavine.com/tags/64b496ca-b6f8-40ae-b329-c276001da62e.js"></script></head><body><div class="mv-content">Manual fixture</div></body></html>';
  const origin = http.createServer(async (request, response) => {
    const url = new URL(request.url, 'http://localhost');
    if (url.pathname === '/api/internal/manual-page') {
      assert.equal(request.headers['x-manual-internal-key'], key);
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify({ status: preflightFailure ? 503 : url.searchParams.get('path').endsWith('/missing') ? 404 : 200 }));
    } else {
      if (slow) await new Promise(resolve => setTimeout(resolve, 180));
      response.setHeader('Content-Type', 'text/html');
      response.setHeader('Content-Security-Policy', "default-src 'self' https:");
      response.end(body);
    }
  });
  origin.listen(0, '127.0.0.1'); await once(origin, 'listening');
  const upstream = origin.address().port;
  const gatewayPort = Number(process.env.MANUAL_TEST_PORT || 3039);
  const child = spawn(process.execPath, ['deploy/manual-delivery-gateway.mjs'], { env: { ...process.env, MANUAL_GATEWAY_PORT: String(gatewayPort), MANUAL_WORKER_PORTS: String(upstream), MANUAL_INTERNAL_KEY: key, MANUAL_MAX_ACTIVE: '1', MANUAL_MAX_QUEUED: '1', MANUAL_QUEUE_MS: '40' }, stdio: ['ignore', 'pipe', 'pipe'] });
  try {
    let ready = false;
    for (let i = 0; i < 50; i++) {
      try { ready = (await fetch(`http://127.0.0.1:${gatewayPort}/_health`)).ok; } catch {}
      if (ready) break;
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    assert.ok(ready);
    const base = `http://127.0.0.1:${gatewayPort}`;
    const good = await fetch(base + '/manual/test');
    assert.equal(good.status, 200); assert.equal(await good.text(), body);
    assert.equal(good.headers.get('content-security-policy'), "default-src 'self' https:");
    const missing = await fetch(base + '/manual/missing');
    assert.equal(missing.status, 404); await missing.arrayBuffer();
    preflightFailure = true;
    const unavailable = await fetch(base + '/manual/test');
    assert.equal(unavailable.status, 503); assert.match(unavailable.headers.get('cache-control'), /no-store/);
    assert.equal(unavailable.headers.get('retry-after'), '3'); await unavailable.arrayBuffer();
    preflightFailure = false; slow = true;
    const requests = Array.from({ length: 6 }, () => fetch(base + '/manual/test').then(async response => { const status = response.status; await response.arrayBuffer(); return status; }));
    const statuses = await Promise.all(requests);
    assert.ok(statuses.includes(200)); assert.ok(statuses.filter(status => status === 503).length >= 4);
    const health = await (await fetch(base + '/_health')).json();
    assert.equal(health.active, 0); assert.equal(health.queued, 0); assert.equal(health.bufferedBytes, 0);
    assert.equal(health.counters.maxActive, 1); assert.ok(health.counters.maxQueued <= 1);
    assert.equal((await fetch(base + '/manual/test', { method: 'POST' })).status, 405);
    const image = await fetch(base + '/manual/images25/G91J02999', { redirect: 'manual' });
    assert.equal(image.status, 308); assert.equal(image.headers.get('location'), '/manual-media/images25/G91J02999/');
  } finally {
    child.kill('SIGTERM'); await once(child, 'exit'); origin.closeAllConnections(); origin.close();
  }
});
