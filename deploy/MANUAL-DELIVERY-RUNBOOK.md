# Manual delivery operations

Read `reports/MANUAL-DELIVERY-ROLLOUT-2026-10-27.md` first. Current release is `/data/alloem-manual-delivery-20261027/candidate`, selected by `/opt/alloemmanuals/manual-current`. Main app retains its own build.

## Health

Check `curl -fsS http://127.0.0.1:3020/_health`, manual systemd units, `/proc/mdstat`, `findmnt /srv/alloem-manuals`, disk space and `/srv/alloem-manuals/logs/access.jsonl`. Watch temporary failures, rejected queues, buffers, retries, CPU and memory. The retained lastFailure after a successful rolling-restart retry is not a current outage signal.

Smoke checks cover manual index/leaf/image, unknown path, current assets, RSC versus HTML, Markdown, HEAD, auth-cookie bypasses, wrapper/one mv-content target, GA4, ledger and ads.txt. Creative tests use Mediavine house-ad mode without ad/affiliate clicks.

## Updating a release

Build in a new release directory from the actual production baseline, preserving reviewed overlays. Copy dependencies into that release; do not link them to mutable main-app node_modules. Build with lifecycle scripts disabled, preserving the private endpoint, bounded manual service, archive env and ad/layout/consent sources. Run private HTTP/representation/failure/mixed-load tests before exposure.

Preserve previous release/config snapshots. Publish new immutable assets before HTML, retaining existing assets and rejecting current-release name collisions. Change the symlink atomically, restart one worker at a time and wait for readiness. Warm a small cohort and canary when behavior changes. Invalidate only affected HTML after cutover; never crawl the full production corpus to warm it.

The auto-deploy watcher refuses dirty trees. Resolve reviewed overlays deliberately before automated releases. Keep the main startup `/opt/alloemmanuals/manual-public-assets.py` hook. Main builds must preserve manual routing, release pointer and dependency isolation. Reconcile the older dirty Nginx template against `alloem-manual-production.nginx.conf` before using it.

## Rollback

For a future bad manual build, restore the previous verified symlink, restart workers individually, preserve both versions' assets and invalidate affected manual HTML.

To reverse this full routing cutover, restore `/data/alloem-manual-delivery-20261027/nginx-before-full.conf` to the live site config, run `nginx -t`, reload and wait for worker installation before checking. This restores the four-make canary and returns other makes to the old known-limited path. Original pre-canary config is in `before/system/etc/nginx/sites-available/alloemmanuals.conf`; restoring that also removes independent assets/media routing, requiring an incident assessment.

The cache already falls back to the gateway; replica source already falls back to archive 8080. Prefer repairing the failing component over unnecessarily reverting everything. Cloudflare rollback requires comparing current rules to the saved before snapshot, preserving unrelated edits and submitting writable rule fields. Do not reinstate unsafe representation ordering or the retired crawler/payment gate.

Application rollback does not restore partition tables, fstab/mdadm or delete source data. Keep mount guards, original corpus and mirrored volume. The catalog counts vehicle entry points; extend it offline with checkpoints if a leaf census is later needed.
