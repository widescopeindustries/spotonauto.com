/**
 * Export vehicle_repair_profiles keys + VEHICLE_REPAIR_SPECS keys
 * to a JSON file for the sitemap generator to consume.
 * Run on the server where the DB is accessible.
 */
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Pool } = pg;

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_PATH = join(ROOT, 'public', 'repair', 'qualified-keys.json');

async function main() {
  const pool = new Pool({
    host: '127.0.0.1',
    port: 5432,
    database: 'spotonauto',
    user: 'spotonauto',
    password: 'spotonauto2026',
  });

  // 1. Get all generated profile keys from DB
  const { rows } = await pool.query(`SELECT key FROM vehicle_repair_profiles`);
  const dbKeys = new Set(rows.map((r) => r.key));

  // 2. Get all VEHICLE_REPAIR_SPECS keys (static file)
  const { VEHICLE_REPAIR_SPECS } = await import(
    join(ROOT, 'src', 'data', 'vehicle-repair-specs.ts')
  );
  const specKeys = new Set(Object.keys(VEHICLE_REPAIR_SPECS));

  // 3. Build qualified URL patterns
  // DB key format: "year:make:model:task"
  // Spec key format: "make-model::task" or "year-make-model::task"
  const qualified = new Set();

  for (const key of dbKeys) {
    const [year, make, model, task] = key.split(':');
    if (year && make && model && task) {
      qualified.add(`/repair/${year}/${make}/${model}/${task}`);
    }
  }

  for (const key of specKeys) {
    const parts = key.split('::');
    if (parts.length === 2) {
      const [vehiclePart, task] = parts;
      const vehicleSegments = vehiclePart.split('-');
      // Check if year-specific: "year-make-model" (3+ segments)
      // or year-agnostic: "make-model" (2+ segments)
      if (vehicleSegments.length >= 3 && /^\d{4}$/.test(vehicleSegments[0])) {
        const year = vehicleSegments[0];
        const make = vehicleSegments[1];
        const model = vehicleSegments.slice(2).join('-');
        qualified.add(`/repair/${year}/${make}/${model}/${task}`);
      }
      // For year-agnostic specs, we can't add to sitemap without year
      // Skip for now — they apply to multiple years
    }
  }

  const output = {
    generatedAt: new Date().toISOString(),
    dbCount: dbKeys.size,
    specCount: specKeys.size,
    totalQualified: qualified.size,
    urls: Array.from(qualified).sort(),
  };

  writeFileSync(OUT_PATH, JSON.stringify(output, null, 2));
  console.log(`Exported ${output.totalQualified} qualified URLs to ${OUT_PATH}`);

  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
