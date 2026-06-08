import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Search engines
      {
        userAgent: 'googlebot',
        disallow: ['/admin/', '/api/', '/*?_rsc=', '/*?_rsc=*'],
        allow: ['/'],
      },
      {
        userAgent: 'bingbot',
        disallow: ['/admin/', '/api/', '/*?_rsc=', '/*?_rsc=*'],
        allow: ['/'],
      },
      // AI crawlers — explicitly welcome for citation indexing
      {
        userAgent: 'ChatGPT-User',
        disallow: ['/admin/', '/api/', '/*?_rsc=', '/*?_rsc=*'],
        allow: ['/'],
      },
      {
        userAgent: 'GPTBot',
        disallow: ['/admin/', '/api/', '/*?_rsc=', '/*?_rsc=*'],
        allow: ['/'],
      },
      {
        userAgent: 'ClaudeBot',
        disallow: ['/admin/', '/api/', '/*?_rsc=', '/*?_rsc=*'],
        allow: ['/'],
      },
      {
        userAgent: 'Claude-Web',
        disallow: ['/admin/', '/api/', '/*?_rsc=', '/*?_rsc=*'],
        allow: ['/'],
      },
      {
        userAgent: 'PerplexityBot',
        disallow: ['/admin/', '/api/', '/*?_rsc=', '/*?_rsc=*'],
        allow: ['/'],
      },
      {
        userAgent: 'Perplexity-User',
        disallow: ['/admin/', '/api/', '/*?_rsc=', '/*?_rsc=*'],
        allow: ['/'],
      },
      {
        userAgent: 'Amazonbot',
        disallow: ['/admin/', '/api/', '/*?_rsc=', '/*?_rsc=*'],
        allow: ['/'],
      },
      {
        userAgent: 'Meta-ExternalAgent',
        disallow: ['/admin/', '/api/', '/*?_rsc=', '/*?_rsc=*'],
        allow: ['/'],
      },
      {
        userAgent: 'Meta-ExternalFetcher',
        disallow: ['/admin/', '/api/', '/*?_rsc=', '/*?_rsc=*'],
        allow: ['/'],
      },
      {
        userAgent: 'Applebot',
        disallow: ['/admin/', '/api/', '/*?_rsc=', '/*?_rsc=*'],
        allow: ['/'],
      },
      // Block malicious SEO scrapers from everything
      {
        userAgent: 'AhrefsBot',
        disallow: ['/'],
      },
      {
        userAgent: 'SemrushBot',
        disallow: ['/'],
      },
      {
        userAgent: 'MJ12bot',
        disallow: ['/'],
      },
      {
        userAgent: 'DotBot',
        disallow: ['/'],
      },
      // Default: allow public pages, block internals
      {
        userAgent: '*',
        disallow: ['/admin/', '/api/internal/', '/api/generate-guide', '/community/*?page=', '/manual/hyperlink/', '/guides/', '/repairs/', '/symptoms/', '/tools/type/', '/manual-navigator', '/*?_rsc=', '/*?_rsc=*'],
        allow: ['/'],
      },
    ],
    sitemap: [
      'https://alloemmanuals.com/sitemap.xml',
      'https://alloemmanuals.com/vehicles/sitemap.xml',
      'https://alloemmanuals.com/codes/sitemap.xml',
      'https://alloemmanuals.com/repair/sitemap.xml',
      'https://alloemmanuals.com/manual/sitemap.xml',
      'https://alloemmanuals.com/wiring/sitemap.xml',
      'https://alloemmanuals.com/tools/sitemap.xml',
      'https://alloemmanuals.com/maintenance/sitemap.xml',
    ],
  }
}
