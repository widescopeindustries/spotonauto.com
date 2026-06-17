import { Pool, type QueryResultRow } from 'pg';

export type ManualEmbeddingsBackend = 'local' | 'none';

export interface ManualEmbeddingRecord {
  path: string;
  make: string;
  year: number;
  model: string;
  sectionTitle: string;
  contentPreview: string;
  contentFull: string;
  embedding?: number[] | null;
}

export interface ManualEmbeddingSearchParams {
  embedding: number[];
  make: string;
  year: number;
  model?: string;
  maxResults: number;
  threshold: number;
}

export interface ManualEmbeddingSearchRow {
  id: string;
  path: string;
  make: string;
  year: number;
  model: string;
  sectionTitle: string;
  contentPreview: string;
  contentFull: string;
  similarity: number;
}

export interface ManualSectionMatchRow {
  path: string;
  make: string;
  year: number;
  model: string;
  sectionTitle: string;
  contentPreview: string;
  contentFull?: string;
  relevance?: number;
  matchedTerms?: string[];
}

export interface ManualEmbeddingsHealth {
  backend: ManualEmbeddingsBackend;
  ok: boolean;
  totalSections?: number;
  totalMakes?: number;
  totalYears?: number;
  totalMakeYears?: number;
  newestEntry?: string | null;
  error?: string;
}

let localPool: Pool | null | undefined;

function getLocalDatabaseUrl(): string | null {
  return (
    process.env.LOCAL_DATABASE_URL
    || process.env.DATABASE_URL
    || process.env.MANUAL_EMBEDDINGS_DATABASE_URL
    || null
  );
}

function getTimeoutMs(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function getLocalPool(): Pool | null {
  if (localPool !== undefined) return localPool;

  const connectionString = getLocalDatabaseUrl();
  if (!connectionString) {
    localPool = null;
    return localPool;
  }

  localPool = new Pool({
    connectionString,
    max: 25,
    connectionTimeoutMillis: getTimeoutMs(process.env.LOCAL_DATABASE_CONNECT_TIMEOUT_MS, 8000),
    query_timeout: getTimeoutMs(process.env.LOCAL_DATABASE_QUERY_TIMEOUT_MS, 20000),
    statement_timeout: getTimeoutMs(process.env.LOCAL_DATABASE_QUERY_TIMEOUT_MS, 20000),
    idleTimeoutMillis: 10000,
  });

  return localPool;
}

async function ensureLocalSchema(): Promise<void> {
  const pool = getLocalPool();
  if (!pool) return;

  await pool.query(`
    create table if not exists manual_embeddings (
      path text primary key,
      make text not null,
      year integer not null,
      model text not null,
      section_title text not null,
      content_preview text not null,
      content_full text not null,
      embedding jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
    create index if not exists manual_embeddings_make_idx on manual_embeddings (make);
    create index if not exists manual_embeddings_year_idx on manual_embeddings (year);
    create index if not exists manual_embeddings_make_year_idx on manual_embeddings (make, year);
  `);
}

function normalizeEmbedding(embedding: number[]): number[] {
  const magnitude = Math.sqrt(embedding.reduce((sum, value) => sum + value * value, 0));
  if (!Number.isFinite(magnitude) || magnitude === 0) return embedding;
  return embedding.map((value) => value / magnitude);
}

function cosineSimilarity(a: number[], b: number[]): number {
  const length = Math.min(a.length, b.length);
  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < length; i++) {
    const left = a[i] ?? 0;
    const right = b[i] ?? 0;
    dot += left * right;
    magA += left * left;
    magB += right * right;
  }

  if (magA === 0 || magB === 0) return 0;
  return dot / Math.sqrt(magA * magB);
}

function parseEmbedding(value: unknown): number[] | null {
  if (Array.isArray(value)) {
    return value.map((entry) => Number(entry)).filter((entry) => Number.isFinite(entry));
  }

  if (typeof value === 'string') {
    try {
      return parseEmbedding(JSON.parse(value));
    } catch {
      return null;
    }
  }

  return null;
}

function getConfiguredBackend(): ManualEmbeddingsBackend {
  return getLocalDatabaseUrl() ? 'local' : 'none';
}

export function getManualEmbeddingsBackend(): ManualEmbeddingsBackend {
  return getConfiguredBackend();
}

