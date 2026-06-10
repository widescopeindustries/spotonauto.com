#!/usr/bin/env node
/**
 * AllOEMManuals Content Generation Orchestrator
 *
 * Master runner that executes the full content pipeline:
 * 1. Repair profile generation (batch-api-worker)
 * 2. DTC batch creation + generation (create-dtc-batches + batch-dtc-worker)
 * 3. Affiliate link enrichment (enrich-affiliate-links)
 * 4. Merge into main JSON
 * 5. Sitemap regeneration
 * 6. IndexNow submission
 *
 * Usage:
 *   node orchestrator.mjs --repair       # Run repair worker only
 *   node orchestrator.mjs --dtc          # Run DTC pipeline only
 *   node orchestrator.mjs --enrich       # Run affiliate enrichment only
 *   node orchestrator.mjs --all          # Run everything
 *   node orchestrator.mjs --repair --dtc # Run repair + DTC
 */

import { execSync } from "child_process";
import { existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const runRepair = args.includes("--repair") || args.includes("--all");
const runDtc = args.includes("--dtc") || args.includes("--all");
const runEnrich = args.includes("--enrich") || args.includes("--all");
const runMerge = args.includes("--merge") || args.includes("--all");
const runSitemaps = args.includes("--sitemaps") || args.includes("--all");

function run(scriptName, description) {
  const scriptPath = join(__dirname, scriptName);
  if (!existsSync(scriptPath)) {
    console.error(`❌ ${description}: script not found at ${scriptPath}`);
    return false;
  }

  console.log(`\n▶ ${description}`);
  console.log(`  ${scriptPath}`);
  try {
    execSync(`node ${scriptPath}`, { stdio: "inherit", cwd: __dirname });
    console.log(`✅ ${description} complete`);
    return true;
  } catch (err) {
    console.error(`❌ ${description} failed with exit code ${err.status}`);
    return false;
  }
}

async function main() {
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║     AllOEMManuals Content Generation Orchestrator            ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log(`Started: ${new Date().toISOString()}`);
  console.log(`Flags: repair=${runRepair}, dtc=${runDtc}, enrich=${runEnrich}, merge=${runMerge}, sitemaps=${runSitemaps}`);

  let success = true;

  if (runRepair) {
    success = run("batch-api-worker.mjs", "Repair Profile Generation (API Worker)") && success;
  }

  if (runDtc) {
    const manifestPath = join(__dirname, "dtc-batches", "manifest.json");
    if (!existsSync(manifestPath)) {
      success = run("create-dtc-batches.mjs", "DTC Batch Creation") && success;
    }
    success = run("batch-dtc-worker.mjs", "DTC Profile Generation (API Worker)") && success;
  }

  if (runEnrich) {
    success = run("enrich-affiliate-links.mjs", "Affiliate Link Enrichment") && success;
  }

  if (runMerge) {
    success = run("merge-profiles.mjs", "Merge Profiles into Main JSON") && success;
  }

  if (runSitemaps) {
    console.log("\n▶ Regenerating sitemaps...");
    try {
      execSync("node generate-repair-sitemaps.mjs", { stdio: "inherit", cwd: join(__dirname, "..") });
      execSync("node generate-tool-sitemaps.mjs", { stdio: "inherit", cwd: join(__dirname, "..") });
      execSync("node generate-vehicle-sitemaps.mjs", { stdio: "inherit", cwd: join(__dirname, "..") });
      console.log("✅ Sitemaps regenerated");
    } catch (err) {
      console.error("❌ Sitemap generation failed:", err.message);
      success = false;
    }
  }

  console.log(`\n═══════════════════════════════════════════════════════════════`);
  console.log(`Finished: ${new Date().toISOString()}`);
  console.log(`Overall: ${success ? "✅ ALL SUCCESS" : "⚠️ SOME STEPS FAILED"}`);
  console.log(`═══════════════════════════════════════════════════════════════`);

  process.exit(success ? 0 : 1);
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
