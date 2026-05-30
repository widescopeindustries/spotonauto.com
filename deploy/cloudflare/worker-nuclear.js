/**
 * TollBit Nuclear Bot Forwarding Worker
 * Catches EVERYTHING except Google/Bing. No exceptions.
 */

const BLOCK_LIST = [
  // OpenAI
  'ChatGPT-User','GPTBot','OAI-SearchBot','openai',
  // Anthropic
  'ClaudeBot','Claude-Web','Claude-User','Claude-SearchBot',
  'anthropic','claude',
  // Perplexity
  'PerplexityBot','Perplexity-User',
  // Meta
  'meta-webindexer','meta-externalagent','meta-externalfetcher',
  'FacebookBot','facebook','instagram',
  // Amazon
  'Amazonbot','AmazonAdBot','amzn-searchbot','alexamediabot',
  // Apple
  'Applebot','applebot-extended',
  // Cohere
  'cohere-ai','cohere',
  // ByteDance / TikTok
  'Bytespider',
  // You.com
  'YouBot',
  // Diffbot
  'Diffbot',
  // Common Crawl
  'CCBot',
  // Timpibot
  'Timpibot',
  // Imagesift
  'ImagesiftBot',
  // Omgili
  'Omgili','Omgilibot',
  // Petal
  'PetalBot',
  // Ahrefs
  'AhrefsBot',
  // SEMrush
  'SemrushBot',
  // Moz
  'Moz','DotBot',
  // Majestic
  'MJ12bot',
  // Screaming Frog
  'Screaming Frog',
  // Sitebulb
  'Sitebulb',
  // DataForSEO
  'DataForSeoBot',
  // Webzio
  'webzio','webzio-extended',
  // Turnitin
  'Turnitin',
  // Copyscape
  'Copyscape',
  // Sogou
  'Sogou',
  // Baidu
  'Baiduspider',
  // Yandex
  'YandexBot','YandexRenderResources',
  // DuckDuckGo AI (NOT regular DuckDuckBot — see allowlist)
  'DuckAssistBot',
  // AI2 / Allen Institute
  'AI2Bot','Ai2Bot','ai2',
  // Jina AI
  'jina.ai',
  // Mistral
  'mistral',
  // Grok / xAI
  'grok','x.ai',
  // Jasper
  'Jasper',
  // Others
  'searchbot','webindexer',
];

const ALLOW_LIST = [
  'Googlebot','Bingbot',
  'Googlebot-Mobile','Googlebot-Image','Googlebot-Video','Googlebot-News',
  'AdsBot-Google','Mediapartners-Google',
  'BingPreview','MicrosoftPreview',
  // Allow DuckDuckGo search crawler (sends traffic)
  'DuckDuckBot',
];

function isBotRequest(request) {
  const ua = (request.headers.get('User-Agent') || '').toLowerCase();

  // Explicit allowlist first
  for (const a of ALLOW_LIST) {
    if (ua.includes(a.toLowerCase())) return false;
  }

  // Explicit block list
  for (const b of BLOCK_LIST) {
    if (ua.includes(b.toLowerCase())) return true;
  }

  // Broad catch-all for anything bot-related
  if (/bot|crawl|spider|scraper/.test(ua)) return true;

  // Empty UA = script/scraper
  if (ua === '') return true;

  return false;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Never redirect on tollbit subdomain
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
