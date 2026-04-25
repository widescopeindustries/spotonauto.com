# GitHub Actions Auto-Deploy (VPS + systemd)

This repo now includes `.github/workflows/deploy-production.yml`.

On every push to `main`, it:
1. Runs `npm ci`, `npm run typecheck`, and `npm run build` in CI.
2. SSHes into your VPS.
3. Runs `scripts/deploy-production.sh` remotely.
4. Fast-forwards the server repo to `origin/main`.
5. Runs `npm ci && npm run build`.
6. Restarts `spotonauto-web` service.
7. Runs health checks.

## Required GitHub Secrets

Set these in GitHub -> Settings -> Secrets and variables -> Actions:

- `DEPLOY_HOST`: VPS hostname or IP (example: `116.202.210.109`)
- `DEPLOY_PORT`: SSH port (usually `22`)
- `DEPLOY_USER`: SSH user with access to app directory
- `DEPLOY_SSH_PRIVATE_KEY`: private key for that SSH user (ed25519 recommended)
- `DEPLOY_APP_DIR`: app path on server (example: `/root/spotonauto.com`)
- `DEPLOY_SERVICE_NAME`: systemd service name (example: `spotonauto-web`)
- `DEPLOY_HEALTHCHECK_URL` (optional): local health URL on VPS (default `http://127.0.0.1:3000`)
- `PROD_HEALTHCHECK_URL` (optional): public URL to verify after deploy (example: `https://spotonauto.com/`)

## Server requirements

- Repo cloned at `DEPLOY_APP_DIR` and tracking `origin/main`
- Node.js 22 + npm 10 installed
- systemd service exists: `spotonauto-web`
- Deploy user can restart service:
  - either deploy as root
  - or passwordless sudo for restart/is-active on that service

Example sudoers line (adjust user name):

```text
# /etc/sudoers.d/spotonauto-deploy
<deploy-user> ALL=(ALL) NOPASSWD:/bin/systemctl restart spotonauto-web,/bin/systemctl is-active spotonauto-web
```

## First run

- Push to `main` or run workflow manually from Actions tab (`Deploy Production` -> `Run workflow`).
- Confirm successful run in Actions logs.
- Verify live site includes latest commit changes.
