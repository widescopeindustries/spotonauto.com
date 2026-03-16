# Manual Backbone Reindex Runbook

## Objective

Refresh the manual embeddings corpus on the VPS-backed store so SpotOnAuto guides use the newest extracted text, source snippets, and image markers.

## When to Run

Run a reindex when any of these happen:

- the extraction logic changes
- image marker handling changes
- the embeddings schema changes
- the corpus store is rebuilt or restored
- retrieval quality drops or coverage gaps appear

## Preconditions

1. `GEMINI_API_KEY` is present in `.env.local`
2. `VPS_DATABASE_URL` is present in `.env.local`
3. `MANUAL_EMBEDDINGS_BACKEND=vps` is set explicitly if you want to avoid fallback ambiguity
4. `data.spotonauto.com` is reachable
5. The VPS `manual_embeddings` table exists and is healthy

## Baseline Checks

Run these before indexing:

```bash
npm run health:manual-backbone
npm run analytics:backbone
```

Confirm:

- backend is `vps`
- health is `yes`
- indexed section count is non-zero
- newest entry timestamp looks sane

## Safe Test Run

Start with a dry run against one make/year:

```bash
node --experimental-strip-types scripts/index-lmdb-vectors.ts --make Toyota --year 2010 --dry-run
```

Then run one real make/year to validate writes:

```bash
node --experimental-strip-types scripts/index-lmdb-vectors.ts --make Toyota --year 2010
```

Recheck health:

```bash
npm run health:manual-backbone
```

## Full Reindex

Run the full corpus refresh from the repo root:

```bash
npm run index:manual-backbone
```

This process is resumable. If interrupted, rerun the same command.

## Targeted Reindex Patterns

One make:

```bash
node --experimental-strip-types scripts/index-lmdb-vectors.ts --make Honda
```

One make + year:

```bash
node --experimental-strip-types scripts/index-lmdb-vectors.ts --make Ford --year 2008
```

Preview without writes:

```bash
node --experimental-strip-types scripts/index-lmdb-vectors.ts --make BMW --year 2011 --dry-run
```

## Post-Run Validation

Run:

```bash
npm run health:manual-backbone
npm run analytics:backbone
npx tsc --noEmit
```

Then manually verify:

1. Generate a repair guide for an indexed pre-2014 vehicle
2. Confirm the guide returns `retrieval.manualMode = vector`
3. Confirm the sources panel shows internal manual links and snippets
4. Confirm at least one guide contains step images when the manual section includes diagrams
5. Check server logs for:

```text
[RETRIEVAL] generate-guide mode=vector manual_sources=...
```

## Expected Outcomes

After a successful refresh:

- vector-backed guides should increase
- live fallback should decrease
- stored manual snippets should reflect current extraction rules
- image markers should begin surfacing in vector-backed guides

## Failure Cases

If `health:manual-backbone` fails:

- verify `VPS_DATABASE_URL`
- verify network access to the VPS database
- verify the `manual_embeddings` table still exists

If indexing fails on writes:

- confirm `MANUAL_EMBEDDINGS_BACKEND=vps`
- confirm the table accepts `vector(768)` values
- inspect the exact failing path in indexer logs

If guides still come back with `manualMode=live` after reindex:

- verify the relevant make/year/model was actually indexed
- verify embeddings are stored for the queried sections
- verify model matching is not falling through due to variant mismatch

## Cadence

Recommended cadence:

- full refresh after extractor or schema changes
- targeted refresh after manual parsing improvements
- weekly health check even when no reindex is needed
