/** Loopback-only admission for manual rendering. It does not alter page bodies. */
import http from 'node:http';
import { performance } from 'node:perf_hooks';

const port = Number(process.env.MANUAL_GATEWAY_PORT || 3020);
const workerPorts = (process.env.MANUAL_WORKER_PORTS || '3017,3018').split(',').map(Number);
const key = process.env.MANUAL_INTERNAL_KEY;
if (!key || workerPorts.some(value => !Number.isInteger(value))) throw Error('Missing manual gateway configuration');
const capacity = Number(process.env.MANUAL_MAX_ACTIVE || 16);
const queueLimit = Number(process.env.MANUAL_MAX_QUEUED || 96);
const queueMs = Number(process.env.MANUAL_QUEUE_MS || 1800);
const bodyLimit = 64 * 1024 * 1024;
const bufferBudget = 384 * 1024 * 1024;
let bufferedBytes = 0;
const agent = new http.Agent({ keepAlive: true, maxSockets: capacity + 4, maxFreeSockets: 8, timeout: 15000 });
const workers = workerPorts.map(port => ({ port, active: 0, failedUntil: 0 }));
const queue = [];
let active = 0;
let closing = false;
let nextWorker = 0;
const counters = { requests: 0, completed: 0, temporaryFailures: 0, queueRejected: 0, clientAborted: 0, workerRetries: 0, maxActive: 0, maxQueued: 0 };
let lastFailure = null;
const hop = new Set(['connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization', 'te', 'trailer', 'transfer-encoding', 'upgrade']);

function requestWorker(worker, path, method, headers, signal, timeout = 9000) {
  return new Promise((resolve, reject) => {
    let reserved = 0;
    let released = false;
    const release = () => { if (!released) { bufferedBytes -= reserved; released = true; } };
    const request = http.request({ host: '127.0.0.1', port: worker.port, path, method, headers, agent, signal }, response => {
      let size = 0;
      const buffers = [];
      response.on('data', chunk => {
        size += chunk.length;
        if (size > bodyLimit || bufferedBytes + chunk.length > bufferBudget) request.destroy(Error('Manual response exceeds memory budget'));
        else { buffers.push(chunk); reserved += chunk.length; bufferedBytes += chunk.length; }
      });
      response.on('end', () => resolve({ status: response.statusCode, headers: response.headers, body: Buffer.concat(buffers), release }));
      response.on('error', error => { release(); reject(error); });
      response.on('aborted', () => { release(); reject(Error('Manual upstream response interrupted')); });
    });
    const deadline = setTimeout(() => request.destroy(Error('Manual upstream deadline exceeded')), timeout);
    request.once('close', () => clearTimeout(deadline));
    request.on('error', error => { release(); reject(error); });
    request.end();
  });
}

function temporary(response, message = 'This manual is temporarily unavailable. Please try again shortly.') {
  if (response.destroyed || response.headersSent) return;
  counters.temporaryFailures++;
  response.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store, max-age=0', 'Retry-After': '3' });
  response.end(message);
}

function choose(exclude) {
  const eligible = workers.filter(worker => worker !== exclude && worker.failedUntil <= Date.now());
  if (!eligible.length) return null;
  eligible.sort((a, b) => a.active - b.active);
  const minimum = eligible[0].active;
  const equal = eligible.filter(worker => worker.active === minimum);
  return equal[nextWorker++ % equal.length];
}

