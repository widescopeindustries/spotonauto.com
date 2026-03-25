#!/usr/bin/env node
/**
 * Build Cross-Vehicle DTC Index
 *
 * Reads all vehicle-data/*.json files from the KG pipeline output.
 * For DTC-type entries, reads the raw HTML to extract actual DTC codes.
 * Builds an inverted index: DTC code -> [vehicles, systems, content hashes].
 *
 * Also builds:
 * - System -> vehicles index (which vehicles have which systems)
 * - Content hash -> vehicles index (shared content across vehicles)
 *
 * Runs on the VPS where the data lives.
 *
 * Usage: node build-cross-vehicle-index.js
 * Output: /data/kg-pipeline/nodes/dtc-vehicle-index.json
 *         /data/kg-pipeline/nodes/system-vehicle-index.json
 *         /data/kg-pipeline/nodes/dtc-codes-full.json
 */

const fs = require("fs");
const path = require("path");

const VD = "/data/kg-pipeline/vehicle-data";
const RAW_HTML = "/data/kg-pipeline/raw-html";
const OUT_DIR = "/data/kg-pipeline/nodes";

// DTC code regex: B/P/C/U followed by 4 digits
const DTC_RE = /\b([BPCU]\d{4})\b/g;

// Track progress
let vehiclesProcessed = 0;
let dtcEntriesScanned = 0;
let htmlFilesRead = 0;
let htmlFilesMissing = 0;
let uniqueDtcCodes = 0;

// Main data structures
// dtcIndex: code -> { vehicles: Set, systems: Set, hashes: Set, titles: Set }
const dtcIndex = {};
// systemIndex: system -> { vehicles: [], dtcCount, procCount, totalCount }
const systemIndex = {};
// Quick vehicle info lookup
const vehicleInfo = {};

function getHtmlPath(hash) {
  return path.join(RAW_HTML, hash.substring(0, 2), hash + ".html");
}

function extractDtcCodes(html) {
  const plain = html.replace(/<[^>]+>/g, " ");
  const matches = plain.match(DTC_RE);
  if (!matches) return [];
  return [...new Set(matches)];
}

function addToDtcIndex(code, vehicleId, system, hash, title) {
  if (!dtcIndex[code]) {
    dtcIndex[code] = {
      vehicles: new Set(),
      systems: new Set(),
      hashes: new Set(),
      titles: new Set(),
    };
    uniqueDtcCodes++;
  }
  dtcIndex[code].vehicles.add(vehicleId);
  dtcIndex[code].systems.add(system);
  dtcIndex[code].hashes.add(hash);
  if (title && title.length > 3 && title.length < 200) {
    dtcIndex[code].titles.add(title);
  }
}

function addToSystemIndex(system, vehicleId, type) {
  if (!systemIndex[system]) {
    systemIndex[system] = { vehicles: new Set(), dtc: 0, procedure: 0, diagram: 0, total: 0 };
  }
  systemIndex[system].vehicles.add(vehicleId);
  systemIndex[system].total++;
  if (type === "dtc" || type === "diagnostic") systemIndex[system].dtc++;
  if (type === "procedure" || type === "testing") systemIndex[system].procedure++;
  if (type === "diagram") systemIndex[system].diagram++;
}

console.log("Cross-Vehicle Index Builder");
console.log("==========================\n");
console.time("total");

// Read all vehicle JSONs
const makes = fs.readdirSync(VD).filter((f) => {
  try { return fs.statSync(path.join(VD, f)).isDirectory(); } catch { return false; }
});

console.log(`Found ${makes.length} makes\n`);

for (const make of makes) {
  const dir = path.join(VD, make);
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));

  for (const file of files) {
    let data;
    try {
      data = JSON.parse(fs.readFileSync(path.join(dir, file), "utf-8"));
    } catch {
      continue;
    }

    const vid = data.v.id;
    vehicleInfo[vid] = {
      make: data.v.make,
      year: data.v.year,
      model: data.v.model,
      variant: data.v.variant,
      slug: data.v.slug,
    };

    for (const [sys, entries] of Object.entries(data.sys)) {
      for (const entry of entries) {
        addToSystemIndex(sys, vid, entry.type);

        // For DTC entries, try to extract actual codes
        if (entry.type === "dtc" || entry.type === "diagnostic") {
          dtcEntriesScanned++;

          // First check if the title IS a DTC code
          const titleMatch = entry.title.match(/^([BPCU]\d{4})$/);
          if (titleMatch) {
            addToDtcIndex(titleMatch[1], vid, sys, entry.hash, entry.title);
            continue;
          }

          // Read HTML to extract codes
          const hp = getHtmlPath(entry.hash);
          if (fs.existsSync(hp)) {
            htmlFilesRead++;
            try {
              const html = fs.readFileSync(hp, "utf-8");
              const codes = extractDtcCodes(html);
              for (const code of codes) {
                addToDtcIndex(code, vid, sys, entry.hash, entry.title);
              }
            } catch {
              // skip unreadable files
            }
          } else {
            htmlFilesMissing++;
          }
        }
      }
    }

    vehiclesProcessed++;
    if (vehiclesProcessed % 1000 === 0) {
      const mem = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
      console.log(
        `  ${vehiclesProcessed} vehicles | ${dtcEntriesScanned} dtc entries | ` +
        `${htmlFilesRead} html read | ${uniqueDtcCodes} unique codes | ${mem}MB`
      );
    }
  }
}

