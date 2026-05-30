/**
 * Cloudflare Snippet for TollBit Bot Forwarding
 * For Cloudflare Pro / Business / Enterprise plans
 * Location: Rules → Snippets → Create Snippet
 * Route: All incoming requests
 */

const botList = [
  'ChatGPT-User',
  'PerplexityBot',
  'GPTBot',
  'anthropic-ai',
  'CCBot',
  'Claude-Web',
  'ClaudeBot',
  'cohere-ai',
  'YouBot',
  'Diffbot',
  'OAI-SearchBot',
  'meta-externalagent',
  'Timpibot',
  'Amazonbot',
  'Bytespider',
  'Perplexity-User',
  'applebot',
  'facebookbot',
  'google-extended',
  'AhrefsBot',
];

export default {
  async fetch(request) {
    const isBotRequest = checkIfBotRequest(request);

    if (isBotRequest) {
      const path = request.url.replace('https://' + request.headers.get('host'), '');
      let host = request.headers.get('host') || '';
      if (host.startsWith('www.')) {
        host = host.slice(4);
      }
      return Response.redirect('https://tollbit.' + host + path, 302);
    }

    const response = await fetch(request);
    return response;
  },
};

const checkIfBotRequest = (request) => {
  const userAgent = (request.headers.get('User-Agent') || '').toLowerCase();

  // Allow Google and Bing through directly
  if (userAgent.includes('googlebot') || userAgent.includes('bingbot')) {
    return false;
  }

  for (let i = 0; i < botList.length; i++) {
    if (userAgent.includes(botList[i].toLowerCase())) {
      return true;
    }
  }

  return false;
};
