import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    // List all sitemaps explicitly so Googlebot discovers every sub-sitemap.
    // The repair and codes sitemaps are static files in /public — they are NOT
    // referenced from /sitemap.xml (Next.js can't auto-index static XMLs),
    // so they MUST be declared here.
    sitemap: [
      'https://spotonauto.com/sitemap.xml',        // main: static pages, tools, guides
      'https://spotonauto.com/community/sitemap.xml', // community threads (dynamic)
      'https://spotonauto.com/codes/sitemap.xml',  // ~300 DTC code pages
      'https://spotonauto.com/repair/sitemap/0.xml', // repair guides chunk 0
      'https://spotonauto.com/repair/sitemap/1.xml', // repair guides chunk 1
    ],
  }
}
