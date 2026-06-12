import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

const HOST = 'https://alloemmanuals.com';
const PUBLIC_DIR = path.join(process.cwd(), 'public');

async function collectUrlsetSitemaps(dir: string, baseDir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const results: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath);

    if (entry.isDirectory()) {
      const nested = await collectUrlsetSitemaps(fullPath, baseDir);
      results.push(...nested);
      continue;
    }

    if (!entry.name.toLowerCase().endsWith('.xml')) continue;
    if (relativePath.toLowerCase() === 'sitemap_index.xml') continue;

    try {
      const head = await fs.readFile(fullPath, 'utf8').then((s) => s.slice(0, 200));
      if (head.includes('<urlset')) {
        results.push(`${HOST}/${relativePath.replace(/\\/g, '/')}`);
      }
    } catch {
      // ignore unreadable files
    }
  }

  return results;
}

export async function GET() {
  const discovered = await collectUrlsetSitemaps(PUBLIC_DIR, PUBLIC_DIR);
  const sitemaps = [
    `${HOST}/sitemap.xml`,
    ...discovered,
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemaps
    .map((loc) => `  <sitemap><loc>${loc}</loc><lastmod>${new Date().toISOString().split('T')[0]}</lastmod></sitemap>`)
    .join('\n')}\n</sitemapindex>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
