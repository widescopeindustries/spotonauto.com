-- Migration: Add vector embeddings table for RAG-based repair manual retrieval
-- Requires pgvector extension (available on Supabase by default)
-- Run via Supabase Dashboard > SQL Editor, or `supabase db push`

-- 1. Enable the pgvector extension
create extension if not exists vector with schema extensions;

-- 2. Create the manual_embeddings table
create table if not exists public.manual_embeddings (
  id uuid primary key default gen_random_uuid(),
  path text unique not null,               -- LMDB path: /Toyota/2010/Camry.../Repair and Diagnosis/Engine/...
  make text not null,                       -- Vehicle manufacturer (e.g., "Toyota")
  year integer not null,                    -- Model year (e.g., 2010)
  model text not null,                      -- Model/variant name (e.g., "Camry LE (2AZ-FE)")
  section_title text not null,             -- Section name (e.g., "Crankshaft Main Bearing")
  content_preview text,                     -- First ~500 chars for quick retrieval
  content_full text,                        -- Full text content of the page
  embedding extensions.vector(768),         -- Gemini text-embedding-004 produces 768-dim vectors
  created_at timestamptz default now()
);

-- 3. Create indexes for filtering and similarity search
create index if not exists idx_manual_embeddings_make
  on public.manual_embeddings (make);

create index if not exists idx_manual_embeddings_year
  on public.manual_embeddings (year);

create index if not exists idx_manual_embeddings_make_year
  on public.manual_embeddings (make, year);

-- HNSW index for fast approximate nearest neighbor search on embeddings.
-- HNSW is preferred over IVFFlat because:
--   - No training step required (works immediately after insert)
--   - Better recall at similar speed
--   - Supports incremental inserts without degradation
-- m = 16 (connections per node), ef_construction = 64 (build-time quality)
-- Using cosine distance operator (<=>) for normalized embeddings.
create index if not exists idx_manual_embeddings_hnsw
  on public.manual_embeddings
  using hnsw (embedding extensions.vector_cosine_ops)
  with (m = 16, ef_construction = 64);

-- 4. Create the similarity search function
-- Takes a query embedding + optional filters, returns top N matches by cosine similarity.
-- Cosine distance: lower = more similar. We return (1 - distance) as similarity score.
create or replace function public.match_manual_sections(
  query_embedding extensions.vector(768),
  filter_make text default null,
  filter_year integer default null,
  match_count integer default 8,
  match_threshold float default 0.3
)
returns table (
  id uuid,
  path text,
  make text,
  year integer,
  model text,
  section_title text,
  content_preview text,
  content_full text,
  similarity float
)
language plpgsql
as $$
begin
  return query
    select
      me.id,
      me.path,
      me.make,
      me.year,
      me.model,
      me.section_title,
      me.content_preview,
      me.content_full,
      (1 - (me.embedding <=> query_embedding))::float as similarity
    from public.manual_embeddings me
    where
      -- Apply optional filters; when null, match all
      (filter_make is null or me.make = filter_make)
      and (filter_year is null or me.year = filter_year)
      -- Only return results above the similarity threshold
      and (1 - (me.embedding <=> query_embedding)) > match_threshold
    order by me.embedding <=> query_embedding
    limit match_count;
end;
$$;

-- 5. Enable Row Level Security and allow public read access
alter table public.manual_embeddings enable row level security;

-- Public read policy (anyone can search embeddings via the anon key)
create policy "Allow public read access to manual embeddings"
  on public.manual_embeddings
  for select
  using (true);

-- Service role can insert/update/delete (used by the indexing script)
create policy "Allow service role full access to manual embeddings"
  on public.manual_embeddings
  for all
  using (true)
  with check (true);

-- Grant usage to authenticated and anon roles
grant select on public.manual_embeddings to anon;
grant select on public.manual_embeddings to authenticated;
grant all on public.manual_embeddings to service_role;
