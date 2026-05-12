#!/usr/bin/env node
/**
 * Split query targets into subagent batches.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const targets = JSON.parse(fs.readFileSync(path.join(__dirname, "query-targets-simple.json"), "utf8"));

// Filter to >= 5 impressions (high-value tier)
const highValue = targets.filter(t => t.impressions >= 5);
console.log(`High-value targets (>=5 impressions): ${highValue.length}`);

// Group by task
const byTask = {};
for (const t of highValue) {
  if (!byTask[t.task]) byTask[t.task] = [];
  byTask[t.task].push(t);
}

// Sort each group by impressions desc
for (const task of Object.keys(byTask)) {
  byTask[task].sort((a, b) => b.impressions - a.impressions);
}

// Create batches of ~15 targets each
const BATCH_SIZE = 15;
const batches = [];

for (const [task, taskTargets] of Object.entries(byTask)) {
  for (let i = 0; i < taskTargets.length; i += BATCH_SIZE) {
    const batch = taskTargets.slice(i, i + BATCH_SIZE);
    batches.push({
      task,
      batchNum: Math.floor(i / BATCH_SIZE) + 1,
      targets: batch,
    });
  }
}

// Write batch files
const batchDir = path.join(__dirname, "batches");
fs.mkdirSync(batchDir, { recursive: true });

const manifest = [];
for (const batch of batches) {
  const inputFile = `batch-${batch.task}-${batch.batchNum}.json`;
  const outputFile = `batch-${batch.task}-${batch.batchNum}-output.json`;
  const inputPath = path.join(batchDir, inputFile);
  const outputPath = path.join(batchDir, outputFile);
  
  fs.writeFileSync(inputPath, JSON.stringify(batch.targets, null, 2));
  
  manifest.push({
    task: batch.task,
    batchNum: batch.batchNum,
    count: batch.targets.length,
    inputFile,
    outputFile,
    inputPath,
    outputPath,
    targets: batch.targets.map(t => `${t.year} ${t.make} ${t.model}`),
  });
}

fs.writeFileSync(path.join(batchDir, "manifest.json"), JSON.stringify(manifest, null, 2));

console.log(`\nCreated ${batches.length} batches:`);
for (const batch of batches) {
  console.log(`  ${batch.task} #${batch.batchNum}: ${batch.targets.length} targets`);
}
console.log(`\nTotal targets in batches: ${highValue.length}`);
