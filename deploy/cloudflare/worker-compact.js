const BLOCK_LIST = [
  'ChatGPT-User','GPTBot','OAI-SearchBot',
  'ClaudeBot','Claude-Web','Claude-User','anthropic-ai',
  'PerplexityBot','Perplexity-User',
  'meta-webindexer','meta-externalagent','meta-externalfetcher','FacebookBot',
  'Amazonbot','AmazonAdBot','amzn-searchbot','alexamediabot',
  'cohere-ai','Applebot','applebot-extended','Bytespider',
  'YouBot','Diffbot','CCBot','Timpibot','ImagesiftBot',
  'Omgili','Omgilibot','PetalBot','AhrefsBot','SemrushBot',
  'Moz','DotBot','MJ12bot','Screaming Frog','Sitebulb',
  'DataForSeoBot','webzio','webzio-extended','Turnitin',
  'Copyscape','Sogou','Baiduspider','YandexBot','DuckAssistBot',
];

const ALLOW_LIST = [
  'Googlebot','Bingbot','Googlebot-Mobile','Googlebot-Image',
  'Googlebot-Video','Googlebot-News','AdsBot-Google',
  'Mediapartners-Google','BingPreview','MicrosoftPreview',
];

function isBotRequest(request) {
  const ua = (request.headers.get('User-Agent') || '').toLowerCase();
  for (const a of ALLOW_LIST) if (ua.includes(a.toLowerCase())) return false;
  for (const b of BLOCK_LIST) if (ua.includes(b.toLowerCase())) return true;
  if (/bot|crawl|spider|scraper/.test(ua)) return true;
  if (ua === '') return true;
  return false;
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.hostname.startsWith('tollbit.')) return fetch(request);
    if (
      url.pathname.startsWith('/_next/') ||
      url.pathname.startsWith('/static/') ||
      url.pathname === '/favicon.ico' ||
      url.pathname === '/robots.txt' ||
      url.pathname.includes('sitemap')
    ) {
      return fetch(request);
    }
    if (isBotRequest(request)) {
      let th = 'tollbit.' + url.hostname;
      if (url.hostname.startsWith('www.')) th = 'tollbit.' + url.hostname.slice(4);
      return Response.redirect('https://' + th + url.pathname + url.search, 302);
    }
    return fetch(request);
  },
};
