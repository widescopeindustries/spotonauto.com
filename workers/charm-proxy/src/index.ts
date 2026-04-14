/**
 * Cloudflare Worker: CHARM content proxy.
 *
 * Serves Operation CHARM manual pages from charm.li.
 * Cloudflare's edge cache will handle caching via Cache-Control headers.
 */

export interface Env {
  UPSTREAM: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const pathname = decodeURIComponent(url.pathname);

    if (pathname === '/_health') {
      return new Response('ok', { headers: { 'content-type': 'text/plain' } });
    }

    const isImage = pathname.startsWith('/images/');
    
    // Set cache control for the Cloudflare edge CDN.
    const cacheControl = isImage 
      ? 'public, max-age=604800, s-maxage=604800, stale-while-revalidate=86400' 
      : 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=3600';

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

    if (isImage) {
      const blob = await upstreamRes.arrayBuffer();
      const contentType = upstreamRes.headers.get('content-type') || 'image/png';
      
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
    
    return new Response(html, {
      headers: { 
        'content-type': 'text/html; charset=utf-8', 
        'cache-control': cacheControl, 
        'x-cache': 'MISS' 
      },
    });
  },
};
