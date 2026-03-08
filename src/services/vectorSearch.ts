/**
 * vectorSearch.ts — RAG vector search service for spotonauto.com
 *
 * Uses Gemini text-embedding-004 to generate query embeddings and
 * Supabase pgvector to find the most relevant factory manual sections
 * for a given repair task + vehicle.
 *
 * ─── INTEGRATION GUIDE ───────────────────────────────────────────────
 *
 * To integrate into geminiService.ts (fetchFromCharmLi function):
 *
 * 1. Import this module:
 *      import { searchManualSections } from './vectorSearch';
 *
 * 2. In fetchFromCharmLi(), BEFORE the existing keyword-matching logic
 *    (around line 231), add a vector search attempt:
 *
 *      // Try RAG vector search first (faster, more relevant results)
 *      const vectorResults = await searchManualSections(task ?? '', {
 *        make,
 *        year: yearNum,
 *        model,
 *      });
 *
 *      if (vectorResults && vectorResults.length > 0) {
 *        // Format vector results the same way keyword results are formatted
 *        const header = `=== Factory Service Manual (Vector Search): ${year} ${make} ${model} ===\n`;
 *        const content = vectorResults
 *          .map(r => `=== ${r.sectionTitle} (relevance: ${(r.similarity * 100).toFixed(0)}%) ===\n${r.contentFull}`)
 *          .join('\n\n');
 *        console.log(`[VECTOR] Found ${vectorResults.length} sections for "${task}"`);
 *        return header + content;
 *      }
 *
 *      // Fall through to existing keyword matching if vector search returned nothing
 *
 * 3. This gives a graceful migration path:
 *    - If the manual_embeddings table is populated, vector search returns results
 *    - If it's empty or fails, returns null, and the existing keyword matching runs
 *    - No behavior change until you run the indexing script
 *
 * 4. Performance notes:
 *    - Vector search is a single Supabase RPC call (typically <200ms)
 *    - Replaces 4-5 sequential HTTP fetches to data.spotonauto.com
 *    - Returns more relevant content (semantic match vs keyword match)
 *    - Content is already extracted text (no HTML parsing needed)
 *
 * ─── END INTEGRATION GUIDE ───────────────────────────────────────────
 */

import { GoogleGenAI } from '@google/genai';
import { getManualEmbeddingsBackend, searchManualEmbeddings } from '@/lib/manualEmbeddingsStore';

// ─── Configuration ───────────────────────────────────────────────────────────

const EMBEDDING_MODEL = 'gemini-embedding-001';

// Initialize Gemini client (reuses the same API key as geminiService.ts)
const geminiApiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenAI({ apiKey: geminiApiKey });

// ─── Types ───────────────────────────────────────────────────────────────────

export interface VectorSearchResult {
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

export interface VehicleFilter {
  make: string;
  year: number;
  model?: string;
}

// ─── Core Functions ──────────────────────────────────────────────────────────

/**
 * Generate a 768-dimensional embedding for a text query using Gemini text-embedding-004.
 * Returns null if embedding generation fails (network error, invalid API key, etc.).
 */
async function generateQueryEmbedding(query: string): Promise<number[] | null> {
  try {
    const response = await genAI.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: query,
      config: {
        taskType: 'RETRIEVAL_QUERY',
        outputDimensionality: 768,
      },
    });

    const embedding = response.embeddings?.[0]?.values;
    if (!embedding || embedding.length !== 768) {
      console.warn('[VECTOR] Unexpected embedding dimensions:', embedding?.length);
      return null;
    }

    return embedding;
  } catch (error) {
    console.error('[VECTOR] Embedding generation failed:', error);
    return null;
  }
}

/**
 * Search for the most relevant factory manual sections for a repair task.
 *
 * @param query - The repair task description (e.g., "replace front brake pads")
 * @param vehicle - Vehicle info to filter results (make is required, year recommended)
 * @param maxResults - Maximum number of results to return (default: 6)
 * @param threshold - Minimum similarity score 0-1 (default: 0.3)
 * @returns Array of matching sections sorted by relevance, or null on failure
 *
 * @example
 *   const results = await searchManualSections('oil change', {
 *     make: 'Toyota',
 *     year: 2010,
 *     model: 'Camry',
 *   });
 */
export async function searchManualSections(
  query: string,
  vehicle: VehicleFilter,
  maxResults: number = 6,
  threshold: number = 0.3
): Promise<VectorSearchResult[] | null> {
  // Guard: don't attempt if env vars are missing
  if (getManualEmbeddingsBackend() === 'none' || !geminiApiKey) {
    console.warn('[VECTOR] Missing environment variables, skipping vector search');
    return null;
  }

  try {
    // Build a semantically rich query by combining the task with vehicle context
    const enrichedQuery = `${vehicle.year} ${vehicle.make} ${vehicle.model || ''} ${query}`.trim();

    // Step 1: Generate the query embedding
    const embedding = await generateQueryEmbedding(enrichedQuery);
    if (!embedding) {
      return null;
    }

    // Step 2: Query the configured embeddings store
    const rows = await searchManualEmbeddings({
      embedding,
      make: vehicle.make,
      year: vehicle.year,
      model: vehicle.model,
      maxResults,
      threshold,
    });

    if (!rows || rows.length === 0) {
      console.log(`[VECTOR] No matches above threshold ${threshold} for "${query}" (${vehicle.make}/${vehicle.year})`);
      return null;
    }

    // Step 3: Map database rows to typed results
    const results: VectorSearchResult[] = rows.map((row) => ({
      id: String(row.id),
      path: row.path,
      make: row.make,
      year: row.year,
      model: row.model || '',
      sectionTitle: row.sectionTitle || '',
      contentPreview: row.contentPreview || '',
      contentFull: row.contentFull || '',
      similarity: row.similarity,
    }));

    console.log(
      `[VECTOR] Found ${results.length} matches for "${query}" ` +
      `(${vehicle.make}/${vehicle.year}), ` +
      `best: ${(results[0].similarity * 100).toFixed(1)}%`
    );

    return results;
  } catch (error) {
    // Never throw — graceful degradation is critical
    console.error('[VECTOR] Search failed:', error);
    return null;
  }
}

/**
 * Generate an embedding for document content (used by the indexing script).
 * Uses RETRIEVAL_DOCUMENT task type for optimal storage embeddings.
 *
 * Exported for use by scripts/index-lmdb-vectors.ts
 */
export async function generateDocumentEmbedding(text: string): Promise<number[] | null> {
  try {
    const response = await genAI.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: text,
      config: {
        taskType: 'RETRIEVAL_DOCUMENT',
        outputDimensionality: 768,
      },
    });

    const embedding = response.embeddings?.[0]?.values;
    if (!embedding || embedding.length !== 768) {
      console.warn('[VECTOR] Unexpected document embedding dimensions:', embedding?.length);
      return null;
    }

    return embedding;
  } catch (error) {
    console.error('[VECTOR] Document embedding generation failed:', error);
    return null;
  }
}
