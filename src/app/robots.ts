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
      'https://spotonauto.com/sitemap.xml',        // main: static pages, tools, guides
      // NOTE: vehicles/sitemap.xml temporarily removed until manual_embeddings
      // backbone is repopulated. Re-enable after npm run health:manual-backbone
      // reports >1 make and >1 year.
      // 'https://spotonauto.com/vehicles/sitemap.xml',
      'https://spotonauto.com/codes/sitemap.xml',  // ~170 curated DTC code pages
      'https://spotonauto.com/community/sitemap.xml', // community threads (dynamic)
      'https://spotonauto.com/repair/sitemap.xml', // repair sitemap index -> chunked child sitemaps
      'https://spotonauto.com/repair/winners/sitemap.xml', // exact Feb winner recrawl set
      'https://spotonauto.com/manual/sitemap.xml', // factory service manual browser (82 makes)
      'https://spotonauto.com/wiring/sitemap.xml', // wiring SEO entry pages
    ],
  }
}
