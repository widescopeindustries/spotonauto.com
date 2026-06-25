import { NextRequest, NextResponse } from 'next/server';
import {
  fetchWiringDiagramImages,
  fetchWiringDiagramIndex,
  fetchWiringMakes,
  fetchWiringVariants,
  fetchWiringYears,
} from '@/lib/wiringData';
import {
  fetchDbWiringVariants,
  fetchDbWiringDiagramIndex,
  fetchDbWiringDiagramImages,
} from '@/lib/wiringDbData';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  try {
    if (action === 'makes') {
      const makes = await fetchWiringMakes();
      return NextResponse.json({ makes }, { headers: { 'Cache-Control': 'public, max-age=86400' } });
    }

    if (action === 'years') {
      const make = searchParams.get('make');
      if (!make) return NextResponse.json({ error: 'make required' }, { status: 400 });
      const years = await fetchWiringYears(make);
      return NextResponse.json({ years }, { headers: { 'Cache-Control': 'public, max-age=86400' } });
    }

    if (action === 'variants') {
      const make = searchParams.get('make');
      const year = searchParams.get('year');
      if (!make || !year) return NextResponse.json({ error: 'make and year required' }, { status: 400 });
      // DB-first with graceful fallback
      let variants: string[] = [];
      try {
        const dbVariants = await fetchDbWiringVariants(make, year);
        if (dbVariants) variants = dbVariants;
      } catch { /* DB unavailable — fall through to CHARM */ }
      if (variants.length === 0) {
        variants = await fetchWiringVariants(make, year);
      }
      return NextResponse.json({ variants }, { headers: { 'Cache-Control': 'public, max-age=86400' } });
    }

    if (action === 'diagrams') {
      const make = searchParams.get('make');
      const year = searchParams.get('year');
      const variant = searchParams.get('variant');
      if (!make || !year || !variant) return NextResponse.json({ error: 'make, year, variant required' }, { status: 400 });
      // DB-first with graceful fallback
      let data = null;
      try {
        data = await fetchDbWiringDiagramIndex(make, year, variant);
      } catch { /* DB unavailable — fall through to CHARM */ }
      if (!data) {
        data = await fetchWiringDiagramIndex(make, year, variant);
      }
      if (!data) {
        return NextResponse.json({ error: 'Wiring diagrams not found for this vehicle' }, { status: 404, headers: { 'Cache-Control': 'public, max-age=60' } });
      }
      return NextResponse.json(data, { headers: { 'Cache-Control': 'public, max-age=3600' } });
    }

    if (action === 'image') {
      const url = searchParams.get('url');
      if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 });
      // DB-first with graceful fallback
      let data = null;
      try {
        data = await fetchDbWiringDiagramImages(url);
      } catch { /* DB unavailable — fall through to CHARM */ }
      if (!data) {
        data = await fetchWiringDiagramImages(url);
      }
      return NextResponse.json(data, { headers: { 'Cache-Control': 'public, max-age=86400' } });
    }

    return NextResponse.json({ error: 'Invalid action. Use: makes, years, variants, diagrams, image' }, { status: 400 });
  } catch (error) {
    console.error('[Wiring API]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
