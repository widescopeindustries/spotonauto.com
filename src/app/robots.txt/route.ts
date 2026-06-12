import { NextResponse } from 'next/server';

/**
 * Custom robots.txt with Content-Signal directives for AI agent policy.
 * Training crawlers may license data via x402; search/answer bots are allowed.
 */
export async function GET() {
  const body = `User-Agent: googlebot
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /*?_rsc*

User-Agent: bingbot
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /*?_rsc*

User-Agent: ChatGPT-User
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /*?_rsc*

User-Agent: DuckDuckBot
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /*?_rsc*

User-Agent: DuckAssistBot
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /*?_rsc*

User-Agent: GPTBot
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /*?_rsc*

User-Agent: OAI-SearchBot
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /*?_rsc*

User-Agent: ClaudeBot
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /*?_rsc*

User-Agent: Claude-Web
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /*?_rsc*

User-Agent: PerplexityBot
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /*?_rsc*

User-Agent: Perplexity-User
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /*?_rsc*

User-Agent: Amazonbot
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /*?_rsc*

User-Agent: Meta-ExternalAgent
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /*?_rsc*

User-Agent: Meta-ExternalFetcher
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /*?_rsc*

User-Agent: Applebot
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /*?_rsc*

User-Agent: AhrefsBot
Disallow: /

User-Agent: SemrushBot
Disallow: /

User-Agent: MJ12bot
Disallow: /

User-Agent: DotBot
Disallow: /

User-Agent: *
Allow: /
Disallow: /admin/
Disallow: /api/internal/
Disallow: /api/generate-guide
Disallow: /community/*?page=
Disallow: /manual/hyperlink/
Disallow: /guides/
Disallow: /repairs/
Disallow: /symptoms/
Disallow: /tools/type/
Disallow: /manual-navigator
Disallow: /*?_rsc*

Content-Signal: ai-train=licensed, search=yes, ai-input=yes

Host: https://alloemmanuals.com
Sitemap: https://alloemmanuals.com/sitemap_index.xml
`;

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
