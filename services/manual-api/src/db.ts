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
  const lower = path.toLowerCase();
  if (lower.includes('/lemon/') || lower.includes('lemon-manuals') || lower.includes('lemon2025')) return 'lemon';
  if (lower.includes('/charm/') || lower.includes('charm.')) return 'charm';
  // Heuristic: paths starting with /Make/Year/Model/ are typically from the lemon archive
  if (/^\/[A-Za-z]+\/\d{4}\//.test(path)) return 'lemon';
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
    contentFull: typeof row.content_full === 'string' ? String(row.content_full || '') : undefined,
    source: inferSource(String(row.path || '')),
  };
}

// ─── Core Search ─────────────────────────────────────────────────────────────

export async function searchManuals(args: {
  make?: string;
  year?: number;
  model?: string;
  query?: string;
  system?: string;
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
    params.push(`%${args.model}%`);
    conditions.push(`LOWER(model) LIKE LOWER($${params.length})`);
  }
  if (args.query) {
    params.push(`%${args.query}%`);
    conditions.push(
      `(section_title ILIKE $${params.length} OR content_preview ILIKE $${params.length} OR content_full ILIKE $${params.length})`
    );
  }
  if (args.system) {
    params.push(`%${args.system}%`);
    conditions.push(`path ILIKE $${params.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = Math.min(Math.max(args.limit || 20, 1), 100);

  const { rows } = await db.query(
    `SELECT path, make, year, model, section_title, content_preview, content_full
     FROM manual_embeddings
     ${whereClause}
     ORDER BY year DESC, make ASC, model ASC, section_title ASC
     LIMIT $${params.length + 1}`,
    [...params, limit],
  );

  return rows.map(mapRow);
}

// ─── Fuzzy / Ranked Search ───────────────────────────────────────────────────

export interface RankedSearchResult extends ManualSection {
  relevance: number;
}

export async function searchManualsRanked(args: {
  make?: string;
  year?: number;
  model?: string;
  query: string;
  limit?: number;
}): Promise<RankedSearchResult[]> {
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
    params.push(`%${args.model}%`);
    conditions.push(`LOWER(model) LIKE LOWER($${params.length})`);
  }

  const queryTerm = args.query.trim();
  params.push(`%${queryTerm}%`);
  const queryParamIndex = params.length;

  // The query term must match at least one field
  conditions.push(
    `(section_title ILIKE $${queryParamIndex} OR content_preview ILIKE $${queryParamIndex} OR content_full ILIKE $${queryParamIndex})`
  );

  const whereClause = `WHERE ${conditions.join(' AND ')}`;
  const limit = Math.min(Math.max(args.limit || 20, 1), 100);

  const { rows } = await db.query(
    `SELECT path, make, year, model, section_title, content_preview, content_full,
      CASE
        WHEN section_title ILIKE $${queryParamIndex} THEN 3
        WHEN content_preview ILIKE $${queryParamIndex} THEN 2
        WHEN content_full ILIKE $${queryParamIndex} THEN 1
        ELSE 0
      END AS relevance
     FROM manual_embeddings
     ${whereClause}
     ORDER BY relevance DESC, year DESC, make ASC, model ASC
     LIMIT $${params.length + 1}`,
    [...params, limit],
  );

  return rows.map((row) => ({
    ...mapRow(row),
    relevance: Number(row.relevance || 0),
  }));
}

// ─── Section by Path ─────────────────────────────────────────────────────────

export async function getSectionByPath(path: string): Promise<ManualSection | null> {
  const db = getPool();
  const { rows } = await db.query(
    `SELECT path, make, year, model, section_title, content_preview, content_full
     FROM manual_embeddings WHERE path = $1 LIMIT 1`,
    [path],
  );
  return rows.length ? mapRow(rows[0]) : null;
}

// ─── Vehicle Discovery ───────────────────────────────────────────────────────

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

/** List all distinct model variants for a make/year, grouped by base model name. */
export async function listVariants(args: { make: string; year: number }): Promise<
  Array<{
    baseModel: string;
    variants: Array<{ name: string; slug: string }>;
  }>
> {
  const models = await listModels(args);
  const grouped = new Map<string, Array<{ name: string; slug: string }>>();

  for (const m of models) {
    // Extract base model: e.g. "Civic EX-L" -> "Civic", "Grand Cherokee 4WD" -> "Grand Cherokee"
    const baseMatch = m.name.match(/^([A-Za-z]+(?:\s+[A-Za-z]+)?)\b/);
    const base = baseMatch ? baseMatch[1] : m.name;
    if (!grouped.has(base)) grouped.set(base, []);
    grouped.get(base)!.push(m);
  }

  return Array.from(grouped.entries())
    .map(([baseModel, variants]) => ({ baseModel, variants }))
    .sort((a, b) => a.baseModel.localeCompare(b.baseModel));
}

// ─── System / Category Discovery ─────────────────────────────────────────────

export async function listSystems(args: { make?: string; year?: number; model?: string }): Promise<string[]> {
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
    params.push(`%${args.model}%`);
    conditions.push(`LOWER(model) LIKE LOWER($${params.length})`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const { rows } = await db.query(
    `SELECT DISTINCT path FROM manual_embeddings ${whereClause} LIMIT 5000`,
    params,
  );

  const systems = new Set<string>();
  for (const row of rows) {
    const path = String(row.path || '');
    // Paths are like /Make/Year/Model/System/Section
    const segments = path.split('/').filter(Boolean);
    if (segments.length >= 4) {
      systems.add(decodeURIComponent(segments[3]));
    }
  }

  return Array.from(systems).sort((a, b) => a.localeCompare(b));
}

// ─── DTC Search ──────────────────────────────────────────────────────────────

export async function getDtcSections(
  code: string,
  make?: string,
  year?: number,
): Promise<ManualSection[]> {
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

// ─── Wiring Diagram Search ───────────────────────────────────────────────────

export async function getWiringDiagramSections(args: {
  make?: string;
  year?: number;
  model?: string;
  system?: string;
  limit?: number;
}): Promise<ManualSection[]> {
  const db = getPool();
  const conditions: string[] = [`(section_title ILIKE '%wiring%' OR section_title ILIKE '%diagram%' OR path ILIKE '%/wiring/%')`];
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
    params.push(`%${args.model}%`);
    conditions.push(`LOWER(model) LIKE LOWER($${params.length})`);
  }
  if (args.system) {
    params.push(`%${args.system}%`);
    conditions.push(`(path ILIKE $${params.length} OR section_title ILIKE $${params.length})`);
  }

  const limit = Math.min(Math.max(args.limit || 20, 1), 100);

  const { rows } = await db.query(
    `SELECT path, make, year, model, section_title, content_preview, content_full
     FROM manual_embeddings
     WHERE ${conditions.join(' AND ')}
     ORDER BY year DESC, make ASC, model ASC, section_title ASC
     LIMIT $${params.length + 1}`,
    [...params, limit],
  );

  return rows.map(mapRow);
}

// ─── Health ──────────────────────────────────────────────────────────────────

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
