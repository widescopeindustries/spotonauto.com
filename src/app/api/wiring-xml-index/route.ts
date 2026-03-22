import path from 'path';
import { serveXmlFile } from '@/lib/static-xml';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return serveXmlFile(path.join(process.cwd(), 'public', 'wiring', 'sitemap.xml'));
}
