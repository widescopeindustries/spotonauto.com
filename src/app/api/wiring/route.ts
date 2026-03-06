import { NextRequest, NextResponse } from 'next/server';

const CHARM_BASE = 'https://data.spotonauto.com';
const CHARM_HEADERS = { 'User-Agent': 'SpotOnAuto/1.0 (+https://spotonauto.com) wiring-diagrams' };

function charmFetchOpts(): RequestInit {
  return {
    headers: CHARM_HEADERS,
    signal: AbortSignal.timeout ? AbortSignal.timeout(15000) : undefined,
  };
}

function extractLinks(html: string): string[] {
  const matches = html.matchAll(/href=['"]([^'"]+)['"]/g);
  return [...matches].map(m => m[1]);
}

function decodeSegment(s: string): string {
  try { return decodeURIComponent(s).replace(/\/$/, ''); }
  catch { return s.replace(/\/$/, ''); }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  try {
    if (action === 'makes') {
      const resp = await fetch(`${CHARM_BASE}/`, charmFetchOpts());
      if (!resp.ok) return NextResponse.json({ error: 'Cannot reach data source' }, { status: 502 });
      const html = await resp.text();
      const links = extractLinks(html);
      const makes = links
        .filter(l => {
          const segs = l.split('/').filter(Boolean);
          return segs.length === 1 && !segs[0].includes('.') && !segs[0].startsWith('_');
        })
        .map(l => decodeSegment(l.split('/').filter(Boolean)[0]))
        .sort();
      return NextResponse.json({ makes }, { headers: { 'Cache-Control': 'public, max-age=86400' } });
    }

    if (action === 'years') {
      const make = searchParams.get('make');
      if (!make) return NextResponse.json({ error: 'make required' }, { status: 400 });
      const resp = await fetch(`${CHARM_BASE}/${encodeURIComponent(make)}/`, charmFetchOpts());
      if (!resp.ok) return NextResponse.json({ error: 'Make not found' }, { status: 404 });
      const html = await resp.text();
      const links = extractLinks(html);
      const years = links
        .map(l => {
          const segs = l.split('/').filter(Boolean);
          return parseInt(segs[segs.length - 1], 10);
        })
        .filter(y => !isNaN(y) && y >= 1982 && y <= 2013)
        .sort((a, b) => b - a);
      return NextResponse.json({ years }, { headers: { 'Cache-Control': 'public, max-age=86400' } });
    }

    if (action === 'variants') {
      const make = searchParams.get('make');
      const year = searchParams.get('year');
      if (!make || !year) return NextResponse.json({ error: 'make and year required' }, { status: 400 });
      const resp = await fetch(`${CHARM_BASE}/${encodeURIComponent(make)}/${year}/`, charmFetchOpts());
      if (!resp.ok) return NextResponse.json({ error: 'Year not found' }, { status: 404 });
      const html = await resp.text();
      const links = extractLinks(html);
      // Variant links are relative (one segment like "Camry%20L4-2.4L/") — exclude nav/breadcrumb links
      const variants = links
        .filter(l => {
          if (l.startsWith('/') || l.startsWith('http') || l.includes('.css') || l.includes('.js')) return false;
          const segs = l.split('/').filter(Boolean);
          return segs.length === 1 && l.endsWith('/');
        })
        .map(l => decodeSegment(l.split('/').filter(Boolean)[0]))
        .sort();
      return NextResponse.json({ variants }, { headers: { 'Cache-Control': 'public, max-age=86400' } });
    }

    if (action === 'diagrams') {
      const make = searchParams.get('make');
      const year = searchParams.get('year');
      const variant = searchParams.get('variant');
      if (!make || !year || !variant) return NextResponse.json({ error: 'make, year, variant required' }, { status: 400 });

      // Fetch the Repair and Diagnosis index — full tree is pre-rendered in HTML
      const rdUrl = `${CHARM_BASE}/${encodeURIComponent(make)}/${year}/${encodeURIComponent(variant)}/Repair%20and%20Diagnosis/`;
      const rdResp = await fetch(rdUrl, charmFetchOpts());
      if (!rdResp.ok) return NextResponse.json({ error: 'Repair data not found' }, { status: 404 });
      const rdHtml = await rdResp.text();

      // Extract all href paths containing "Diagrams/"
      const allLinks = extractLinks(rdHtml);
      const diagramLinks = allLinks.filter(l => l.includes('Diagrams/'));

      // Group by system (first path segment) and sub-component
      const systems: Record<string, { name: string; path: string; subPath: string }[]> = {};
      for (const link of diagramLinks) {
        const parts = link.split('/').filter(Boolean);
        const diagramIdx = parts.findIndex(p => decodeURIComponent(p) === 'Diagrams');
        if (diagramIdx === -1) continue;

        const systemParts = parts.slice(0, diagramIdx);
        const system = decodeSegment(systemParts[0] || 'General');
        const component = systemParts.length > 1 ? systemParts.slice(1).map(s => decodeSegment(s)).join(' > ') : '';
        const diagramType = parts.slice(diagramIdx + 1).map(s => decodeSegment(s)).join(' > ') || 'Diagram';
        const name = component ? `${component} — ${diagramType}` : diagramType;

        if (!systems[system]) systems[system] = [];
        systems[system].push({ name, path: link, subPath: diagramType });
      }

      // Build structured response
      const result = Object.entries(systems)
        .map(([system, items]) => ({
          system,
          diagrams: items.map(item => ({
            name: item.name,
            url: `${rdUrl}${item.path}`,
          })),
        }))
        .sort((a, b) => a.system.localeCompare(b.system));

      return NextResponse.json(
        { vehicle: `${year} ${make} ${decodeSegment(variant)}`, systems: result, totalDiagrams: diagramLinks.length },
        { headers: { 'Cache-Control': 'public, max-age=3600' } }
      );
    }

    if (action === 'image') {
      const url = searchParams.get('url');
      if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 });
      // Fetch the diagram page and extract image URLs
      const resp = await fetch(url, charmFetchOpts());
      if (!resp.ok) return NextResponse.json({ error: 'Page not found' }, { status: 404 });
      const html = await resp.text();
      const imgMatches = html.matchAll(/<img[^>]+class=['"]big-img['"][^>]+src=['"]([^'"]+)['"]/g);
      const images = [...imgMatches].map(m => `${CHARM_BASE}${m[1]}`);
      // Extract page title
      const titleMatch = html.match(/<h1>([^<]+)<\/h1>/);
      const title = titleMatch ? titleMatch[1] : '';
      return NextResponse.json(
        { images, title },
        { headers: { 'Cache-Control': 'public, max-age=86400' } }
      );
    }

    return NextResponse.json({ error: 'Invalid action. Use: makes, years, variants, diagrams, image' }, { status: 400 });
  } catch (error) {
    console.error('[Wiring API]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
