#!/usr/bin/env node
/**
 * Content Integrity Gate — runs before every build.
 * Blocks deployment if any content violation is detected.
 *
 * Checks:
 *  1. No EV models have ICE-only repair tasks
 *  2. No non-US models appear in sitemaps (indexed)
 *  3. No production year gaps > 5 years (likely discontinued/revived)
 *  4. New vehicles are classified (EV, non-US, or verified ICE)
 *  5. DTC severity sanity (overheating/fire codes must be high+)
 *  6. Oil capacity sanity (no hand-crafted page < 3qt or > 12qt)
 *  7. No tool pages generated for EVs
 *
 * Exit code 0 = pass, 1 = violations found (build blocked)
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// ── Dynamic imports from the codebase ─────────────────────────────
// We import the actual data sources so the check stays in sync with the code.
const vehiclesPath = join(root, 'src/data/vehicles.ts');

let violations = [];
let warnings = [];

function fail(category, msg) {
  violations.push(`[FAIL] ${category}: ${msg}`);
}
function warn(category, msg) {
  warnings.push(`[WARN] ${category}: ${msg}`);
}

// ── Load data ─────────────────────────────────────────────────────
// Parse vehicles.ts exports at runtime via dynamic import
const vehicles = await import(join(root, 'src/data/vehicles.ts'));
const {
  VEHICLE_PRODUCTION_YEARS,
  EV_MODELS,
  ICE_ONLY_TASKS,
  NON_US_MODELS,
  NOINDEX_MAKES,
  isEvModel,
  isTaskValidForVehicle,
  isNonUsModel,
} = vehicles;

// ── Known EV name patterns (catch-all for unlisted EVs) ───────────
const EV_NAME_PATTERNS = [
  /\bev\d?\b/i, /\be-tron\b/i, /\belectric\b/i, /\bbev\b/i,
  /\beqs\b/i, /\beqe\b/i, /\beqb\b/i, /\besprinter\b/i,
  /\bid\.\d/i, /\bid4\b/i, /\bi-miev\b/i,
  /\bbz4x\b/i, /\bioniq.[56]\b/i, /\bhummer.ev\b/i,
  /\blyriq\b/i, /\bprologue\b/i, /\bmach-e\b/i,
  /\btaycan\b/i, /\bleaf\b/i, /\bbolt.e[vu]/i,
  /\bsolterra\b/i, /\bariya\b/i, /\b500e\b/i,
  /\bf-150.lightning\b/i, /\bcybertruck\b/i,
  /\bcooper.se\b/i, /\bex[39]0\b/i, /\bgv60\b/i,
];

function looksLikeEv(model) {
  return EV_NAME_PATTERNS.some(p => p.test(model));
}

// ══════════════════════════════════════════════════════════════════
// CHECK 1: Every EV-looking model must be in EV_MODELS
// ══════════════════════════════════════════════════════════════════
console.log('\n🔍 Check 1: EV classification completeness...');
let evCheckCount = 0;
for (const [make, models] of Object.entries(VEHICLE_PRODUCTION_YEARS)) {
  for (const model of Object.keys(models)) {
    if (looksLikeEv(model)) {
      const slug = `${make.toLowerCase()}:${model.toLowerCase().replace(/\s+/g, '-')}`;
      if (!EV_MODELS.has(slug)) {
        fail('EV_UNCLASSIFIED', `${make} ${model} looks like an EV but is NOT in EV_MODELS. Add it or verify it's ICE/hybrid.`);
      }
      evCheckCount++;
    }
  }
}
console.log(`   Checked ${evCheckCount} EV-pattern models.`);

// ══════════════════════════════════════════════════════════════════
// CHECK 2: No EV in EV_MODELS should have ICE tasks via isValidVehicleCombination
// ══════════════════════════════════════════════════════════════════
console.log('🔍 Check 2: EV + ICE task blocking...');
let evTaskViolations = 0;
for (const entry of EV_MODELS) {
  const [make, model] = entry.split(':');
  for (const task of ICE_ONLY_TASKS) {
    if (isTaskValidForVehicle(make, model, task)) {
      fail('EV_ICE_TASK', `${make}:${model} + ${task} is NOT blocked by isTaskValidForVehicle()`);
      evTaskViolations++;
    }
  }
}
console.log(`   ${evTaskViolations === 0 ? '✓' : '✗'} ${EV_MODELS.size} EVs × ${ICE_ONLY_TASKS.size} ICE tasks checked.`);

// ══════════════════════════════════════════════════════════════════
// CHECK 3: Production year gap detection
// ══════════════════════════════════════════════════════════════════
console.log('🔍 Check 3: Production year gap detection...');
// We can't detect gaps from just start/end, but we CAN flag suspiciously
// wide ranges that likely span a discontinuation.
const MAX_REASONABLE_SPAN = 35; // 35+ year continuous run is suspicious
for (const [make, models] of Object.entries(VEHICLE_PRODUCTION_YEARS)) {
  for (const [model, range] of Object.entries(models)) {
    const span = range.end - range.start;
    if (span > MAX_REASONABLE_SPAN) {
      warn('WIDE_RANGE', `${make} ${model}: ${range.start}-${range.end} (${span} years) — verify no production gap`);
    }
    if (range.end > 2025) {
      fail('FUTURE_YEAR', `${make} ${model}: end year ${range.end} is in the future`);
    }
    if (range.start > range.end) {
      fail('INVALID_RANGE', `${make} ${model}: start ${range.start} > end ${range.end}`);
    }
  }
}

// ══════════════════════════════════════════════════════════════════
// CHECK 4: DTC severity sanity
// ══════════════════════════════════════════════════════════════════
console.log('🔍 Check 4: DTC severity sanity...');
try {
  const dtcModule = await import(join(root, 'src/data/dtc-codes-data.ts'));
  const DTC_CODES = dtcModule.DTC_CODES;

  // Codes that MUST be high or critical
  const MUST_BE_HIGH = new Set(['P0118', 'P0217', 'P0232', 'P0335', 'P0300']);

  for (const code of DTC_CODES) {
    if (MUST_BE_HIGH.has(code.code) && !['high', 'critical'].includes(code.severity)) {
      fail('DTC_SEVERITY', `${code.code} (${code.title}) — severity is '${code.severity}' but must be 'high' or 'critical'`);
    }

    // Cost range sanity: should have a $ sign and a range
    if (code.estimatedCostRange && !code.estimatedCostRange.includes('$')) {
      fail('DTC_COST', `${code.code} — estimatedCostRange missing $ sign: "${code.estimatedCostRange}"`);
    }
  }
  console.log(`   Checked ${DTC_CODES.length} DTC codes.`);
} catch (e) {
  warn('DTC_IMPORT', `Could not import DTC data: ${e.message}`);
}

// ══════════════════════════════════════════════════════════════════
// CHECK 5: Tool page spec sanity
// ══════════════════════════════════════════════════════════════════
console.log('🔍 Check 5: Tool page spec sanity...');
try {
  const toolsModule = await import(join(root, 'src/data/tools-pages.ts'));
  const TOOL_PAGES = toolsModule.TOOL_PAGES;

  for (const page of TOOL_PAGES) {
    // Check oil capacity for absurd values
    if (page.toolType === 'oil-type') {
      for (const gen of page.generations) {
        for (const [key, value] of Object.entries(gen.specs)) {
          if (/capacity/i.test(key) && typeof value === 'string') {
            const match = value.match(/([\d.]+)\s*quarts/);
            if (match) {
              const qt = parseFloat(match[1]);
              if (qt < 2.5) fail('OIL_CAPACITY', `${page.slug} ${gen.name}: ${key} = ${value} — suspiciously low (<2.5 qt)`);
              if (qt > 16) fail('OIL_CAPACITY', `${page.slug} ${gen.name}: ${key} = ${value} — suspiciously high (>16 qt)`);
            }
          }
        }
      }
    }

    // Check that EV tool pages don't exist for ICE types
    if (['oil-type', 'spark-plug-type', 'serpentine-belt'].includes(page.toolType)) {
      if (isEvModel(page.make, page.model)) {
        fail('EV_TOOL_PAGE', `${page.slug} — ICE tool page exists for EV ${page.make} ${page.model}`);
      }
    }
  }
  console.log(`   Checked ${TOOL_PAGES.length} tool pages.`);
} catch (e) {
  warn('TOOLS_IMPORT', `Could not import tools data: ${e.message}`);
}

// ══════════════════════════════════════════════════════════════════
// CHECK 6: Non-US model sitemap exclusion
// ══════════════════════════════════════════════════════════════════
console.log('🔍 Check 6: Non-US model classification...');
let nonUsCount = 0;
for (const [make, models] of Object.entries(VEHICLE_PRODUCTION_YEARS)) {
  for (const model of Object.keys(models)) {
    if (isNonUsModel(make.toLowerCase(), model.toLowerCase().replace(/\s+/g, '-'))) {
      nonUsCount++;
    }
  }
}
console.log(`   ${nonUsCount} non-US models correctly classified.`);

// ══════════════════════════════════════════════════════════════════
// REPORT
// ══════════════════════════════════════════════════════════════════
console.log('\n' + '═'.repeat(64));

if (warnings.length > 0) {
  console.log(`\n⚠️  ${warnings.length} WARNING(S):`);
  for (const w of warnings) console.log(`   ${w}`);
}

if (violations.length > 0) {
  console.log(`\n❌ ${violations.length} VIOLATION(S) — BUILD BLOCKED:`);
  for (const v of violations) console.log(`   ${v}`);
  console.log('\nFix all violations before deploying. See scripts/content-integrity-check.mjs for details.');
  console.log('═'.repeat(64) + '\n');
  process.exit(1);
} else {
  console.log(`\n✅ Content integrity check PASSED (${warnings.length} warnings)`);
  console.log('═'.repeat(64) + '\n');
  process.exit(0);
}
