import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Pool, type QueryResultRow } from 'pg';

export type ManualEmbeddingsBackend = 'vps' | 'supabase' | 'none';

export interface ManualEmbeddingRecord {
  path: string;
  make: string;
  year: number;
  model: string;
  sectionTitle: string;
  contentPreview: string;
  contentFull: string;
  embedding?: number[];
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

let vpsPool: Pool | null | undefined;
let supabaseAdmin: SupabaseClient | null | undefined;

function getConfiguredBackend(): ManualEmbeddingsBackend {
  const explicit = (process.env.MANUAL_EMBEDDINGS_BACKEND || '').trim().toLowerCase();
  if (explicit === 'vps' || explicit === 'supabase' || explicit === 'none') {
    return explicit;
  }

  if (process.env.VPS_DATABASE_URL) return 'vps';
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) return 'supabase';
  return 'none';
}

export function getManualEmbeddingsBackend(): ManualEmbeddingsBackend {
  return getConfiguredBackend();
}

function getModelHints(model?: string): { exact: string; prefix: string } {
  const exact = (model || '').trim();
  const prefix = exact.split(/[\s(/-]+/).filter(Boolean)[0] || '';
  return { exact, prefix };
}

function embeddingToVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(',')}]`;
}

function getVpsPool(): Pool | null {
  if (vpsPool !== undefined) return vpsPool;

  if (!process.env.VPS_DATABASE_URL) {
    vpsPool = null;
    return vpsPool;
  }

  vpsPool = new Pool({
    connectionString: process.env.VPS_DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 4,
  });

  return vpsPool;
}

function getSupabaseAdmin(): SupabaseClient | null {
  if (supabaseAdmin !== undefined) return supabaseAdmin;

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    supabaseAdmin = null;
    return supabaseAdmin;
  }

  supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  return supabaseAdmin;
}

function mapSearchRows<T extends QueryResultRow>(rows: T[]): ManualEmbeddingSearchRow[] {
  return rows.map((row) => ({
    id: String(row.id || ''),
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

export async function testManualEmbeddingsConnection(): Promise<ManualEmbeddingsHealth> {
  const backend = getConfiguredBackend();

  if (backend === 'vps') {
    const pool = getVpsPool();
    if (!pool) return { backend, ok: false, error: 'VPS database not configured' };

    try {
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

  if (backend === 'supabase') {
    const client = getSupabaseAdmin();
    if (!client) return { backend, ok: false, error: 'Supabase admin client not configured' };

    try {
      const { count, error } = await client
        .from('manual_embeddings')
        .select('id', { count: 'exact', head: true });

      if (error) throw error;

      return {
        backend,
        ok: true,
        totalSections: count || 0,
      };
    } catch (error) {
      return {
        backend,
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  return {
    backend,
    ok: false,
    error: 'No manual embeddings backend configured',
  };
}

export async function getIndexedPaths(make: string, year?: number): Promise<Set<string>> {
  const backend = getConfiguredBackend();

  if (backend === 'vps') {
    const pool = getVpsPool();
    if (!pool) return new Set();

    const params: Array<string | number> = [make];
    const filters = ['make = $1'];

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

  if (backend === 'supabase') {
    const client = getSupabaseAdmin();
    if (!client) return new Set();

    let query = client
      .from('manual_embeddings')
      .select('path')
      .eq('make', make);

    if (year) query = query.eq('year', year);

    const { data, error } = await query;
    if (error) throw error;

    return new Set((data || []).map((row: { path: string }) => row.path));
  }

  return new Set();
}

export async function upsertManualEmbedding(record: ManualEmbeddingRecord): Promise<void> {
  const backend = getConfiguredBackend();

  if (backend === 'vps') {
    const pool = getVpsPool();
    if (!pool) throw new Error('VPS database not configured');
    if (!record.embedding) throw new Error('Embedding is required for VPS upsert');

    await pool.query(
      `INSERT INTO manual_embeddings (
        path, make, year, model, section_title, content_preview, content_full, embedding
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8::vector)
      ON CONFLICT (path) DO UPDATE SET
        make = EXCLUDED.make,
        year = EXCLUDED.year,
        model = EXCLUDED.model,
        section_title = EXCLUDED.section_title,
        content_preview = EXCLUDED.content_preview,
        content_full = EXCLUDED.content_full,
        embedding = EXCLUDED.embedding`,
      [
        record.path,
        record.make,
        record.year,
        record.model,
        record.sectionTitle,
        record.contentPreview,
        record.contentFull,
        embeddingToVectorLiteral(record.embedding),
      ],
    );
    return;
  }

  if (backend === 'supabase') {
    const client = getSupabaseAdmin();
    if (!client) throw new Error('Supabase admin client not configured');
    if (!record.embedding) throw new Error('Embedding is required for Supabase upsert');

    const { error } = await client
      .from('manual_embeddings')
      .upsert(
        {
          path: record.path,
          make: record.make,
          year: record.year,
          model: record.model,
          section_title: record.sectionTitle,
          content_preview: record.contentPreview,
          content_full: record.contentFull,
          embedding: JSON.stringify(record.embedding),
        },
        { onConflict: 'path' },
      );

    if (error) throw error;
    return;
  }

  throw new Error('No manual embeddings backend configured');
}

export async function searchManualEmbeddings(params: ManualEmbeddingSearchParams): Promise<ManualEmbeddingSearchRow[]> {
  const backend = getConfiguredBackend();
  const { exact, prefix } = getModelHints(params.model);

  if (backend === 'vps') {
    const pool = getVpsPool();
    if (!pool) return [];

    const vector = embeddingToVectorLiteral(params.embedding);
    const { rows } = await pool.query(
      `SELECT
         id,
         path,
         make,
         year,
         model,
         section_title,
         content_preview,
         content_full,
         1 - (embedding <=> $1::vector) AS similarity
       FROM manual_embeddings
       WHERE make = $2
         AND year = $3
         AND 1 - (embedding <=> $1::vector) > $4
       ORDER BY
         CASE
           WHEN $6::text <> '' AND lower(model) = lower($6) THEN 0
           WHEN $6::text <> '' AND lower(model) LIKE lower('%' || $6 || '%') THEN 1
           WHEN $7::text <> '' AND lower(model) LIKE lower($7 || '%') THEN 2
           WHEN $7::text <> '' AND lower(model) LIKE lower('%' || $7 || '%') THEN 3
           ELSE 4
         END,
         embedding <=> $1::vector
       LIMIT $5`,
      [vector, params.make, params.year, params.threshold, params.maxResults, exact, prefix],
    );

    return mapSearchRows(rows);
  }

  if (backend === 'supabase') {
    const client = getSupabaseAdmin();
    if (!client) return [];

    const { data, error } = await client.rpc('match_manual_sections', {
      query_embedding: params.embedding,
      filter_make: params.make,
      filter_year: params.year,
      match_count: Math.max(params.maxResults * 2, params.maxResults),
      match_threshold: params.threshold,
    });

    if (error) throw error;

    return sortByModelHints(mapSearchRows((data || []) as QueryResultRow[]), params.model)
      .slice(0, params.maxResults);
  }

  return [];
}

export async function findDiagnosticTroubleCodeIndexes(code: string, limit: number): Promise<Array<{
  path: string;
  make: string;
  year: number;
  model: string;
}>> {
  const backend = getConfiguredBackend();

  if (backend === 'vps') {
    const pool = getVpsPool();
    if (!pool) return [];

    const { rows } = await pool.query(
      `SELECT path, make, year, model
       FROM manual_embeddings
       WHERE section_title ILIKE '%Diagnostic Trouble Codes%'
         AND content_full ILIKE $1
       ORDER BY year DESC
       LIMIT $2`,
      [`%${code.toUpperCase()}%`, limit],
    );

    return rows.map((row) => ({
      path: String(row.path || ''),
      make: String(row.make || ''),
      year: Number(row.year || 0),
      model: String(row.model || ''),
    }));
  }

  if (backend === 'supabase') {
    const client = getSupabaseAdmin();
    if (!client) return [];

    const { data, error } = await client
      .from('manual_embeddings')
      .select('path, make, year, model')
      .ilike('section_title', '%Diagnostic Trouble Codes%')
      .ilike('content_full', `%${code.toUpperCase()}%`)
      .order('year', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map((row) => ({
      path: String(row.path || ''),
      make: String(row.make || ''),
      year: Number(row.year || 0),
      model: String(row.model || ''),
    }));
  }

  return [];
}
