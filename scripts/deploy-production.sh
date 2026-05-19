#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${DEPLOY_APP_DIR:-/root/spotonauto.com}"
SERVICE_NAME="${DEPLOY_SERVICE_NAME:-alloemmanuals-web}"
HEALTHCHECK_URL="${DEPLOY_HEALTHCHECK_URL:-http://127.0.0.1:3002}"
ROLLBACK_DIR="${APP_DIR}/.next.backup"

log() {
  printf '\n[%s] %s\n' "$(date -u +'%Y-%m-%dT%H:%M:%SZ')" "$*"
}

run_systemctl() {
  if command -v sudo >/dev/null 2>&1; then
    sudo systemctl "$@"
  else
    systemctl "$@"
  fi
}

log "Starting deploy"
log "App dir: ${APP_DIR}"
if [ ! -d "${APP_DIR}" ]; then
  echo "Deploy path not found: ${APP_DIR}" >&2
  exit 1
fi

cd "${APP_DIR}"

if [ ! -f package.json ] || [ ! -f package-lock.json ]; then
  echo "Expected package.json and package-lock.json in ${APP_DIR}" >&2
  exit 1
fi

# ── Pre-deploy: stop service and backup current build ──────────────
log "Stopping service: ${SERVICE_NAME}"
run_systemctl stop "${SERVICE_NAME}" || true
sleep 2

# Backup existing .next so we can rollback if build fails
if [ -d ".next" ]; then
  log "Backing up current .next to ${ROLLBACK_DIR}"
  rm -rf "${ROLLBACK_DIR}"
  mv .next "${ROLLBACK_DIR}"
fi

# ── Build ──────────────────────────────────────────────────────────
log "Installing dependencies"
npm ci

log "Building app"
if ! npm run build; then
  log "BUILD FAILED — restoring previous build and restarting service"
  rm -rf .next
  if [ -d "${ROLLBACK_DIR}" ]; then
    mv "${ROLLBACK_DIR}" .next
  fi
  run_systemctl start "${SERVICE_NAME}"
  exit 1
fi

# ── Post-build: sync if service WorkingDirectory differs ───────────
SERVICE_WD="$(run_systemctl show "${SERVICE_NAME}" --property=WorkingDirectory --value || true)"
if [ -n "${SERVICE_WD}" ] && [ "${SERVICE_WD}" != "${APP_DIR}" ] && [ -d "${SERVICE_WD}" ]; then
  log "Service WorkingDirectory (${SERVICE_WD}) differs from build dir (${APP_DIR}). Syncing .next..."
  rsync -az --delete "${APP_DIR}/.next/" "${SERVICE_WD}/.next/"
fi

# ── Start service ──────────────────────────────────────────────────
log "Ensuring port ${PORT:-3002} is free"
if command -v fuser >/dev/null 2>&1; then
  fuser -k "${PORT:-3002}/tcp" 2>/dev/null || true
elif command -v lsof >/dev/null 2>&1; then
  lsof -ti:"${PORT:-3002}" | xargs -r kill -9 2>/dev/null || true
fi
sleep 2

log "Starting service: ${SERVICE_NAME}"
run_systemctl start "${SERVICE_NAME}"

log "Waiting for service"
sleep 4
run_systemctl is-active --quiet "${SERVICE_NAME}"

# ── Healthchecks ───────────────────────────────────────────────────
log "Running local healthcheck: ${HEALTHCHECK_URL}"
if ! curl -fsS "${HEALTHCHECK_URL}" >/dev/null; then
  log "HEALTHCHECK FAILED — restoring previous build and restarting service"
  run_systemctl stop "${SERVICE_NAME}"
  rm -rf .next
  if [ -d "${ROLLBACK_DIR}" ]; then
    mv "${ROLLBACK_DIR}" .next
  fi
  run_systemctl start "${SERVICE_NAME}"
  exit 1
fi

API_HEALTH_URL="${HEALTHCHECK_URL}/api/health"
log "Running API healthcheck: ${API_HEALTH_URL}"
if curl -fsS "${API_HEALTH_URL}" >/dev/null 2>&1; then
  log "API healthcheck passed"
else
  log "API healthcheck skipped or failed (route may not exist)"
fi

# ── Cleanup ────────────────────────────────────────────────────────
log "Removing backup build"
rm -rf "${ROLLBACK_DIR}"

# Optional: sync nginx site config and reload
NGINX_SITE_SRC="${DEPLOY_NGINX_SITE_SRC:-}"
if [ -n "${NGINX_SITE_SRC}" ] && [ -f "${NGINX_SITE_SRC}" ]; then
  log "Syncing nginx site config"
  cp "${NGINX_SITE_SRC}" /etc/nginx/sites-enabled/alloemmanuals.com
  nginx -t && nginx -s reload
  log "Nginx reloaded"
fi

log "Deploy completed successfully"
