import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Block all AI search engine bots that scrape for free
      {
        userAgent: 'gptbot',
        disallow: '/',
      },
      {
        userAgent: 'anthropic-ai',
        disallow: '/',
      },
      {
        userAgent: 'claudebot',
        disallow: '/',
      },
      {
        userAgent: 'claudebot/1.0',
        disallow: '/',
      },
      {
        userAgent: 'googlebot',
        disallow: '/',
      },
      {
        userAgent: 'bingbot',
        disallow: '/',
      },
      {
        userAgent: 'yahoobot',
        disallow: '/',
      },
      {
        userAgent: 'duckduckbot',
        disallow: '/',
      },
      {
        userAgent: 'perplexitybot',
        disallow: '/',
      },
      {
        userAgent: 'perplexity-user',
        disallow: '/',
      },
      // Block all other bots from JSON payloads and internal APIs
      {
        userAgent: '*',
        disallow: ['/admin/', '/api/internal/', '/api/generate-guide', '/community/*?page=', '/manual/hyperlink/', '/guides/', '/repairs/', '/symptoms/', '/tools/type/', '/manual-navigator', '/*?_rsc=', '/*?_rsc=*'],
        allow: '/',
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
      'https://alloemmanuals.com/tools/sitemap.xml',  // dynamic tool pages sitemap index
      'https://alloemmanuals.com/maintenance/sitemap.xml', // maintenance hub pages (~5,700 vehicles)
    ],
  }
}
