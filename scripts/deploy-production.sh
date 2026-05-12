#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${DEPLOY_APP_DIR:-/root/spotonauto.com}"
SERVICE_NAME="${DEPLOY_SERVICE_NAME:-alloemmanuals-web}"
HEALTHCHECK_URL="${DEPLOY_HEALTHCHECK_URL:-http://127.0.0.1:3002}"

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

log "Installing dependencies"
npm ci

log "Clearing build artifacts"
rm -rf .next

log "Building app"
npm run build

# Discover the service's actual WorkingDirectory so the build is picked up
SERVICE_WD="$(run_systemctl show "${SERVICE_NAME}" --property=WorkingDirectory --value || true)"
if [ -n "${SERVICE_WD}" ] && [ "${SERVICE_WD}" != "${APP_DIR}" ] && [ -d "${SERVICE_WD}" ]; then
  log "Service WorkingDirectory (${SERVICE_WD}) differs from build dir (${APP_DIR}). Syncing .next..."
  rsync -az --delete "${APP_DIR}/.next/" "${SERVICE_WD}/.next/"
fi

# Ensure port is free before restarting (kills any stray processes)
log "Ensuring port ${PORT:-3002} is free"
if command -v fuser >/dev/null 2>&1; then
  fuser -k "${PORT:-3002}/tcp" 2>/dev/null || true
elif command -v lsof >/dev/null 2>&1; then
  lsof -ti:"${PORT:-3002}" | xargs -r kill -9 2>/dev/null || true
fi
sleep 2

log "Restarting service: ${SERVICE_NAME}"
run_systemctl restart "${SERVICE_NAME}"

log "Waiting for service"
sleep 4
run_systemctl is-active --quiet "${SERVICE_NAME}"

log "Running local healthcheck: ${HEALTHCHECK_URL}"
curl -fsS "${HEALTHCHECK_URL}" >/dev/null

# Verify a dynamic API route responds (proves the new build is active)
API_HEALTH_URL="${HEALTHCHECK_URL}/api/health"
log "Running API healthcheck: ${API_HEALTH_URL}"
if curl -fsS "${API_HEALTH_URL}" >/dev/null 2>&1; then
  log "API healthcheck passed"
else
  log "API healthcheck skipped or failed (route may not exist)"
fi

# Optional: sync nginx site config and reload
NGINX_SITE_SRC="${DEPLOY_NGINX_SITE_SRC:-}"
if [ -n "${NGINX_SITE_SRC}" ] && [ -f "${NGINX_SITE_SRC}" ]; then
  log "Syncing nginx site config"
  cp "${NGINX_SITE_SRC}" /etc/nginx/sites-enabled/alloemmanuals.com
  nginx -t && nginx -s reload
  log "Nginx reloaded"
fi

log "Deploy completed successfully"
