/**
 * Cloudflare Worker — Bot Gate for alloemmanuals.com
 * Route: alloemmanuals.com/*
 *
 * Blocks malicious/scraper bots. Allows search engines, AI crawlers, and humans.
 * No Tollbit redirect — AI crawlers are welcome for citation indexing.
 */

const MALICIOUS_BOTS = [
  'AhrefsBot','SemrushBot','DotBot','MJ12bot','DataForSeoBot',
  'webzio','webzio-extended','Screaming Frog','Sitebulb','Turnitin','Copyscape',
  'Sogou','Baiduspider','YandexBot','YandexRenderResources',
];

const ALLOW_LIST = [
  'Googlebot','Bingbot','Googlebot-Mobile','Googlebot-Image','Googlebot-Video',
  'Googlebot-News','AdsBot-Google','Mediapartners-Google','BingPreview','MicrosoftPreview',
  'DuckDuckBot','Applebot','ChatGPT-User','GPTBot','OAI-SearchBot','ClaudeBot',
  'Claude-Web','Claude-User','anthropic','PerplexityBot','Perplexity-User',
  'cohere-ai','Amazonbot','Bytespider','YouBot','Diffbot','CCBot',
  'Meta-ExternalAgent','Meta-ExternalFetcher','Meta-WebIndexer','FacebookBot',
];

function isMaliciousBot(request) {
  const ua = (request.headers.get('User-Agent') || '').toLowerCase();
  if (!ua) return true; // Empty UA = block

  // Always allow known good crawlers
  for (const a of ALLOW_LIST) {
    if (ua.includes(a.toLowerCase())) return false;
  }

  // Block known malicious SEO/scraper bots
  for (const b of MALICIOUS_BOTS) {
    if (ua.includes(b.toLowerCase())) return true;
  }

  // Block generic scrapers that don't claim to be browsers
  if (/bot|crawl|spider|scraper/.test(ua)) {
    // Double-check it's not a browser with "bot" in the UA somehow
    if (!ua.includes('chrome') && !ua.includes('safari') && !ua.includes('firefox') && !ua.includes('edge')) {
      return true;
    }
  }

  return false;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Always pass through static assets
    if (
      url.pathname.startsWith('/_next/') ||
      url.pathname.startsWith('/static/') ||
      url.pathname === '/favicon.ico' ||
      url.pathname === '/robots.txt' ||
      url.pathname.includes('sitemap')
    ) {
      return fetch(request);
    }

    // Block malicious bots at the edge
    if (isMaliciousBot(request)) {
      return new Response('Forbidden', { status: 403 });
    }

    // Everyone else (humans, search engines, AI crawlers) passes through
    return fetch(request);
  },
};
