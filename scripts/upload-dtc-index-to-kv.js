#!/usr/bin/env node
/**
 * Upload DTC cross-vehicle index to Cloudflare KV
 *
 * Reads dtc-summary.json from the KG pipeline output and uploads it
 * to KV as individual per-code entries plus a master index.
 *
 * KV keys:
 *   dtc:summary        -> full summary object (all codes, compact)
 *   dtc:P0420           -> detailed entry for one code (vehicles list)
 *   dtc:index:makes     -> codes grouped by top makes
 *
 * Usage: node upload-dtc-index-to-kv.js
 */

const fs = require("fs");
const https = require("https");

// Load env from pipeline or local .env
let env = {};
for (const envPath of ["/data/kg-pipeline/.env", ".env.local"]) {
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const eq = line.indexOf("=");
      if (eq > 0) env[line.substring(0, eq).trim()] = line.substring(eq + 1).trim();
    }
  }
}

const ACCOUNT_ID = env.CLOUDFLARE_ACCOUNT_ID;
const API_TOKEN = env.CLOUDFLARE_API_TOKEN || env.CLOUDFLARE_KV_API_TOKEN;
const KV_NAMESPACE_ID = env.KV_NAMESPACE_ID || env.CLOUDFLARE_KV_NAMESPACE_ID;
const BATCH_SIZE = 100;

if (!ACCOUNT_ID || !API_TOKEN || !KV_NAMESPACE_ID) {
  console.error("Missing env vars. Need CLOUDFLARE_ACCOUNT_ID, API_TOKEN, KV_NAMESPACE_ID");
  process.exit(1);
}

function kvBulkWrite(pairs) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(pairs);
    const options = {
      hostname: "api.cloudflare.com",
      path: `/client/v4/accounts/${ACCOUNT_ID}/storage/kv/namespaces/${KV_NAMESPACE_ID}/bulk`,
      method: "PUT",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.success) resolve(parsed);
          else reject(new Error("KV API error: " + JSON.stringify(parsed.errors)));
        } catch {
          reject(new Error("Parse error: " + data.substring(0, 500)));
        }
      });
    });
    req.on("error", reject);
    req.setTimeout(120000, () => { req.destroy(); reject(new Error("timeout")); });
    req.write(body);
    req.end();
  });
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function main() {
  console.log("Upload DTC Cross-Vehicle Index to KV");
  console.log("=====================================\n");

  // Load data
  const summaryPath = "/data/kg-pipeline/nodes/dtcs/dtc-summary.json";
  const fullIndexPath = "/data/kg-pipeline/nodes/dtcs/dtc-vehicle-index.json";

  if (!fs.existsSync(summaryPath)) {
    console.error("dtc-summary.json not found. Run build-cross-vehicle-index.js first.");
    process.exit(1);
  }

  const summary = JSON.parse(fs.readFileSync(summaryPath, "utf-8"));
  const codeCount = Object.keys(summary).length;
  console.log(`Loaded summary: ${codeCount} DTC codes\n`);

  // Upload the full summary as one KV entry (for quick lookups)
  const summaryStr = JSON.stringify(summary);
  console.log(`Summary size: ${(Buffer.byteLength(summaryStr) / 1024).toFixed(0)}KB`);

  if (Buffer.byteLength(summaryStr) < 25 * 1024 * 1024) {
    await kvBulkWrite([{ key: "dtc:summary", value: summaryStr }]);
    console.log("Uploaded dtc:summary\n");
  } else {
    console.log("Summary too large for single KV entry, splitting by prefix...");
    const prefixes = {};
    for (const [code, data] of Object.entries(summary)) {
      const prefix = code.charAt(0);
      if (!prefixes[prefix]) prefixes[prefix] = {};
      prefixes[prefix][code] = data;
    }
    const pairs = Object.entries(prefixes).map(([prefix, data]) => ({
      key: `dtc:summary:${prefix}`,
      value: JSON.stringify(data),
    }));
    await kvBulkWrite(pairs);
    console.log(`Uploaded ${pairs.length} summary shards\n`);
  }

  // Upload individual DTC detail files (top 2000 by vehicle count)
  if (fs.existsSync(fullIndexPath)) {
    const fullIndex = JSON.parse(fs.readFileSync(fullIndexPath, "utf-8"));
    const codes = Object.entries(fullIndex)
      .sort((a, b) => b[1].vehicleCount - a[1].vehicleCount)
      .slice(0, 2000);

    console.log(`Uploading ${codes.length} individual DTC entries...`);
    let uploaded = 0;

    for (let i = 0; i < codes.length; i += BATCH_SIZE) {
      const batch = codes.slice(i, i + BATCH_SIZE);
      const pairs = batch.map(([code, data]) => ({
        key: `dtc:${code}`,
        value: JSON.stringify(data),
      }));

      await kvBulkWrite(pairs);
      uploaded += pairs.length;
      console.log(`  ${uploaded}/${codes.length} codes uploaded`);
      await sleep(300);
    }
  }

  console.log("\nDone!");
}

main().catch((e) => { console.error("Fatal:", e); process.exit(1); });
