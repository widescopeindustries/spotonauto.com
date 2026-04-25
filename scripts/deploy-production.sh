#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${DEPLOY_APP_DIR:-/root/spotonauto.com}"
SERVICE_NAME="${DEPLOY_SERVICE_NAME:-spotonauto-web}"
HEALTHCHECK_URL="${DEPLOY_HEALTHCHECK_URL:-http://127.0.0.1:3000}"

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

log "Building app"
npm run build

log "Restarting service: ${SERVICE_NAME}"
run_systemctl restart "${SERVICE_NAME}"

log "Waiting for service"
sleep 4
run_systemctl is-active --quiet "${SERVICE_NAME}"

log "Running local healthcheck: ${HEALTHCHECK_URL}"
curl -fsS "${HEALTHCHECK_URL}" >/dev/null

log "Deploy completed successfully"
