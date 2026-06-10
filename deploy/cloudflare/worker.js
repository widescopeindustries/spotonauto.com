/**
 * Cloudflare Worker — Bot Gate for alloemmanuals.com
 * Route: alloemmanuals.com/*
 *
 * Policy:
 * - Allow search engines and AI crawlers that send referral traffic.
 * - Return HTTP 402 to AI crawlers with zero referrals (Meta, Apple, TikTok, Amazon, CCBot, ClaudeBot, GPTBot, OAI-SearchBot, PerplexityBot).
 * - Block malicious SEO scrapers.
 * - Pass through humans and browsers.
 */

const MALICIOUS_BOTS = [
  'AhrefsBot','SemrushBot','DotBot','MJ12bot','DataForSeoBot',
  'webzio','webzio-extended','Screaming Frog','Sitebulb','Turnitin','Copyscape',
  'Sogou','Baiduspider','YandexBot','YandexRenderResources',
];

// Bots that send measurable referral traffic — allowed to crawl
const ALLOW_LIST = [
  'Googlebot','Bingbot','Googlebot-Mobile','Googlebot-Image','Googlebot-Video',
  'Googlebot-News','AdsBot-Google','Mediapartners-Google','BingPreview','MicrosoftPreview',
  'DuckDuckBot','DuckAssistBot','ChatGPT-User',
];

// AI crawlers with zero referrals — paywalled via HTTP 402 / x402 signal
const PAYWALL_LIST = [
  'GPTBot','OAI-SearchBot','ClaudeBot','Claude-Web','anthropic',
  'PerplexityBot','Perplexity-User','Amazonbot','Bytespider','CCBot',
  'Meta-ExternalAgent','Meta-ExternalFetcher','Meta-WebIndexer','FacebookBot',
  'Applebot','TikTok Spider','Bytespider','YouBot','Diffbot',
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
    if (!ua.includes('chrome') && !ua.includes('safari') && !ua.includes('firefox') && !ua.includes('edge')) {
      return true;
    }
  }

  return false;
}

function isPaywalledBot(request) {
  const ua = (request.headers.get('User-Agent') || '').toLowerCase();
  if (!ua) return false;
  for (const p of PAYWALL_LIST) {
    if (ua.includes(p.toLowerCase())) return true;
  }
  return false;
}

function build402Response(request) {
  const url = new URL(request.url);
  return new Response(
    JSON.stringify({
      error: 'Payment Required',
      message: 'This content requires payment for AI training or bulk ingestion. Search engines and citation bots that send referral traffic are exempt. Visit https://alloemmanuals.com/.well-known/acp.json for payment options.',
      policy: 'ai-train=no, search=yes, ai-input=conditional',
      payment_discovery: 'https://alloemmanuals.com/.well-known/acp.json',
      premium_api: 'https://alloemmanuals.com/api/premium-repair-data',
    }),
    {
      status: 402,
      headers: {
        'Content-Type': 'application/json',
        'X-Payment-Required': 'x402',
        'Link': '<https://alloemmanuals.com/.well-known/acp.json>; rel="payment"',
      },
    }
  );
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Always pass through static assets and discovery endpoints
    if (
      url.pathname.startsWith('/_next/') ||
      url.pathname.startsWith('/static/') ||
      url.pathname === '/favicon.ico' ||
      url.pathname === '/robots.txt' ||
      url.pathname.includes('sitemap') ||
      url.pathname.startsWith('/.well-known/')
    ) {
      return fetch(request);
    }

    // Block malicious bots at the edge
    if (isMaliciousBot(request)) {
      return new Response('Forbidden', { status: 403 });
    }

    // Paywall zero-referral AI crawlers on content pages
    if (isPaywalledBot(request)) {
      return build402Response(request);
    }

    // Everyone else (humans, search engines, referral AI crawlers) passes through
    return fetch(request);
  },
};
