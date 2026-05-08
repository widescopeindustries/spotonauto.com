import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        disallow: ['/admin/', '/api/internal/', '/community/*?page=', '/manual/hyperlink/'],
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
      'https://alloemmanuals.com/repair/winners/sitemap.xml', // exact Feb winner recrawl set
      'https://alloemmanuals.com/manual/sitemap.xml', // factory service manual browser (82 makes)
      'https://alloemmanuals.com/wiring/sitemap.xml', // wiring SEO entry pages
    ],
  }
}