async function serve(item) {
  if (item.response.destroyed) return;
  active++;
  counters.maxActive = Math.max(counters.maxActive, active);
  const controller = new AbortController();
  item.response.once('close', () => { if (!item.response.writableEnded) { counters.clientAborted++; controller.abort(); } });
  const start = performance.now();
  let worker = choose();
  let result;
  try {
    for (let attempt = 0; attempt < 2; attempt++) {
      if (!worker) throw Error('No manual renderer is ready');
      worker.active++;
      try {
        const check = await requestWorker(worker, '/api/internal/manual-page?path=' + encodeURIComponent(item.url.pathname), 'GET', {
          host: 'alloemmanuals.com', 'x-manual-internal-key': key, accept: 'application/json',
        }, controller.signal, 4500);
        let sourceStatus;
        try { sourceStatus = JSON.parse(check.body.toString()).status; }
        finally { check.release(); }
        if (check.status >= 500 || sourceStatus >= 500) { lastFailure = { at: Date.now(), reason: 'source_unavailable', status: sourceStatus, path: item.url.pathname }; temporary(item.response); return; }
        if (check.status !== 200 || ![200, 404, 410].includes(sourceStatus)) throw Error('Invalid manual preflight response');
        const headers = { ...item.request.headers, host: 'alloemmanuals.com' };
        for (const name of hop) delete headers[name];
        delete headers['x-manual-internal-key'];
        result = await requestWorker(worker, item.request.url, item.request.method, headers, controller.signal);
        if (result.status >= 500) { lastFailure = { at: Date.now(), reason: 'render_status', status: result.status, path: item.url.pathname }; temporary(item.response); return; }
        if (sourceStatus === 404 && result.status === 200) result.status = 404;
        // No source request or DB outage may be cached as a fabricated 404.
        if (sourceStatus === 200 && result.status === 404) throw Error('Known manual rendered as not found');
        worker.failedUntil = 0;
        break;
      } catch (error) {
        lastFailure = { at: Date.now(), reason: String(error.message).slice(0,100), path: item.url.pathname, worker: worker.port };
        result?.release();
        result = undefined;
        if (controller.signal.aborted) return;
        worker.failedUntil = Date.now() + 1500;
        if (attempt === 1) throw error;
        counters.workerRetries++;
      } finally { worker.active--; }
      worker = choose(worker);
    }
    if (!result || item.response.destroyed) return;
    const headers = { ...result.headers };
    for (const name of hop) delete headers[name];
    if (item.request.method !== 'HEAD') headers['content-length'] = String(result.body.length);
    headers['x-manual-render-ms'] = String(Math.round(performance.now() - start));
    item.response.writeHead(result.status, headers);
    await new Promise(resolve => {
      item.response.once('finish', resolve);
      item.response.once('close', resolve);
      item.response.end(result.body);
    });
    counters.completed++;
  } catch {
    temporary(item.response);
  } finally {
    result?.release();
    active--;
    drain();
  }
}

function drain() {
  while (!closing && active < capacity && queue.length) {
    const item = queue.shift();
    clearTimeout(item.timer);
    if (!item.response.destroyed) void serve(item);
  }
}

const server = http.createServer((request, response) => {
  const url = new URL(request.url, 'http://127.0.0.1');
  if (url.pathname === '/_health') {
    response.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    response.end(JSON.stringify({ status: closing ? 'draining' : 'ok', active, queued: queue.length, bufferedBytes, bufferBudget, capacity, queueLimit, workers, counters, lastFailure, rss: process.memoryUsage().rss }));
    return;
  }
  if (!/^\/manual(?:\/|$)/.test(url.pathname)) { response.writeHead(404); response.end(); return; }
  if (/^\/manual\/(images25|images|icons)\//.test(url.pathname)) {
    let mediaPath = url.pathname.replace('/manual/', '/manual-media/');
    if (!mediaPath.endsWith('/') && !/\.[a-z0-9]{1,6}$/i.test(mediaPath.split('/').pop())) mediaPath += '/';
    response.writeHead(308, { Location: mediaPath + url.search, 'Cache-Control': 'public, max-age=300' });
    response.end(); return;
  }
  if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405, { Allow: 'GET, HEAD', 'Cache-Control': 'no-store' }); response.end(); return; }
  counters.requests++;
  const item = { request, response, url };
  if (closing || (active >= capacity && queue.length >= queueLimit)) {
    counters.queueRejected++; temporary(response); return;
  }
  if (active < capacity) { void serve(item); return; }
  item.timer = setTimeout(() => {
    const index = queue.indexOf(item);
    if (index >= 0) queue.splice(index, 1);
    counters.queueRejected++;
    temporary(response);
  }, queueMs);
  queue.push(item);
  counters.maxQueued = Math.max(counters.maxQueued, queue.length);
  response.once('close', () => {
    const index = queue.indexOf(item);
    if (index >= 0) { queue.splice(index, 1); clearTimeout(item.timer); }
  });
});
server.headersTimeout = 5000;
server.requestTimeout = 15000;
server.keepAliveTimeout = 5000;
server.listen(port, '127.0.0.1', () => console.log(JSON.stringify({ event: 'manual-gateway-start', port, workerPorts, capacity, queueLimit })));
function shutdown() {
  closing = true;
  for (const item of queue.splice(0)) { clearTimeout(item.timer); temporary(item.response); }
  server.close(() => { agent.destroy(); process.exit(0); });
  setTimeout(() => process.exit(1), 14000).unref();
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
