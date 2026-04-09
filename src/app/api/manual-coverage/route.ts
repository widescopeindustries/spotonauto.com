import { NextRequest, NextResponse } from 'next/server';
import {
  getCharmCoverageAvailableYears,
  getCharmCoverageMakesForYear,
  getCharmCoverageModelsForYearMake,
  getCharmCoverageStats,
  getCharmCoverageYears,
  isInCharmCoverage,
} from '@/lib/charmCoverage';

export const revalidate = 86400;

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const action = searchParams.get('action') || 'bootstrap';

  switch (action) {
    case 'bootstrap':
      return NextResponse.json({
        years: getCharmCoverageAvailableYears(),
        stats: getCharmCoverageStats(),
      });

    case 'makes': {
      const year = Number(searchParams.get('year'));
      if (!Number.isFinite(year)) {
        return NextResponse.json({ error: 'Missing or invalid year' }, { status: 400 });
      }

      return NextResponse.json({ makes: getCharmCoverageMakesForYear(year) });
    }

    case 'models': {
      const year = Number(searchParams.get('year'));
      const make = searchParams.get('make') || '';
      if (!Number.isFinite(year) || !make) {
        return NextResponse.json({ error: 'Missing year or make' }, { status: 400 });
      }

      return NextResponse.json({ models: getCharmCoverageModelsForYearMake(year, make) });
    }

    case 'availability': {
      const year = Number(searchParams.get('year'));
      const make = searchParams.get('make') || '';
      const model = searchParams.get('model') || '';
      if (!Number.isFinite(year) || !make || !model) {
        return NextResponse.json({ error: 'Missing year, make, or model' }, { status: 400 });
      }

      return NextResponse.json({
        available: isInCharmCoverage(year, make, model),
        years: getCharmCoverageYears(make, model),
      });
    }

    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }
}
