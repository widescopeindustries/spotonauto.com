/**
 * Cloudflare Worker for Tollbit Bot Forwarding
 * 
 * This worker runs at the edge (before requests hit your server).
 * It detects AI bots and redirects them to Tollbit's paywall.
 * Human users and search engines pass through normally.
 * 
 * DEPLOYMENT: I will deploy this for you once Tollbit approves your account.
 * You do NOT need to touch this file.
 */

const BLOCK_LIST = [
  'ChatGPT-User','GPTBot','OAI-SearchBot','openai',
  'ClaudeBot','Claude-Web','Claude-User','Claude-SearchBot','anthropic','claude',
  'PerplexityBot','Perplexity-User',
  'meta-webindexer','meta-externalagent','meta-externalfetcher','FacebookBot','facebook','instagram',
  'Amazonbot','AmazonAdBot','amzn-searchbot','alexamediabot',
  'Applebot','applebot-extended','cohere-ai','cohere','Bytespider',
  'YouBot','Diffbot','CCBot','Timpibot','ImagesiftBot',
  'Omgili','Omgilibot','PetalBot','AhrefsBot','SemrushBot',
  'Moz','DotBot','MJ12bot','Screaming Frog','Sitebulb',
  'DataForSeoBot','webzio','webzio-extended','Turnitin','Copyscape',
  'Sogou','Baiduspider','YandexBot','YandexRenderResources',
  'DuckAssistBot','AI2Bot','Ai2Bot','ai2','jina.ai','mistral','grok','x.ai',
  'Jasper','searchbot','webindexer',
];

const ALLOW_LIST = [
  'Googlebot','Bingbot','Googlebot-Mobile','Googlebot-Image','Googlebot-Video',
  'Googlebot-News','AdsBot-Google','Mediapartners-Google','BingPreview','MicrosoftPreview',
  'DuckDuckBot',
];

function isBotRequest(request) {
  const ua = (request.headers.get('User-Agent') || '').toLowerCase();

  // NEVER redirect TollBit's own crawler
  if (ua.includes('tollbit') || ua.includes('tollbot')) return false;

  for (const a of ALLOW_LIST) if (ua.includes(a.toLowerCase())) return false;
  for (const b of BLOCK_LIST) if (ua.includes(b.toLowerCase())) return true;
  if (/bot|crawl|spider|scraper/.test(ua)) return true;
  if (ua === '') return true;
  return false;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Never redirect on tollbit subdomain (loop prevention)
    if (url.hostname.startsWith('tollbit.')) {
      return fetch(request);
    }

    // Never redirect static assets / crawlers
    if (
      url.pathname.startsWith('/_next/') ||
      url.pathname.startsWith('/static/') ||
      url.pathname === '/favicon.ico' ||
      url.pathname === '/robots.txt' ||
      url.pathname.includes('sitemap')
    ) {
      return fetch(request);
    }

    // Bot check
    if (isBotRequest(request)) {
      let th = 'tollbit.' + url.hostname;
      if (url.hostname.startsWith('www.')) {
        th = 'tollbit.' + url.hostname.slice(4);
      }
      return Response.redirect('https://' + th + url.pathname + url.search, 302);
    }

    return fetch(request);
  },
};
