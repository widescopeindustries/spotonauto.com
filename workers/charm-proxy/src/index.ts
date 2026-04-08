/**
 * Cloudflare Worker: CHARM content caching proxy.
 *
 * Serves Operation CHARM manual pages from R2 cache, falling back to
 * charm.li on cache miss (and storing the result for next time).
 *
 * R2 key scheme:  cache/{encoded-url-path}
 * Images cached:  cache/images/{rest-of-path}
 */

export interface Env {
  CACHE: R2Bucket;
  UPSTREAM: string;
}

/** Normalise a URL path into an R2 cache key. */
function cacheKey(pathname: string): string {
  const clean = pathname.replace(/^\/+/, '').replace(/\/+/g, '/');
  return `cache/${clean || '_root'}`;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const pathname = decodeURIComponent(url.pathname);

    if (pathname === '/_health') {
      return new Response('ok', { headers: { 'content-type': 'text/plain' } });
    }

    const key = cacheKey(url.pathname);
    const isImage = pathname.startsWith('/images/');
    const cacheControl = isImage ? 'public, max-age=604800' : 'public, max-age=86400';

    // --- Try R2 cache first ---
    const cached = await env.CACHE.get(key);
    if (cached) {
      const ct = cached.customMetadata?.contentType
        || (isImage ? 'image/png' : 'text/html; charset=utf-8');
      return new Response(cached.body, {
        headers: { 'content-type': ct, 'cache-control': cacheControl, 'x-cache': 'HIT' },
      });
    }

    // --- Cache miss: fetch upstream ---
    const upstream = `${env.UPSTREAM}${url.pathname}`;
    let upstreamRes: Response;
    try {
      upstreamRes = await fetch(upstream, {
        headers: { 'User-Agent': 'SpotOnAuto/1.0 (+https://spotonauto.com) charm-proxy' },
      });
    } catch {
      return new Response('upstream error', { status: 502 });
    }

    if (!upstreamRes.ok) {
      return new Response('not found', { status: upstreamRes.status });
    }

    if (isImage) {
      const blob = await upstreamRes.arrayBuffer();
      const contentType = upstreamRes.headers.get('content-type') || 'image/png';
      // Write to R2 in background
      ctx.waitUntil(
        env.CACHE.put(key, blob, {
          customMetadata: { contentType, cached: new Date().toISOString() },
        })
      );
      return new Response(blob, {
        headers: { 'content-type': contentType, 'cache-control': cacheControl, 'x-cache': 'MISS' },
      });
    }

    // HTML page
    const html = await upstreamRes.text();
    ctx.waitUntil(
      env.CACHE.put(key, html, {
        httpMetadata: { contentType: 'text/html; charset=utf-8' },
        customMetadata: { cached: new Date().toISOString() },
      })
    );

    return new Response(html, {
      headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': cacheControl, 'x-cache': 'MISS' },
    });
  },
};
