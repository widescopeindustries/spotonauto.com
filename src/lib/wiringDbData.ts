import { getLocalPool } from './manualEmbeddingsStore';
import type { WiringDiagramIndex, WiringDiagramSystem, WiringDiagramEntry, WiringImageData } from './wiringData';
import { CHARM_ARCHIVE_BASE } from './charmBase';

async function ensureLocalSchema(): Promise<void> {
  const pool = getLocalPool();
  if (!pool) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS manual_embeddings (
      path TEXT PRIMARY KEY,
      make TEXT NOT NULL,
      year INTEGER NOT NULL,
      model TEXT NOT NULL,
      section_title TEXT NOT NULL,
      content_preview TEXT NOT NULL,
      content_full TEXT NOT NULL,
      embedding JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS manual_embeddings_make_idx ON manual_embeddings (make);
    CREATE INDEX IF NOT EXISTS manual_embeddings_year_idx ON manual_embeddings (year);
    CREATE INDEX IF NOT EXISTS manual_embeddings_make_year_idx ON manual_embeddings (make, year);
  `);
}

function decodeSegment(value: string): string {
  try {
    return decodeURIComponent(value).replace(/\/$/, '');
  } catch {
    return value.replace(/\/$/, '');
  }
}

/** Query DB for distinct model (variant) names for a make/year. */
export async function fetchDbWiringVariants(
  make: string,
  year: string,
): Promise<string[] | null> {
  const pool = getLocalPool();
  if (!pool) return null;
  await ensureLocalSchema();

  const yearNum = Number(year);
  if (!Number.isFinite(yearNum)) return null;

  const { rows } = await pool.query(
    `SELECT DISTINCT model FROM manual_embeddings
     WHERE LOWER(make) = LOWER($1) AND year = $2
     ORDER BY model ASC`,
    [make, yearNum],
  );

  const variants = rows.map((r) => String(r.model || '')).filter(Boolean);
  return variants.length > 0 ? variants : null;
}

/** Build a wiring-diagram index from DB sections whose path or title
 *  looks like a diagram page.  Falls back to null so callers can
 *  scrape CHARM instead. */
export async function fetchDbWiringDiagramIndex(
  make: string,
  year: string,
  variant: string,
): Promise<WiringDiagramIndex | null> {
  const pool = getLocalPool();
  if (!pool) return null;
  await ensureLocalSchema();

  const yearNum = Number(year);
  if (!Number.isFinite(yearNum)) return null;

  // Try exact model match first, then prefix match
  let rows: Array<{
    path: string;
    section_title: string;
  }> = [];

  for (const modelFilter of [
    { col: 'model', op: 'LOWER(model) = LOWER($3)' },
    { col: 'model', op: 'LOWER(model) LIKE LOWER($3) || \'%\'' },
  ]) {
    const result = await pool.query<{ path: string; section_title: string }>(
      `SELECT path, section_title FROM manual_embeddings
       WHERE LOWER(make) = LOWER($1)
         AND year = $2
         AND ${modelFilter.op}
         AND (
           path ILIKE '%diagram%'
           OR section_title ILIKE '%diagram%'
           OR section_title ILIKE '%wiring%'
           OR section_title ILIKE '%schematic%'
           OR section_title ILIKE '%circuit%'
         )
       ORDER BY path ASC
       LIMIT 500`,
      [make, yearNum, variant],
    );
    if (result.rows.length > 0) {
      rows = result.rows;
      break;
    }
  }

  if (rows.length === 0) return null;

  // Group by system inferred from the path.
  // Path pattern: /Make/Year/Variant/.../Diagrams/System/Component/
  // or /Make/Year/Variant/Repair and Diagnosis/System/Diagrams/...
  const systemsMap = new Map<string, WiringDiagramEntry[]>();

  for (const row of rows) {
    const path = String(row.path || '');
    const title = String(row.section_title || '');
    if (!path) continue;

    const segments = path.split('/').filter(Boolean);
    // Skip the first 3 segments (make, year, variant)
    const relevant = segments.slice(3);

    let system = 'General';
    let component = '';
    let subPath = title;

    const diagIdx = relevant.findIndex(
      (s) => decodeSegment(s).toLowerCase() === 'diagrams',
    );

    if (diagIdx >= 0) {
      // System is the segment right before Diagrams (or first segment)
      system = diagIdx > 0 ? decodeSegment(relevant[diagIdx - 1]) : relevant[0];
      const afterDiagrams = relevant.slice(diagIdx + 1);
      component = afterDiagrams.length > 1
        ? afterDiagrams.slice(0, -1).map(decodeSegment).join(' > ')
        : '';
      subPath = afterDiagrams.length > 0
        ? afterDiagrams.map(decodeSegment).join(' > ')
        : title;
    } else {
      // No explicit "Diagrams" folder — infer from title keywords
      const lowerTitle = title.toLowerCase();
      if (lowerTitle.includes('engine')) system = 'Engine';
      else if (lowerTitle.includes('transmission')) system = 'Transmission';
      else if (lowerTitle.includes('abs') || lowerTitle.includes('brake')) system = 'Brakes';
      else if (lowerTitle.includes('airbag')) system = 'Air Bag';
      else if (lowerTitle.includes('hvac') || lowerTitle.includes('climate') || lowerTitle.includes('ac ')) system = 'HVAC';
      else if (lowerTitle.includes('starter')) system = 'Starting';
      else if (lowerTitle.includes('lighting')) system = 'Lighting';
      else if (lowerTitle.includes('radio') || lowerTitle.includes('audio')) system = 'Audio';
      else if (lowerTitle.includes('instrument')) system = 'Instrumentation';
      else if (lowerTitle.includes('power') && lowerTitle.includes('window')) system = 'Body';
      else {
        // Infer from first relevant segment
        system = relevant[0] ? decodeSegment(relevant[0]) : 'General';
      }
    }

    const name = component ? `${component} — ${subPath}` : subPath;

    if (!systemsMap.has(system)) {
      systemsMap.set(system, []);
    }
    systemsMap.get(system)!.push({
      name,
      url: path,
      subPath,
    });
  }

  const systems: WiringDiagramSystem[] = Array.from(systemsMap.entries())
    .map(([system, diagrams]) => ({ system, diagrams }))
    .sort((a, b) => a.system.localeCompare(b.system));

  const totalDiagrams = systems.reduce((sum, s) => sum + s.diagrams.length, 0);

  if (totalDiagrams === 0) return null;

  return {
    vehicle: `${year} ${make} ${variant}`,
    make,
    year,
    variant,
    systems,
    totalDiagrams,
  };
}

/** Try to extract wiring-diagram images from DB-stored HTML.
 *  Returns null if the path isn't in the DB so callers can fall back
 *  to live CHARM scraping. */
export async function fetchDbWiringDiagramImages(
  path: string,
): Promise<WiringImageData | null> {
  const pool = getLocalPool();
  if (!pool) return null;
  await ensureLocalSchema();

  const { rows } = await pool.query<{ section_title: string; content_full: string }>(
    `SELECT section_title, content_full FROM manual_embeddings WHERE path = $1 LIMIT 1`,
    [path],
  );

  if (rows.length === 0) return null;

  const row = rows[0];
  const html = String(row.content_full || '');
  const title = String(row.section_title || '');

  // Extract <img class="big-img" src="...">
  const imageMatches = html.matchAll(/<img[^>]+class=['"]big-img['"][^>]+src=['"]([^'"]+)['"]/g);
  const images = [...imageMatches].map((match) => {
    const src = match[1];
    if (src.startsWith('http')) return src;
    return `${CHARM_ARCHIVE_BASE}${src}`;
  });

  // Fallback: any large image if big-img class isn't present
  if (images.length === 0) {
    const fallbackMatches = html.matchAll(/<img[^>]+src=['"]([^'"]+)['"][^>]*>/g);
    for (const match of fallbackMatches) {
      const src = match[1];
      if (src.includes('diagram') || src.includes('wiring') || src.includes('schematic')) {
        images.push(src.startsWith('http') ? src : `${CHARM_ARCHIVE_BASE}${src}`);
      }
    }
  }

  return {
    images,
    title,
  };
}
