#!/bin/bash
# run-indexer-army.sh
# Deploys the indexer army on the Hetzner server.
# Usage: ./scripts/run-indexer-army.sh [--deep] [--workers N] [--resume]
#
# Recommended server settings (Hetzner AX102, 16 cores, 62GB RAM):
#   ./scripts/run-indexer-army.sh --deep --workers 12
#
# The script auto-detects CPU count if --workers is omitted.

set -euo pipefail

cd "$(dirname "$0")/.."

# Ensure .env.local is loaded
if [ ! -f .env.local ]; then
  echo "ERROR: .env.local not found in $(pwd)"
  exit 1
fi

# Parse args
DEEP_FLAG=""
WORKERS_FLAG=""
RESUME_FLAG=""
while [[ $# -gt 0 ]]; do
  case $1 in
    --deep)
      DEEP_FLAG="--deep"
      shift
      ;;
    --workers)
      WORKERS_FLAG="--workers $2"
      shift 2
      ;;
    --resume)
      RESUME_FLAG="--resume"
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [--deep] [--workers N] [--resume]"
      exit 1
      ;;
  esac
done

# Auto-detect workers if not specified
if [ -z "$WORKERS_FLAG" ]; then
  CPU_COUNT=$(nproc)
  RECOMMENDED=$(( CPU_COUNT > 2 ? CPU_COUNT - 2 : 1 ))
  WORKERS_FLAG="--workers $RECOMMENDED"
  echo "Auto-detected workers: $RECOMMENDED (CPU count: $CPU_COUNT)"
fi

LOG_FILE="/tmp/spotonauto-indexer-army-$(date +%Y%m%d-%H%M%S).log"
STATE_FILE=".indexer-army-state.json"

echo "══════════════════════════════════════════════════════════"
echo "  SpotOnAuto Indexer Army"
echo "══════════════════════════════════════════════════════════"
echo "Mode:       ${DEEP_FLAG:-standard}"
echo "Workers:    $WORKERS_FLAG"
echo "Resume:     ${RESUME_FLAG:-no}"
echo "Log file:   $LOG_FILE"
echo "State file: $STATE_FILE"
echo ""
echo "Starting in 3 seconds... (Ctrl+C to abort)"
sleep 3

# Run the coordinator
echo "Launching army..."
node --experimental-strip-types scripts/indexer-coordinator.ts \
  $DEEP_FLAG \
  $WORKERS_FLAG \
  $RESUME_FLAG \
  2>&1 | tee "$LOG_FILE"

echo ""
echo "Army finished. Log saved to: $LOG_FILE"
