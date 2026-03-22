import { readFile } from 'fs/promises';

const XML_HEADERS = {
  'Content-Type': 'application/xml; charset=utf-8',
  'Cache-Control': 'public, max-age=86400, s-maxage=86400',
};

export async function serveXmlFile(path: string) {
  try {
    const body = await readFile(path, 'utf8');
    return new Response(body, { headers: XML_HEADERS });
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') {
      return new Response('Not found', {
        status: 404,
        headers: XML_HEADERS,
      });
    }
    throw error;
  }
}
