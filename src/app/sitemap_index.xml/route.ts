import { NextResponse } from 'next/server';

export async function GET() {
  const sitemaps = [
    'https://alloemmanuals.com/sitemap.xml',
    'https://alloemmanuals.com/vehicles/sitemap.xml',
    'https://alloemmanuals.com/codes/sitemap.xml',
    'https://alloemmanuals.com/manual/sitemap.xml',
    'https://alloemmanuals.com/maintenance/sitemap.xml',
    'https://alloemmanuals.com/repair/winners/sitemap.xml',
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map(url => `  <sitemap>
    <loc>${url}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </sitemap>`).join('\n')}
</sitemapindex>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
