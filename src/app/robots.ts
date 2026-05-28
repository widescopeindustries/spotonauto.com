import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
return {
    rules: [
      // Allow major search engines to index public pages (real humans will click)
      {
        userAgent: 'googlebot',
        disallow: ['/admin/', '/api/', '/*?_rsc=', '/*?_rsc=*'],  // Only block internals
        allow: ['/'],
      },
      {
        userAgent: 'bingbot',
        disallow: ['/admin/', '/api/', '/*?_rsc=', '/*?_rsc=*'],
        allow: ['/'],
      },
      {
        userAgent: 'yahoobot',
        disallow: ['/admin/', '/api/', '/*?_rsc=', '/*?_rsc=*'],
        allow: ['/'],
      },
      // Block other bots from JSON payloads and internal APIs
      {
        userAgent: '*',
        disallow: ['/admin/', '/api/internal/', '/api/generate-guide', '/community/*?page=', '/manual/hyperlink/', '/guides/', '/repairs/', '/symptoms/', '/tools/type/', '/manual-navigator', '/*?_rsc=', '/*?_rsc=*'],
        allow: ['/'],
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
