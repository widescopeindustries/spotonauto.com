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
    
    // Set cache control for BOTH the worker and the Cloudflare edge CDN.
    // This fixes the '0% Cache Rate' by allowing the CDN to cache the Worker's response.
    const cacheControl = isImage 
      ? 'public, max-age=604800, s-maxage=604800, stale-while-revalidate=86400' 
      : 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=3600';

    // --- 1. Try R2 cache first ---
    try {
      const cached = await env.CACHE.get(key);
      if (cached) {
        const ct = cached.customMetadata?.contentType
          || (isImage ? 'image/png' : 'text/html; charset=utf-8');
        return new Response(cached.body, {
          headers: { 
            'content-type': ct, 
            'cache-control': cacheControl, 
            'x-cache': 'HIT' 
          },
        });
      }
    } catch (e) {
      console.error(`R2 Cache GET error: ${e instanceof Error ? e.message : String(e)}`);
      // Fall through to upstream if R2 fails (hardening)
    }

    // --- 2. Cache miss or R2 failure: fetch upstream ---
    const upstream = `${env.UPSTREAM}${url.pathname}`;
    let upstreamRes: Response;
    try {
      upstreamRes = await fetch(upstream, {
        headers: { 'User-Agent': 'SpotOnAuto/1.0 (+https://spotonauto.com) charm-proxy' },
        signal: AbortSignal.timeout(10000), // 10s timeout for upstream
      });
    } catch (e) {
      console.error(`Upstream fetch error: ${e instanceof Error ? e.message : String(e)}`);
      return new Response('upstream unreachable', { 
        status: 502,
        headers: { 'cache-control': 'no-store' }
      });
    }

    if (!upstreamRes.ok) {
      // Don't cache errors, but return the status code correctly.
      return new Response(upstreamRes.body, { 
        status: upstreamRes.status,
        headers: { 'cache-control': 'no-store' }
      });
    }

    // --- 3. Success: process and try to cache in background ---
    if (isImage) {
      const blob = await upstreamRes.arrayBuffer();
      const contentType = upstreamRes.headers.get('content-type') || 'image/png';
      
      try {
        ctx.waitUntil(
          env.CACHE.put(key, blob, {
            customMetadata: { contentType, cached: new Date().toISOString() },
          })
        );
      } catch (e) {
        console.error(`R2 Cache PUT error (image): ${e instanceof Error ? e.message : String(e)}`);
      }

      return new Response(blob, {
        headers: { 
          'content-type': contentType, 
          'cache-control': cacheControl, 
          'x-cache': 'MISS' 
        },
      });
    }

    // HTML page
    const html = await upstreamRes.text();
    try {
      ctx.waitUntil(
        env.CACHE.put(key, html, {
          httpMetadata: { contentType: 'text/html; charset=utf-8' },
          customMetadata: { cached: new Date().toISOString() },
        })
      );
    } catch (e) {
      console.error(`R2 Cache PUT error (html): ${e instanceof Error ? e.message : String(e)}`);
    }

    return new Response(html, {
      headers: { 
        'content-type': 'text/html; charset=utf-8', 
        'cache-control': cacheControl, 
        'x-cache': 'MISS' 
      },
    });
  },
};
