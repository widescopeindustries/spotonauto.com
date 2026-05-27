import { NextRequest, NextResponse } from 'next/server';
import { getLocalPool } from '@/lib/manualEmbeddingsStore';
import { mineOEMContent, generateProfile } from '@/lib/repairGuideCompiler';
import { slugifyRoutePart, isValidVehicleCombination } from '@/data/vehicles';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const year = searchParams.get('year');
    const make = searchParams.get('make');
    const model = searchParams.get('model');
    const task = searchParams.get('task');

    if (!year || !make || !model || !task) {
      return NextResponse.json(
        { error: 'Missing required query parameters: year, make, model, task' },
        { status: 400 }
      );
    }

    const logTollbitAudit = () => {
      const host = req.headers.get('host') || '';
      const tollbitHost = (process.env.TOLLBIT_HOST || 'tollbit.alloemmanuals.com').toLowerCase();
      const hasRawTollbitToken =
        req.headers.has('tollbittoken') ||
        req.headers.has('x-tollbit-token') ||
        req.headers.has('x-tollbit-key') ||
        req.headers.has('signature') ||
        req.headers.has('signature-input') ||
        req.headers.has('authorization');
      const isTollbit = hasRawTollbitToken || host.toLowerCase() === tollbitHost;
      if (isTollbit) {
        console.log(`[TOLLBIT_AUDIT_DETAIL] type=full path=${req.nextUrl.pathname}`);
      }
    };

    const sMake = slugifyRoutePart(make);
    const sModel = slugifyRoutePart(model);
    const sTask = slugifyRoutePart(task);
    const key = `${year}:${sMake}:${sModel}:${sTask}`;

    // 1. Validate vehicle parameters against known configuration bounds
    if (!isValidVehicleCombination(year, make, model, task)) {
      return NextResponse.json(
        { error: `Invalid vehicle combination: ${year} ${make} ${model} - ${task}` },
        { status: 400 }
      );
    }

    const pool = getLocalPool();
    if (!pool) {
      return NextResponse.json(
        { error: 'Database connection pool is unavailable' },
        { status: 500 }
      );
    }

    // 2. Query cache database
    const { rows } = await pool.query(
      `SELECT profile FROM public.vehicle_repair_profiles WHERE key = $1`,
      [key]
    );

    if (rows && rows.length > 0) {
      logTollbitAudit();
      return NextResponse.json(rows[0].profile);
    }

    // 3. JIT Compilation: Fetch manual excerpts
    console.log(`[JIT Compiler] Missing cache for: ${key}. Starting compilation...`);
    const excerpts = await mineOEMContent(year, make, model, task);

    if (excerpts.length === 0) {
      return NextResponse.json(
        { error: `No relevant OEM manual excerpts found in the database for ${year} ${make} ${model} - ${task}` },
        { status: 404 }
      );
    }

    // 4. Generate structured guide profile
    const profile = await generateProfile(year, make, model, task, excerpts);
    if (!profile) {
      return NextResponse.json(
        { error: 'Failed to generate structured guide profile from manual excerpts' },
        { status: 500 }
      );
    }

    // 5. Store generated profile in database cache
    await pool.query(
      `INSERT INTO public.vehicle_repair_profiles (key, year, make, model, task, profile)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (key) DO UPDATE SET profile = EXCLUDED.profile, updated_at = now()`,
      [key, Number(year), sMake, sModel, sTask, JSON.stringify(profile)]
    );

    console.log(`[JIT Compiler] Successfully generated and cached profile for: ${key}`);
    logTollbitAudit();
    return NextResponse.json(profile);

  } catch (error: any) {
    console.error('API GET Handler Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
