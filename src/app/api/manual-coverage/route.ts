import { NextRequest, NextResponse } from 'next/server';
import { unstable_noStore as noStore } from 'next/cache';
import {
  getCharmCoverageAvailableYears,
  getCharmCoverageMakesForYear,
  getCharmCoverageModelsForYearMake,
  getCharmCoverageStats,
  getCharmCoverageYears,
  isInCharmCoverage,
  resolveCharmManualPath,
} from '@/lib/charmCoverage';
import {
  getDbCoverageYears,
  getDbCoverageMakesForYear,
  getDbCoverageModelsForYearMake,
  getDbCoverageStats,
  isInDbCoverage,
  resolveDbManualPath,
} from '@/lib/manualEmbeddingsStore';

export const revalidate = 86400;

/** DB-first with static-JSON fallback. The deep indexer populates the
 *  manual_embeddings table; when it has data for a vehicle we serve live
 *  coverage. Otherwise we fall back to the static JSON indices so the
 *  navigator never breaks during indexing. */
export async function GET(req: NextRequest) {
  try {
  const searchParams = req.nextUrl.searchParams;
  const action = searchParams.get('action') || 'bootstrap';

  switch (action) {
    case 'bootstrap': {
      const [dbYears, dbStats] = await Promise.all([
        getDbCoverageYears(),
        getDbCoverageStats(),
      ]);
      // If DB has meaningful data, use it; otherwise static JSON
      const years = dbYears.length > 0 ? dbYears : getCharmCoverageAvailableYears();
      const stats =
        dbStats.makeCount > 0
          ? dbStats
          : getCharmCoverageStats();
      return NextResponse.json({ years, stats });
    }

    case 'makes': {
      const year = Number(searchParams.get('year'));
      if (!Number.isFinite(year)) {
        return NextResponse.json({ error: 'Missing or invalid year' }, { status: 400 });
      }

      const dbMakes = await getDbCoverageMakesForYear(year);
      const makes = dbMakes.length > 0 ? dbMakes : getCharmCoverageMakesForYear(year);
      return NextResponse.json({ makes });
    }

    case 'models': {
      const year = Number(searchParams.get('year'));
      const make = searchParams.get('make') || '';
      if (!Number.isFinite(year) || !make) {
        return NextResponse.json({ error: 'Missing year or make' }, { status: 400 });
      }

      const dbModels = await getDbCoverageModelsForYearMake(year, make);
      const models = dbModels.length > 0 ? dbModels : getCharmCoverageModelsForYearMake(year, make);
      return NextResponse.json({ models });
    }

    case 'availability': {
      const year = Number(searchParams.get('year'));
      const make = searchParams.get('make') || '';
      const model = searchParams.get('model') || '';
      if (!Number.isFinite(year) || !make || !model) {
        return NextResponse.json({ error: 'Missing year, make, or model' }, { status: 400 });
      }

      const dbAvailable = await isInDbCoverage(year, make, model);
      const available = dbAvailable || isInCharmCoverage(year, make, model);
      return NextResponse.json({
        available,
        years: getCharmCoverageYears(make, model),
      });
    }

    case 'resolve': {
      noStore();
      const year = Number(searchParams.get('year'));
      const make = searchParams.get('make') || '';
      const model = searchParams.get('model') || '';
      if (!Number.isFinite(year) || !make || !model) {
        return NextResponse.json({ error: 'Missing year, make, or model' }, { status: 400 });
      }

      const dbResolved = await resolveDbManualPath(year, make, model);
      if (dbResolved) {
        return NextResponse.json(dbResolved);
      }
      const resolved = resolveCharmManualPath(year, make, model);
      return NextResponse.json(resolved);
    }

    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }
  } catch (error) {
    console.error('[ManualCoverage API]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