function getModelHints(model?: string): { exact: string; prefix: string } {
  const exact = (model || '').trim();
  const prefix = exact.split(/[\s(/-]+/).filter(Boolean)[0] || '';
  return { exact, prefix };
}

function mapSearchRows<T extends QueryResultRow>(rows: T[]): ManualEmbeddingSearchRow[] {
  return rows.map((row) => ({
    id: String(row.id || row.path || ''),
    path: String(row.path || ''),
    make: String(row.make || ''),
    year: Number(row.year || 0),
    model: String(row.model || ''),
    sectionTitle: String(row.section_title || ''),
    contentPreview: String(row.content_preview || ''),
    contentFull: String(row.content_full || ''),
    similarity: Number(row.similarity || 0),
  }));
}

function mapSectionRows<T extends QueryResultRow>(rows: T[]): ManualSectionMatchRow[] {
  return rows.map((row) => ({
    path: String(row.path || ''),
    make: String(row.make || ''),
    year: Number(row.year || 0),
    model: String(row.model || ''),
    sectionTitle: String(row.section_title || ''),
    contentPreview: String(row.content_preview || ''),
    contentFull: typeof row.content_full === 'string' ? String(row.content_full || '') : undefined,
    relevance: row.relevance !== undefined ? Number(row.relevance || 0) : undefined,
    matchedTerms: Array.isArray((row as { matched_terms?: string[] }).matched_terms)
      ? ((row as { matched_terms?: string[] }).matched_terms || []).map((term) => String(term))
      : undefined,
  }));
}

function sortByModelHints(rows: ManualEmbeddingSearchRow[], model?: string): ManualEmbeddingSearchRow[] {
  const { exact, prefix } = getModelHints(model);
  if (!exact) return rows;

  const lcExact = exact.toLowerCase();
  const lcPrefix = prefix.toLowerCase();

  const rank = (rowModel: string): number => {
    const normalized = rowModel.toLowerCase();
    if (normalized === lcExact) return 0;
    if (normalized.includes(lcExact)) return 1;
    if (lcPrefix && normalized.startsWith(lcPrefix)) return 2;
    if (lcPrefix && normalized.includes(lcPrefix)) return 3;
    return 4;
  };

  return [...rows].sort((a, b) => {
    const rankDiff = rank(a.model) - rank(b.model);
    if (rankDiff !== 0) return rankDiff;
    return b.similarity - a.similarity;
  });
}

function sortSectionMatchesByModelHints(rows: ManualSectionMatchRow[], model?: string): ManualSectionMatchRow[] {
  const { exact, prefix } = getModelHints(model);
  if (!exact) return rows;

  const lcExact = exact.toLowerCase();
  const lcPrefix = prefix.toLowerCase();

  const rank = (rowModel: string): number => {
    const normalized = rowModel.toLowerCase();
    if (normalized === lcExact) return 0;
    if (normalized.includes(lcExact)) return 1;
    if (lcPrefix && normalized.startsWith(lcPrefix)) return 2;
    if (lcPrefix && normalized.includes(lcPrefix)) return 3;
    return 4;
  };

  return [...rows].sort((a, b) => {
    const rankDiff = rank(a.model) - rank(b.model);
    if (rankDiff !== 0) return rankDiff;
    return a.sectionTitle.localeCompare(b.sectionTitle);
  });
}

export async function testManualEmbeddingsConnection(): Promise<ManualEmbeddingsHealth> {
  const backend = getConfiguredBackend();
  if (backend === 'none') {
    return { backend, ok: false, error: 'Local database not configured' };
  }

  const pool = getLocalPool();
  if (!pool) return { backend, ok: false, error: 'Local database not configured' };

  try {
    await ensureLocalSchema();
    const { rows } = await pool.query(`
      SELECT
        count(*)::int AS total_sections,
        count(distinct make)::int AS total_makes,
        count(distinct year)::int AS total_years,
        count(distinct make || '-' || year)::int AS total_make_years,
        max(created_at)::text AS newest_entry
      FROM manual_embeddings
    `);

    const row = rows[0] || {};
    return {
      backend,
      ok: true,
      totalSections: Number(row.total_sections || 0),
      totalMakes: Number(row.total_makes || 0),
      totalYears: Number(row.total_years || 0),
      totalMakeYears: Number(row.total_make_years || 0),
      newestEntry: row.newest_entry || null,
    };
  } catch (error) {
    return {
      backend,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function getIndexedPaths(make: string, year?: number): Promise<Set<string>> {
  const pool = getLocalPool();
  if (!pool) return new Set();
  await ensureLocalSchema();

  const params: Array<string | number> = [make];
  const filters = ['LOWER(make) = LOWER($1)'];

  if (year) {
    params.push(year);
    filters.push(`year = $${params.length}`);
  }

  const { rows } = await pool.query(
    `SELECT path FROM manual_embeddings WHERE ${filters.join(' AND ')}`,
    params,
  );

  return new Set(rows.map((row) => String(row.path || '')));
}

export async function upsertManualEmbedding(record: ManualEmbeddingRecord): Promise<void> {
  const pool = getLocalPool();
  if (!pool) throw new Error('Local database not configured');
  // Embeddings are optional — allows metadata-only population when API rate limits block generation

  await ensureLocalSchema();

  await pool.query(
    `INSERT INTO manual_embeddings (
      path, make, year, model, section_title, content_preview, content_full, embedding, updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, now())
    ON CONFLICT (path) DO UPDATE SET
      make = EXCLUDED.make,
      year = EXCLUDED.year,
      model = EXCLUDED.model,
      section_title = EXCLUDED.section_title,
      content_preview = EXCLUDED.content_preview,
      content_full = EXCLUDED.content_full,
      embedding = EXCLUDED.embedding,
      updated_at = now()`,
    [
      record.path,
      record.make,
      record.year,
      record.model,
      record.sectionTitle,
      record.contentPreview,
      record.contentFull,
      record.embedding ? JSON.stringify(record.embedding) : null,
    ],
  );
}

export async function searchManualEmbeddings(params: ManualEmbeddingSearchParams): Promise<ManualEmbeddingSearchRow[]> {
  const pool = getLocalPool();
  if (!pool) return [];
  await ensureLocalSchema();

  const { rows } = await pool.query(
    `SELECT
       path,
       make,
       year,
       model,
       section_title,
       content_preview,
       content_full,
       embedding
     FROM manual_embeddings
     WHERE LOWER(make) = LOWER($1)
       AND year = $2`,
    [params.make, params.year],
  );

  const ranked = rows
    .map((row) => {
      const embedding = parseEmbedding(row.embedding);
      if (!embedding) return null;
      const similarity = cosineSimilarity(normalizeEmbedding(params.embedding), normalizeEmbedding(embedding));
      return {
        id: String(row.id || row.path || ''),
        path: String(row.path || ''),
        make: String(row.make || ''),
        year: Number(row.year || 0),
        model: String(row.model || ''),
        sectionTitle: String(row.section_title || ''),
        contentPreview: String(row.content_preview || ''),
        contentFull: String(row.content_full || ''),
        similarity,
      } satisfies ManualEmbeddingSearchRow;
    })
    .filter((row): row is ManualEmbeddingSearchRow => Boolean(row))
    .filter((row) => row.similarity > params.threshold)
    .sort((a, b) => b.similarity - a.similarity);

  return sortByModelHints(ranked, params.model).slice(0, params.maxResults);
}

export async function findManualSectionsByTerms(args: {
  make: string;
  year: number;
  model?: string;
  terms: string[];
  limit: number;
}): Promise<ManualSectionMatchRow[]> {
  const pool = getLocalPool();
  if (!pool) return [];
  await ensureLocalSchema();

  const normalizedTerms = [...new Set(args.terms.map((term) => term.trim().toLowerCase()).filter(Boolean))];
  if (normalizedTerms.length === 0) return [];

  const { exact, prefix } = getModelHints(args.model);
  const modelFilter = exact
    ? `AND (
         LOWER(model) = LOWER($3)
         OR LOWER(model) LIKE LOWER($4)
         OR LOWER(model) LIKE LOWER($5)
       )`
    : '';

  const { rows } = await pool.query(
    `SELECT
       path,
       make,
       year,
       model,
       section_title,
       content_preview,
       content_full
     FROM manual_embeddings
     WHERE LOWER(make) = LOWER($1)
       AND year = $2
       ${modelFilter}`,
    exact
      ? [args.make, args.year, exact, `${prefix}%`, `%${exact}%`]
      : [args.make, args.year],
  );

  const filtered = (rows || [])
    .map((row) => ({
      path: String(row.path || ''),
      make: String(row.make || ''),
      year: Number(row.year || 0),
      model: String(row.model || ''),
      sectionTitle: String(row.section_title || ''),
      contentPreview: String(row.content_preview || ''),
      contentFull: String(row.content_full || ''),
    }))
    .map((row) => {
      const haystack = `${row.sectionTitle} ${row.contentPreview} ${row.contentFull}`.toLowerCase();
      const matchedTerms: string[] = [];
      let score = 0;
      for (const term of normalizedTerms) {
        if (haystack.includes(term)) {
          score += 1;
          matchedTerms.push(term);
        }
      }
      return { row, score, matchedTerms };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ row, matchedTerms, score }) => ({
      path: row.path,
      make: row.make,
      year: row.year,
      model: row.model,
      sectionTitle: row.sectionTitle,
      contentPreview: row.contentPreview,
      contentFull: row.contentFull,
      relevance: score,
      matchedTerms,
    }));

  return sortSectionMatchesByModelHints(filtered, args.model).slice(0, args.limit);
}

export async function findVehicleManualSections(args: {
  make: string;
  year: number;
  model?: string;
  limit: number;
}): Promise<ManualSectionMatchRow[]> {
  const pool = getLocalPool();
  if (!pool) return [];
  await ensureLocalSchema();

  const { exact, prefix } = getModelHints(args.model);
  const modelFilter = exact
    ? `AND (
         LOWER(model) = LOWER($3)
         OR LOWER(model) LIKE LOWER($4)
         OR LOWER(model) LIKE LOWER($5)
       )`
    : '';

  const { rows } = await pool.query(
    `SELECT
       path,
       make,
       year,
       model,
       section_title,
       content_preview,
       content_full
     FROM manual_embeddings
     WHERE LOWER(make) = LOWER($1)
       AND year = $2
       ${modelFilter}
     ORDER BY section_title ASC
     LIMIT $${exact ? 6 : 3}`,
    exact
      ? [args.make, args.year, exact, `${prefix}%`, `%${exact}%`, Math.max(1, args.limit)]
      : [args.make, args.year, Math.max(1, args.limit)],
  );

  return sortSectionMatchesByModelHints(mapSectionRows(rows), args.model);
}

export async function findDiagnosticTroubleCodeIndexes(code: string, limit: number): Promise<Array<{
  path: string;
  make: string;
  year: number;
  model: string;
}>> {
  const pool = getLocalPool();
  if (!pool) return [];
  await ensureLocalSchema();

  const { rows } = await pool.query(
    `SELECT path, make, year, model
     FROM manual_embeddings
     WHERE section_title ILIKE '%Diagnostic Trouble Codes%'
       AND content_full ILIKE $1
     ORDER BY year DESC
     LIMIT $2`,
    [`%${code.toUpperCase()}%`, Math.max(1, limit)],
  );

  return rows.map((row) => ({
    path: String(row.path || ''),
    make: String(row.make || ''),
    year: Number(row.year || 0),
    model: String(row.model || ''),
  }));
}

export async function findDiagnosticTroubleCodeSections(code: string, limit: number): Promise<ManualSectionMatchRow[]> {
  const pool = getLocalPool();
  if (!pool) return [];
  await ensureLocalSchema();

  const { rows } = await pool.query(
    `SELECT
       path,
       make,
       year,
       model,
       section_title,
       content_preview,
       content_full
     FROM manual_embeddings
     WHERE content_full ILIKE $1
       AND (
         section_title ILIKE '%Diagnostic Trouble Codes%'
         OR section_title ILIKE '%Trouble Code%'
         OR section_title ILIKE '%DTC%'
       )
     ORDER BY year DESC, make ASC, model ASC
     LIMIT $2`,
    [`%${code.toUpperCase()}%`, Math.max(1, limit)],
  );

  return mapSectionRows(rows);
}

export async function getSectionByPath(path: string): Promise<ManualSectionMatchRow | null> {
  const pool = getLocalPool();
  if (!pool) return null;
  await ensureLocalSchema();

  const { rows } = await pool.query(
    `SELECT path, make, year, model, section_title, content_preview, content_full
     FROM manual_embeddings WHERE path = $1 LIMIT 1`,
    [path],
  );
  return rows.length ? mapSectionRows(rows)[0] : null;
}

export async function getChildSections(prefixPath: string): Promise<ManualSectionMatchRow[]> {
  const pool = getLocalPool();
  if (!pool) return [];
  await ensureLocalSchema();

  const normalized = prefixPath.replace(/\/+$/, '');
  const { rows } = await pool.query(
    `SELECT path, make, year, model, section_title, content_preview, content_full
     FROM manual_embeddings
     WHERE path LIKE $1 || '%'
       AND path != $1
     ORDER BY section_title ASC
     LIMIT 200`,
    [`${normalized}/`],
  );

  const prefixDepth = normalized.split('/').filter(Boolean).length;
  return mapSectionRows(rows).filter(
    (r) => r.path.split('/').filter(Boolean).length === prefixDepth + 1,
  );
}

// ─── DB-first coverage queries (for manual-navigator) ───────────────────────

export async function getDbCoverageYears(): Promise<number[]> {
  const pool = getLocalPool();
  if (!pool) return [];
  await ensureLocalSchema();

  const { rows } = await pool.query(
    `SELECT DISTINCT year FROM manual_embeddings ORDER BY year DESC`,
  );
  return rows.map((r) => Number(r.year)).filter((y) => Number.isFinite(y));
}

export async function getDbCoverageMakesForYear(year: number): Promise<string[]> {
  const pool = getLocalPool();
  if (!pool) return [];
  await ensureLocalSchema();

  const { rows } = await pool.query(
    `SELECT DISTINCT make FROM manual_embeddings WHERE year = $1 ORDER BY make ASC`,
    [year],
  );
  return rows.map((r) => String(r.make || '')).filter(Boolean);
}

export async function getDbCoverageModelsForYearMake(
  year: number,
  make: string,
): Promise<string[]> {
  const pool = getLocalPool();
  if (!pool) return [];
  await ensureLocalSchema();

  const { rows } = await pool.query(
    `SELECT DISTINCT model FROM manual_embeddings
     WHERE year = $1 AND LOWER(make) = LOWER($2)
     ORDER BY model ASC`,
    [year, make],
  );
  return rows.map((r) => String(r.model || '')).filter(Boolean);
}

export async function getDbCoverageStats(): Promise<{
  makeCount: number;
  modelCount: number;
  comboCount: number;
}> {
  const pool = getLocalPool();
  if (!pool) return { makeCount: 0, modelCount: 0, comboCount: 0 };
  await ensureLocalSchema();

  // Run counts in parallel — each can use its own index, avoiding the
  // single massive sort that PostgreSQL does for multi-column DISTINCT.
  const [makeRes, modelRes, comboRes] = await Promise.all([
    pool.query(`SELECT count(DISTINCT make)::int AS c FROM manual_embeddings`),
    pool.query(`SELECT count(DISTINCT model)::int AS c FROM manual_embeddings`),
    pool.query(`SELECT count(*)::int AS c FROM (SELECT DISTINCT make, model FROM manual_embeddings) t`),
  ]);

  return {
    makeCount: Number(makeRes.rows[0]?.c || 0),
    modelCount: Number(modelRes.rows[0]?.c || 0),
    comboCount: Number(comboRes.rows[0]?.c || 0),
  };
}

export async function isInDbCoverage(
  year: number,
  make: string,
  model: string,
): Promise<boolean> {
  const pool = getLocalPool();
  if (!pool) return false;
  await ensureLocalSchema();

  const { rows } = await pool.query(
    `SELECT 1 FROM manual_embeddings
     WHERE year = $1 AND LOWER(make) = LOWER($2) AND LOWER(model) = LOWER($3)
     LIMIT 1`,
    [year, make, model],
  );
  return rows.length > 0;
}

export interface DbResolvedManualPath {
  path: string;
  exact: boolean;
  candidates: Array<{ label: string; path: string }>;
}

export async function resolveDbManualPath(
  year: number,
  make: string,
  model: string,
): Promise<DbResolvedManualPath | null> {
  const pool = getLocalPool();
  if (!pool) return null;
  await ensureLocalSchema();

  // 1. Exact model match: look for paths like /make/year/model/...
  const exactPrefix = `/${make}/${year}/${model}`;
  const exactStart = `${exactPrefix}/`;
  const exactEnd = `${exactPrefix}0`; // lexicographic upper bound for prefix
  const { rows: exactRows } = await pool.query(
    `SELECT path FROM manual_embeddings
     WHERE path >= $1 AND path < $2
     LIMIT 1`,
    [exactStart, exactEnd],
  );

  if (exactRows.length > 0) {
    const firstPath = String(exactRows[0].path || '');
    // Build the browse path: encode each segment
    const browsePath = firstPath
      .split('/')
      .filter(Boolean)
      .map((s) => encodeURIComponent(s))
      .join('/');
    return {
      path: `/manual/${browsePath}`,
      exact: true,
      candidates: [],
    };
  }

  // 2. Prefix match: any path for this make+year
  const yearPrefix = `/${make}/${year}`;
  const yearStart = `${yearPrefix}/`;
  const yearEnd = `${yearPrefix}0`;
  const { rows: yearRows } = await pool.query(
    `SELECT DISTINCT model FROM manual_embeddings
     WHERE path >= $1 AND path < $2
     LIMIT 20`,
    [yearStart, yearEnd],
  );

  if (yearRows.length === 0) return null;

  // 3. Ambiguous: multiple models for this make+year — offer candidates
  const candidates = yearRows
    .map((r) => String(r.model || ''))
    .filter(Boolean)
    .map((m) => ({
      label: m,
      path: `/manual/${encodeURIComponent(make)}/${encodeURIComponent(String(year))}/${encodeURIComponent(m)}`,
    }));

  return {
    path: `/manual/${encodeURIComponent(make)}/${encodeURIComponent(String(year))}`,
    exact: false,
    candidates,
  };
}
