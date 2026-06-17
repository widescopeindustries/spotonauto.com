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
  local msg
  msg="$(printf '[%s] %s' "$(date -u +'%Y-%m-%dT%H:%M:%SZ')" "$*")"
  echo "${msg}"
  logger -t "${LOG_TAG}" "${msg}"
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

# Preserve any local config/files (e.g., .env.local, generated sitemaps) before
# resetting the tracked tree to the new commit.
STASH_NAME="auto-deploy-$(date -u +%s)"
if ! git diff --quiet HEAD || [ -n "$(git status --porcelain)" ]; then
  log "Working tree is dirty — stashing local changes as ${STASH_NAME}"
  git stash push -u -m "${STASH_NAME}" || true
fi

# Pull changes first to update working tree
git reset --hard "${REMOTE_BRANCH}"

# Restore local changes; if the pop conflicts, leave the stash in place for manual review.
if git stash list | grep -q "${STASH_NAME}"; then
  log "Restoring stashed local changes"
  git stash pop || log "Stash pop failed — local changes remain in stash '${STASH_NAME}'"
fi

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

  # ── dependencies & Build (Isolated directory to prevent downtime) ──
  log "Installing dependencies in main app directory"
  npm ci

  log "Preparing temporary build directory"
  BUILD_DIR="${APP_DIR}/.build-temp"
  rm -rf "${BUILD_DIR}"
  mkdir -p "${BUILD_DIR}"

  log "Syncing files to build directory"
  rsync -az --delete --exclude='node_modules' --exclude='.next' --exclude='.git' --exclude='.build-temp' "${APP_DIR}/" "${BUILD_DIR}/"

  log "Linking node_modules to build directory"
  ln -s "${APP_DIR}/node_modules" "${BUILD_DIR}/node_modules"

  log "Building application in build directory"
  cd "${BUILD_DIR}"
  if ! npm run build; then
    log "BUILD FAILED — cleaning up build folder and aborting deploy"
    rm -rf "${BUILD_DIR}"
    exit 1
  fi
  cd "${APP_DIR}"

  log "Build successful, preparing swap"
  NEW_BUILD_DIR="${BUILD_DIR}/.next"
  if [ ! -d "${NEW_BUILD_DIR}" ]; then
    log "Build directory .next not found"
    rm -rf "${BUILD_DIR}"
    exit 1
  fi

  # ── Service Swap and Restart (Minimal Downtime Window) ──────────────
  # Backup current build
  if [ -d ".next" ]; then
    log "Backing up current .next to .next.backup"
    rm -rf ".next.backup"
    mv .next ".next.backup"
  fi

  log "Swapping in new build"
  mv "${NEW_BUILD_DIR}" .next
  rm -rf "${BUILD_DIR}"

  log "Stopping service: ${SERVICE_NAME} (for quick swap)"
  systemctl stop "${SERVICE_NAME}" || true

  log "Starting service: ${SERVICE_NAME}"
  systemctl start "${SERVICE_NAME}"

  log "Waiting for service"
  sleep 4
  if curl -fsS "http://127.0.0.1:3002" >/dev/null; then
    log "Fallback deploy completed successfully"
    rm -rf ".next.backup"
  else
    log "Healthcheck failed — rolling back"
    systemctl stop "${SERVICE_NAME}"
    rm -rf .next
    mv ".next.backup" .next 2>/dev/null || true
    systemctl start "${SERVICE_NAME}"
    exit 1
  fi
fi
