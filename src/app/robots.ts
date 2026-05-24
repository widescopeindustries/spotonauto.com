import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        disallow: ['/admin/', '/api/internal/', '/api/generate-guide', '/community/*?page=', '/manual/hyperlink/', '/guides/', '/repairs/', '/symptoms/', '/tools/type/', '/manual-navigator', '/*?_rsc=', '/*?_rsc=*'],
        allow: '/',
      },
      {
        userAgent: [
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
          'Claude-SearchBot',
          'Meta-Webindexer',
          'meta-webindexer',
          'Amzn-SearchBot',
          'DuckAssistBot',
        ],
        disallow: '/',
      },
    ],
    // List all sitemap entry points explicitly so Googlebot discovers everything.
    // /repair/sitemap.xml is a static sitemap index generated at build time.
    sitemap: [
      'https://alloemmanuals.com/sitemap.xml',        // main: static pages, tools, guides
      'https://alloemmanuals.com/vehicles/sitemap.xml',
      'https://alloemmanuals.com/codes/sitemap.xml',  // ~170 curated DTC code pages
      'https://alloemmanuals.com/repair/sitemap.xml', // repair sitemap index -> chunked child sitemaps
      'https://alloemmanuals.com/manual/sitemap.xml', // factory service manual browser (82 makes)
      'https://alloemmanuals.com/wiring/sitemap.xml', // wiring SEO entry pages
    ],
  }
}
