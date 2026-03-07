# SpotOnAuto Deployment Checklist (Hard Gate)

## 1) Build Gate
- [ ] `npm run build` exits 0.
- [ ] No TypeScript errors.
- [ ] Route table includes `/diagnose`, `/cel`, `/second-opinion`, `/community/new`, `/parts`, `/codes`.

## 2) Smoke Gate
- [ ] `npm run smoke:prod` exits 0 against production.
- [ ] `/blog` and `/pricing` return 404.
- [ ] `/sitemap.xml` and `/repair/sitemap.xml` return XML.
- [ ] CSP includes `fundingchoicesmessages.google.com`.

## 3) Critical UX Gate
- [ ] Diagnose chat responds for non-auth users.
- [ ] Diagnose failures show explicit error or timeout messaging.
- [ ] Auth page supports password reset from "Forgot password?".
- [ ] Parts page shows affiliate disclosure above fold.

## 4) Revenue/Compliance Gate
- [ ] No duplicate `adsbygoogle.push()` console errors on route changes.
- [ ] Funding Choices script is not blocked by CSP.
- [ ] Affiliate links are marked `rel="sponsored"` where applicable.

## 5) SEO/Social Gate
- [ ] OG preview image renders for home/tools/codes/parts/second-opinion/community.
- [ ] Canonical tags are correct on key pages.
- [ ] Repair sitemap chunk index is valid and reachable.

## 6) Manual Spot Checks (Production)
- [ ] `/diagnose` vehicle selector loads make/model and opens chat.
- [ ] `/cel` manual code entry responds (expand/common-code or route to diagnose).
- [ ] `/second-opinion` model dropdown loads after year+make.
- [ ] `/community/new` redirect/auth behavior is clear.
- [ ] Print preview on a repair guide is clean (no nav/ads).

## 7) Rollback Plan
- [ ] Keep previous deploy ID ready in hosting platform.
- [ ] If smoke fails post-deploy: rollback immediately.
- [ ] Re-run smoke after rollback and confirm pass.

## 8) Evidence Capture
- [ ] Save build log artifact.
- [ ] Save smoke output artifact.
- [ ] Screenshot critical route checks and console for release record.

