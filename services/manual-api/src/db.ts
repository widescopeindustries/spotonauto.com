import { Pool } from 'pg';

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const connectionString =
      process.env.DATABASE_URL ||
      process.env.MANUAL_EMBEDDINGS_DATABASE_URL ||
      'postgresql://spotonauto:pnjkD6ip8hRXsLEj9A087u71@116.202.210.109:5432/spotonauto';

    pool = new Pool({
      connectionString,
      max: 10,
      connectionTimeoutMillis: 5000,
      query_timeout: 15000,
    });
  }
  return pool;
}

function inferSource(path: string): 'lemon' | 'charm' | 'unknown' {
  if (path.includes('/lemon/') || path.includes('lemon-manuals')) return 'lemon';
  if (path.includes('/charm/') || path.includes('charm.')) return 'charm';
  return 'unknown';
}

export interface ManualSection {
  path: string;
  make: string;
  year: number;
  model: string;
  sectionTitle: string;
  contentPreview: string;
  contentFull?: string;
  source: 'lemon' | 'charm' | 'unknown';
}

function mapRow(row: Record<string, unknown>): ManualSection {
  return {
    path: String(row.path || ''),
    make: String(row.make || ''),
    year: Number(row.year || 0),
    model: String(row.model || ''),
    sectionTitle: String(row.section_title || ''),
    contentPreview: String(row.content_preview || ''),
    contentFull: typeof row.content_full === 'string' ? row.content_full : undefined,
    source: inferSource(String(row.path || '')),
  };
}

export async function searchManuals(args: {
  make?: string;
  year?: number;
  model?: string;
  query?: string;
  limit?: number;
}): Promise<ManualSection[]> {
  const db = getPool();
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (args.make) {
    params.push(args.make);
    conditions.push(`LOWER(make) = LOWER($${params.length})`);
  }
  if (args.year) {
    params.push(args.year);
    conditions.push(`year = $${params.length}`);
  }
  if (args.model) {
    params.push(args.model);
    conditions.push(`LOWER(model) = LOWER($${params.length})`);
  }
  if (args.query) {
    params.push(`%${args.query}%`);
    conditions.push(`(section_title ILIKE $${params.length} OR content_preview ILIKE $${params.length} OR content_full ILIKE $${params.length})`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = Math.min(Math.max(args.limit || 50, 1), 500);

  const { rows } = await db.query(
    `SELECT path, make, year, model, section_title, content_preview, content_full
     FROM manual_embeddings
     ${whereClause}
     ORDER BY section_title ASC
     LIMIT $${params.length + 1}`,
    [...params, limit],
  );

  return rows.map(mapRow);
}

export async function getSectionByPath(path: string): Promise<ManualSection | null> {
  const db = getPool();
  const { rows } = await db.query(
    `SELECT path, make, year, model, section_title, content_preview, content_full
     FROM manual_embeddings WHERE path = $1 LIMIT 1`,
    [path],
  );
  return rows.length ? mapRow(rows[0]) : null;
}

export async function listMakes(): Promise<Array<{ name: string; slug: string; years: number[] }>> {
  const db = getPool();
  const { rows } = await db.query(
    `SELECT make, array_agg(DISTINCT year ORDER BY year DESC) as years
     FROM manual_embeddings GROUP BY make ORDER BY make ASC`,
  );
  return rows.map((row: { make: string; years: number[] }) => ({
    name: row.make,
    slug: row.make.toLowerCase().replace(/\s+/g, '-'),
    years: row.years || [],
  }));
}

export async function listYears(make: string): Promise<number[]> {
  const db = getPool();
  const { rows } = await db.query(
    `SELECT DISTINCT year FROM manual_embeddings WHERE LOWER(make) = LOWER($1) ORDER BY year DESC`,
    [make],
  );
  return rows.map((r: { year: number }) => Number(r.year));
}

export async function listModels(args: { make: string; year: number }): Promise<Array<{ name: string; slug: string }>> {
  const db = getPool();
  const { rows } = await db.query(
    `SELECT DISTINCT model FROM manual_embeddings WHERE LOWER(make) = LOWER($1) AND year = $2 ORDER BY model ASC`,
    [args.make, args.year],
  );
  return rows.map((row: { model: string }) => ({
    name: row.model,
    slug: row.model.toLowerCase().replace(/\s+/g, '-'),
  }));
}

export async function getDtcSections(code: string, make?: string, year?: number): Promise<ManualSection[]> {
  const db = getPool();
  const conditions = [`content_full ILIKE $1`];
  const params: (string | number)[] = [`%${code.toUpperCase()}%`];

  if (make) {
    params.push(make);
    conditions.push(`LOWER(make) = LOWER($${params.length})`);
  }
  if (year) {
    params.push(year);
    conditions.push(`year = $${params.length}`);
  }

  const { rows } = await db.query(
    `SELECT path, make, year, model, section_title, content_preview, content_full
     FROM manual_embeddings
     WHERE ${conditions.join(' AND ')}
       AND (section_title ILIKE '%diagnostic trouble code%' OR section_title ILIKE '%trouble code%' OR section_title ILIKE '%DTC%')
     ORDER BY year DESC, make ASC, model ASC LIMIT 50`,
    params,
  );

  return rows.map(mapRow);
}

export async function getHealth(): Promise<{
  sections: number;
  makes: number;
  years: number;
  makeYears: number;
  newestEntry: string | null;
}> {
  const db = getPool();
  const { rows } = await db.query(
    `SELECT count(*)::int AS sections, count(DISTINCT make)::int AS makes,
            count(DISTINCT year)::int AS years, count(DISTINCT make || '-' || year)::int AS make_years,
            max(created_at)::text AS newest_entry FROM manual_embeddings`,
  );
  const row = rows[0] || {};
  return {
    sections: Number(row.sections || 0),
    makes: Number(row.makes || 0),
    years: Number(row.years || 0),
    makeYears: Number(row.make_years || 0),
    newestEntry: row.newest_entry || null,
  };
}
