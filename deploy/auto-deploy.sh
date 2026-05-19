#!/usr/bin/env bash
set -Eeuo pipefail

# AllOEMManuals — Git-based Auto-Deploy Watcher
# Runs via systemd timer (default: every 60s).
# Fetches origin/main from GitHub; if HEAD changed, triggers deploy.

APP_DIR="${DEPLOY_APP_DIR:-/root/spotonauto.com}"
SERVICE_NAME="${DEPLOY_SERVICE_NAME:-alloemmanuals-web}"
DEPLOY_SCRIPT="${APP_DIR}/scripts/deploy-production.sh"
LOCK_FILE="/var/run/auto-deploy.lock"
LOG_TAG="auto-deploy"

REMOTE_URL="${AUTO_DEPLOY_REMOTE:-https://github.com/widescopeindustries/spotonauto.com.git}"
REMOTE_BRANCH="${AUTO_DEPLOY_BRANCH:-origin/main}"

log() {
  printf '[%s] %s\n' "$(date -u +'%Y-%m-%dT%H:%M:%SZ')" "$*" | tee /dev/tty | logger -t "${LOG_TAG}"
}

# ── Prevent concurrent deploys ─────────────────────────────────────
exec 200>"${LOCK_FILE}"
if ! flock -n 200; then
  log "Another deploy is already running. Skipping."
  exit 0
fi

cd "${APP_DIR}"

# ── Ensure git repo is configured ──────────────────────────────────
if [ ! -d ".git" ]; then
  log "Initializing git repo in ${APP_DIR}"
  git init
  git remote add origin "${REMOTE_URL}"
  # Fetch without changing working tree
  git fetch origin main
  git reset --mixed "${REMOTE_BRANCH}" || true
fi

# ── Fetch latest from GitHub ───────────────────────────────────────
log "Fetching ${REMOTE_BRANCH}"
if ! git fetch origin main; then
  log "Git fetch failed — skipping deploy"
  exit 0
fi

LOCAL_HEAD="$(git rev-parse HEAD 2>/dev/null || echo 'none')"
REMOTE_HEAD="$(git rev-parse ${REMOTE_BRANCH} 2>/dev/null || echo 'none')"

if [ "${LOCAL_HEAD}" = "${REMOTE_HEAD}" ]; then
  # No changes — silent exit
  exit 0
fi

log "New commit detected: ${LOCAL_HEAD:0:8} -> ${REMOTE_HEAD:0:8}"

# ── Deploy ─────────────────────────────────────────────────────────
if [ -x "${DEPLOY_SCRIPT}" ]; then
  log "Running deploy script: ${DEPLOY_SCRIPT}"
  if bash "${DEPLOY_SCRIPT}"; then
    log "Deploy completed successfully"
  else
    log "Deploy failed — check logs above"
    exit 1
  fi
else
  log "Deploy script not found or not executable: ${DEPLOY_SCRIPT}"
  log "Falling back to manual deploy steps..."

  # Manual fallback (same logic as deploy-production.sh)
  systemctl stop "${SERVICE_NAME}" || true
  sleep 2

  # Backup .next
  if [ -d ".next" ]; then
    rm -rf ".next.backup"
    mv .next ".next.backup"
  fi

  # Pull changes
  git reset --hard "${REMOTE_BRANCH}"

  # Build
  if npm ci && npm run build; then
    rm -rf ".next.backup"
    systemctl start "${SERVICE_NAME}"
    sleep 4
    if curl -fsS "http://127.0.0.1:3002" >/dev/null; then
      log "Fallback deploy completed successfully"
    else
      log "Healthcheck failed — rolling back"
      systemctl stop "${SERVICE_NAME}"
      rm -rf .next
      mv ".next.backup" .next 2>/dev/null || true
      systemctl start "${SERVICE_NAME}"
      exit 1
    fi
  else
    log "Build failed — rolling back"
    rm -rf .next
    mv ".next.backup" .next 2>/dev/null || true
    systemctl start "${SERVICE_NAME}"
    exit 1
  fi
fi
