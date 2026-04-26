#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT_DIR="${1:-$ROOT_DIR/tmp/kimi-context-$STAMP}"
PKG_BASENAME="$(basename "$OUT_DIR")"

mkdir -p "$OUT_DIR"
mkdir -p "$OUT_DIR/repo"

copy_file() {
  local rel="$1"
  if [[ -f "$ROOT_DIR/$rel" ]]; then
    mkdir -p "$OUT_DIR/repo/$(dirname "$rel")"
    cp "$ROOT_DIR/$rel" "$OUT_DIR/repo/$rel"
  fi
}

copy_dir() {
  local rel="$1"
  if [[ -d "$ROOT_DIR/$rel" ]]; then
    local target="$OUT_DIR/repo/$rel"
    mkdir -p "$(dirname "$target")"
    rsync -a \
      --exclude='*.log' \
      --exclude='.env*' \
      --exclude='credentials/' \
      --exclude='node_modules/' \
      --exclude='.next/' \
      --exclude='.git/' \
      "$ROOT_DIR/$rel/" "$target/"
  fi
}

# Core architecture + runtime config
copy_file "AGENTS.md"
copy_file "IMPLEMENTATION_BLUEPRINT.md"
copy_file "package.json"
copy_file "tsconfig.json"
copy_file "next.config.js"
copy_file "README.md"

# Backend/API + knowledge graph/corpus plumbing
copy_dir "src/app/api"
copy_dir "src/lib"

# Data models and corpus-facing inventories (targeted)
copy_file "src/data/tools-pages.ts"
copy_file "src/data/tool-machine.ts"
copy_file "src/data/vehicles.ts"
copy_file "src/data/dtc-codes-data.ts"
copy_file "src/data/forumCategories.ts"
copy_file "src/data/forumThreads.ts"
copy_file "src/data/symptomGraph.ts"
copy_file "src/data/wiring-seo-cluster.ts"

# SEO/KG/reporting scripts Kimi can reason over
copy_file "scripts/command-center-opportunities.js"
copy_file "scripts/graph-priority-report.ts"
copy_file "scripts/generate-graph-link-suggestions.ts"
copy_file "scripts/audit-knowledge-graph.ts"
copy_file "scripts/index-lmdb-vectors.ts"
copy_file "scripts/manual-backbone-health.ts"
copy_file "scripts/manual-backbone-scoreboard.ts"
copy_file "scripts/smoke-prod.mjs"

# Selected recent reports to ground recommendations in real signals
copy_dir "scripts/seo-reports"

cat > "$OUT_DIR/KIMI_BRIEFING.md" <<'BRIEF'
# Kimi 6.2 Backend/KG Review Brief

You are reviewing the SpotOnAuto backend + data pipeline for knowledge-graph quality and corpus-grounded content integrity.

## Goals
1. Improve knowledge graph quality (node/edge modeling, linking density, retrieval quality).
2. Improve corpus grounding for generated content pages (avoid generic or unverifiable claims).
3. Propose concrete backend implementation changes with file-level targets.

## What to inspect first
- `repo/src/lib/knowledgeGraph.ts`
- `repo/src/lib/vehicleIdentity.ts`
- `repo/src/lib/vehicleHubGraph.ts`
- `repo/src/lib/graphPriorityLinks.ts`
- `repo/src/lib/charmParser.ts`
- `repo/src/app/api/**`
- `repo/src/data/tool-machine.ts` and `repo/src/data/tools-pages.ts`
- `repo/scripts/graph-priority-report.ts`

## Output requested
Please return:
1. **Top 10 backend changes** (ordered by impact), each with:
   - Why it matters
   - Exact files/functions to change
   - Risk level
   - Expected measurable outcome (CTR, index quality, conversion, or data integrity)
2. **Data quality guardrails** to prevent hallucinated specs in generated pages.
3. **Graph schema proposal** (node/edge types + required properties + confidence fields).
4. **Retrieval strategy** to ensure answer boxes only use high-confidence corpus-backed facts.
5. **90-day execution plan** in 3 phases.

## Constraints
- Assume no access to secrets.
- Prioritize deterministic, auditable backend logic over prompt-only fixes.
- Favor small, safe, high-leverage patches over broad rewrites.
BRIEF

cat > "$OUT_DIR/SHARE_STEPS.txt" <<EOF_STEPS
1) Review the briefing:
   $OUT_DIR/KIMI_BRIEFING.md

2) Compress context package:
   cd "$OUT_DIR" && tar -czf "../$PKG_BASENAME.tar.gz" .

3) Upload/share with Kimi:
   - Include KIMI_BRIEFING.md text in the prompt.
   - Attach the tarball: ../$PKG_BASENAME.tar.gz

4) Optional safety check before sharing:
   rg -n "api[_-]?key|secret|token|password|private" "$OUT_DIR/repo" -i
EOF_STEPS

# Manifest
(
  cd "$OUT_DIR"
  find . -type f | sort > MANIFEST.txt
)

echo "Kimi context exported to: $OUT_DIR"
echo "Briefing file: $OUT_DIR/KIMI_BRIEFING.md"
echo "Share steps:  $OUT_DIR/SHARE_STEPS.txt"
