/**
 * TollBit Bot Forwarding Worker for alloemmanuals.com
 * Deploy this in Cloudflare Dashboard → Workers & Pages
 * Route: alloemmanuals.com/*
 *
 * This worker intercepts AI bot traffic at the Cloudflare edge and redirects
 * it to your TollBit subdomain BEFORE it ever hits your origin server.
 */

// Comprehensive bot list matching TollBit's known AI agents + common crawlers
const BOT_LIST = [
  'ChatGPT-User',
  'GPTBot',
  'OAI-SearchBot',
  'ClaudeBot',
  'Claude-Web',
  'Claude-User',
  'anthropic-ai',
  'PerplexityBot',
  'Perplexity-User',
  'cohere-ai',
  'meta-webindexer',
  'meta-externalagent',
  'meta-externalfetcher',
  'facebookbot',
  'Amazonbot',
  'AmazonAdBot',
  'amzn-searchbot',
  'Bytespider',
  'YouBot',
  'Diffbot',
  'CCBot',
  'applebot',
  'applebot-extended',
  'timpibot',
  'imagesiftbot',
  'omgili',
  'omgilibot',
  'petalbot',
  'google-extended',
  'AhrefsBot',
  'MJ12bot',
  'SemrushBot',
  'DotBot',
  'bingbot',
  'yandex',
  'baiduspider',
  'duckduckbot',
  'slurp',
];

// Bots that should NEVER be redirected (search engines you want direct)
const ALLOWLIST = [
  'googlebot',
  'bingbot',
];

function isBotRequest(request) {
  const userAgent = (request.headers.get('User-Agent') || '').toLowerCase();

  // Allow good search engines through directly
  for (const allowed of ALLOWLIST) {
    if (userAgent.includes(allowed.toLowerCase())) {
      return false;
    }
  }

  // Check against known AI/crawler bots
  for (const bot of BOT_LIST) {
    if (userAgent.includes(bot.toLowerCase())) {
      return true;
    }
  }

  // Broad catch-all for anything claiming to be a bot/crawler
  if (
    /bot|crawl|spider|scraper/.test(userAgent) &&
    !userAgent.includes('chrome') &&
    !userAgent.includes('safari') &&
    !userAgent.includes('firefox') &&
    !userAgent.includes('edge')
  ) {
    return true;
  }

  return false;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const host = url.hostname;

    // Don't redirect if already on tollbit subdomain
    if (host.startsWith('tollbit.')) {
      return fetch(request);
    }

    // Don't redirect static assets or known endpoints
    if (
      url.pathname.startsWith('/_next/') ||
      url.pathname.startsWith('/static/') ||
      url.pathname === '/favicon.ico' ||
      url.pathname === '/robots.txt' ||
      url.pathname.includes('sitemap')
    ) {
      return fetch(request);
    }

    // Check if this is a bot
    if (isBotRequest(request)) {
      // Build tollbit URL
      let tollbitHost = 'tollbit.' + host;
      if (host.startsWith('www.')) {
        tollbitHost = 'tollbit.' + host.slice(4);
      }

      const tollbitUrl = new URL(url.pathname + url.search, `https://${tollbitHost}`);

      // 302 redirect to TollBit
      return Response.redirect(tollbitUrl.toString(), 302);
    }

    // Normal user — pass through to origin
    return fetch(request);
  },
};