console.log(`\nScanning complete. Building output files...\n`);
console.log(`  Vehicles: ${vehiclesProcessed}`);
console.log(`  DTC entries scanned: ${dtcEntriesScanned}`);
console.log(`  HTML files read: ${htmlFilesRead}`);
console.log(`  HTML files missing: ${htmlFilesMissing}`);
console.log(`  Unique DTC codes: ${uniqueDtcCodes}`);
console.log(`  Unique systems: ${Object.keys(systemIndex).length}`);

// Output 1: DTC -> vehicles index (the main one)
// Format: { "P0420": { count: 47, vehicles: [{id, make, year, model}...], systems: [...] } }
const dtcVehicleIndex = {};
for (const [code, data] of Object.entries(dtcIndex)) {
  const vehicles = [...data.vehicles].map((vid) => {
    const v = vehicleInfo[vid];
    return v ? { id: vid, make: v.make, year: v.year, model: v.model } : { id: vid };
  });

  // Sort vehicles by year desc, then make, then model
  vehicles.sort((a, b) => (b.year || 0) - (a.year || 0) || (a.make || "").localeCompare(b.make || "") || (a.model || "").localeCompare(b.model || ""));

  dtcVehicleIndex[code] = {
    code,
    vehicleCount: vehicles.length,
    systems: [...data.systems].sort(),
    contentHashes: [...data.hashes].slice(0, 10), // keep top 10 for reference
    sampleTitles: [...data.titles].slice(0, 5),
    vehicles,
  };
}

// Sort by code
const sortedDtcIndex = {};
for (const code of Object.keys(dtcVehicleIndex).sort()) {
  sortedDtcIndex[code] = dtcVehicleIndex[code];
}

fs.mkdirSync(path.join(OUT_DIR, "dtcs"), { recursive: true });
fs.writeFileSync(
  path.join(OUT_DIR, "dtcs", "dtc-vehicle-index.json"),
  JSON.stringify(sortedDtcIndex)
);
console.log(`\nWrote dtc-vehicle-index.json (${Object.keys(sortedDtcIndex).length} codes)`);

// Output 2: Compact DTC summary for the site (code -> count + top makes)
const dtcSummary = {};
for (const [code, data] of Object.entries(sortedDtcIndex)) {
  const makeCounts = {};
  for (const v of data.vehicles) {
    makeCounts[v.make] = (makeCounts[v.make] || 0) + 1;
  }
  const topMakes = Object.entries(makeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([make, count]) => ({ make, count }));

  const yearRange = data.vehicles.reduce(
    (acc, v) => {
      if (v.year) {
        acc.min = Math.min(acc.min, v.year);
        acc.max = Math.max(acc.max, v.year);
      }
      return acc;
    },
    { min: 9999, max: 0 }
  );

  dtcSummary[code] = {
    n: data.vehicleCount,
    sys: data.systems.slice(0, 3),
    makes: topMakes,
    yr: yearRange.min < 9999 ? [yearRange.min, yearRange.max] : null,
  };
}

fs.writeFileSync(
  path.join(OUT_DIR, "dtcs", "dtc-summary.json"),
  JSON.stringify(dtcSummary)
);
console.log(`Wrote dtc-summary.json`);

// Output 3: System -> vehicles index
const systemOutput = {};
for (const [sys, data] of Object.entries(systemIndex)) {
  systemOutput[sys] = {
    vehicleCount: data.vehicles.size,
    dtcEntries: data.dtc,
    procedureEntries: data.procedure,
    diagramEntries: data.diagram,
    totalEntries: data.total,
  };
}

fs.writeFileSync(
  path.join(OUT_DIR, "system-vehicle-index.json"),
  JSON.stringify(systemOutput, null, 2)
);
console.log(`Wrote system-vehicle-index.json (${Object.keys(systemOutput).length} systems)`);

// Output 4: Per-DTC code files for the top 2000 codes (by vehicle count)
// These become individual pages on the site
const topCodes = Object.entries(sortedDtcIndex)
  .sort((a, b) => b[1].vehicleCount - a[1].vehicleCount)
  .slice(0, 2000);

let perCodeFiles = 0;
for (const [code, data] of topCodes) {
  const codeLower = code.toLowerCase();
  fs.writeFileSync(
    path.join(OUT_DIR, "dtcs", `${codeLower}.json`),
    JSON.stringify(data)
  );
  perCodeFiles++;
}
console.log(`Wrote ${perCodeFiles} individual DTC code files`);

console.timeEnd("total");
console.log("\nDone!");
