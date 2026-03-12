# SpotOnAuto Memory

This file is the durable project memory for future Codex runs in this repo.
Update it when product decisions, traps, or standing preferences change.

## Product Direction

- Brand is `SpotOn Auto`.
- Do not attribute authorship to `Operation CHARM` or `charm.li`. They were distributors/hosts, not the author.
- When referring to that corpus or live retrieval source, use `factory manual archive`, `manual archive`, or `factory service manual archive`.

## UI Direction

- Homepage direction is matte black with blue/white text.
- Avoid the old starfield / particle-background look on the homepage.
- Favor calmer, more flowing section transitions over noisy sci-fi effects.
- Keep the tone intentional and restrained, not gimmicky.

## Known Technical Traps

- Do not reintroduce delayed provider remounting in `src/components/Providers.tsx`.
  That remount was causing scroll resets back to the top while users were moving down the page.
- Diagnostic chat now has browser-local persistent thread memory.
  Preserve resume behavior and the explicit `New thread` reset unless intentionally replacing that system.

## Current Durable Changes

- Homepage hero/start flow was rewritten toward the matte-black direction in `src/app/ClientHome.tsx` and `src/app/globals.css`.
- Manual/archive sanitization lives in:
  - `src/services/geminiService.ts`
  - `scripts/index-lmdb-vectors.ts`
  - `src/app/api/generate-guide/route.ts`
  - `src/app/charm-repair/page.tsx`
  - `src/components/CharmLiVehicleSelector.tsx`
- Diagnostic memory lives in:
  - `src/services/diagnosticMemory.ts`
  - `src/components/DiagnosticChat.tsx`
  - `src/app/diagnose/page.tsx`
  - `src/services/apiClient.ts`

## Working Norms

- This repo is often dirty with unrelated local edits. Stage only task-relevant files.
- For TypeScript changes, verify with `npx tsc --noEmit`.
- Prefer direct, user-visible fixes over speculative refactors.
