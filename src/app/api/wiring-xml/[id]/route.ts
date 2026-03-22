import path from 'path';
import { serveXmlFile } from '@/lib/static-xml';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ id?: string }>;
};

const XML_HEADERS = {
  'Content-Type': 'application/xml; charset=utf-8',
  'Cache-Control': 'public, max-age=86400, s-maxage=86400',
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!id || !/^\d+$/.test(id)) {
    return new Response('Not found', {
      status: 404,
      headers: XML_HEADERS,
    });
  }

  return serveXmlFile(
    path.join(process.cwd(), 'public', 'wiring', 'sitemap', `${id}.xml`),
  );
}
