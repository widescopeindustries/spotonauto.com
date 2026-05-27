import { redirect } from 'next/navigation';
import { slugifyRoutePart } from '@/data/vehicles';

interface PageProps {
  params: Promise<{ path: string[] }>;
}

function safeDecodeSegment(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default async function ManualBrowserRedirectPage({ params }: PageProps) {
  const { path } = await params;
  
  if (!path || path.length === 0) {
    redirect('/maintenance');
  }

  const segments = path.map((s) => safeDecodeSegment(s));

  // Pattern: /manual/[make]/[year]/[model]
  // In the manual database, the order of segments is:
  // index 0: make (e.g. "Toyota")
  // index 1: year (e.g. "2018")
  // index 2: model (e.g. "Camry")
  
  const make = segments[0] ? slugifyRoutePart(segments[0]) : '';
  
  // Clean year segment if it exists
  let year = '';
  if (segments[1]) {
    const parsedYear = parseInt(segments[1], 10);
    if (!isNaN(parsedYear) && parsedYear >= 1900 && parsedYear <= 2030) {
      year = String(parsedYear);
    }
  }

  const model = segments[2] ? slugifyRoutePart(segments[2]) : '';

  if (year && make && model) {
    // Redirect to the proprietary maintenance hub for that exact vehicle
    redirect(`/maintenance/${year}/${make}/${model}`);
  } else if (make) {
    // If we only have make, redirect to the main maintenance page
    redirect('/maintenance');
  } else {
    redirect('/maintenance');
  }
}
