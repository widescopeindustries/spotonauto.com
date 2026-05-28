#!/usr/bin/env node
/**
 * Tollbit Audit and Revenue Reporter
 * Runs on the VPS to parse journalctl logs and output a structured markdown report.
 */

import { execSync } from "child_process";

// Time range parameter (e.g. "1 hour ago", "today", "24 hours ago")
const since = process.argv[2] || "1 hour ago";

try {
  let logOutput = "";
  try {
    logOutput = execSync(
      `journalctl -u alloemmanuals-web --since "${since}" --no-pager | grep -E "\\[TOLLBIT_AUDIT\\]|\\[TOLLBIT_AUDIT_DETAIL\\]"`,
      { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 }
    );
  } catch (grepError) {
    if (grepError.status === 1) {
      logOutput = "";
    } else {
      throw grepError;
    }
  }

  let summaryCount = 0;
  let fullCount = 0;
  const botCounts = {};

  const lines = logOutput.split("\n");
  for (const line of lines) {
    if (line.includes("[TOLLBIT_AUDIT]")) {
      // Parse bot name from middleware log line: bot=<name>
      const botMatch = line.match(/bot=([^ ]+)/);
      if (botMatch) {
        const botName = botMatch[1];
        botCounts[botName] = (botCounts[botName] || 0) + 1;
      }
    }
    if (line.includes("[TOLLBIT_AUDIT_DETAIL]")) {
      if (line.includes("type=summary")) {
        summaryCount++;
      } else if (line.includes("type=full")) {
        fullCount++;
      }
    }
  }

  // Calculate revenue — rates as of 2026-05-28
  // Strategy: raised rates to $5/$15
  const SUMMARY_CPM = 5.00;
  const FULL_CPM = 15.00;
  const summaryRevenue = (summaryCount / 1000) * SUMMARY_CPM;
  const fullRevenue = (fullCount / 1000) * FULL_CPM;
  const totalRevenue = summaryRevenue + fullRevenue;

  console.log(`### 📊 Tollbit Monetization Report (Timeframe: ${since})`);
  console.log("");
  console.log("| Item | Request Count | CPM Rate | Earned Revenue |");
  console.log("| :--- | :---: | :---: | :---: |");
  console.log(`| **Summaries / Navigation** | ${summaryCount} | $${SUMMARY_CPM.toFixed(2)} | **$${summaryRevenue.toFixed(4)}** |`);
  console.log(`| **Full Pages / JSON Guides** | ${fullCount} | $${FULL_CPM.toFixed(2)} | **$${fullRevenue.toFixed(4)}** |`);
  console.log(`| **Total** | **${summaryCount + fullCount}** | — | **$${totalRevenue.toFixed(4)}** |`);
  console.log("");

  const bots = Object.entries(botCounts);
  if (bots.length > 0) {
    console.log("#### 🤖 Paid Crawler Activity Breakdown");
    bots.sort((a, b) => b[1] - a[1]);
    for (const [botName, count] of bots) {
      console.log(`* **${botName}**: ${count} request${count > 1 ? "s" : ""}`);
    }
  } else {
    console.log("*No paying bot requests recorded in this time range.*");
  }
} catch (err) {
  console.error("Failed to run Tollbit audit reporter:", err.message);
  process.exit(1);
}
