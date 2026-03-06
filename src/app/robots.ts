import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    // List all sitemap entry points explicitly so Googlebot discovers everything.
    // /repair/sitemap.xml is a static sitemap index generated at build time.
    sitemap: [
      'https://spotonauto.com/sitemap.xml',        // main: static pages, tools, guides
      'https://spotonauto.com/community/sitemap.xml', // community threads (dynamic)
      'https://spotonauto.com/codes/sitemap.xml',  // ~300 DTC code pages
      'https://spotonauto.com/repair/sitemap.xml', // repair sitemap index -> chunked child sitemaps
      'https://spotonauto.com/manual/sitemap.xml', // factory service manual browser (82 makes)
    ],
  }
}
