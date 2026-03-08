# GA4 Graph Dimensions Runbook

This runbook makes the knowledge-graph analytics loop operational in GA4.

## Commands

Check current status:

```bash
npm run analytics:graph-dimensions
```

Create any missing required dimensions:

```bash
npm run analytics:graph-dimensions:create
```

Export status as JSON:

```bash
node scripts/ensure-graph-ga4-dimensions.js --json
```

## Required Dimensions

All four are event-scoped custom dimensions on GA4 property `520432705`:

- `graph_surface`
- `graph_group`
- `graph_target_kind`
- `graph_label`

## Expected Access

The service account at `credentials/google-service-account.json` needs:

- Viewer or Analyst access to list existing dimensions
- Editor access, or another role with `analytics.edit`, to create missing dimensions

## Operating Sequence

1. Run `npm run analytics:graph-dimensions`
2. If any required dimension is missing, run `npm run analytics:graph-dimensions:create`
3. Deploy production
4. Wait for events to accumulate and for GA4 to expose the new dimensions in reports
5. Run:

```bash
npm run analytics:graph
npm run analytics:graph-scoreboard -- --export
```

6. Review the recommended override file in `scripts/seo-reports`
7. Apply approved overrides:

```bash
npm run analytics:graph-apply -- --input scripts/seo-reports/knowledge-graph-overrides-recommended-YYYY-MM-DD-to-YYYY-MM-DD.json
```

## Notes

- New GA4 custom dimensions can take time to become queryable in the Data API.
- The apply step automatically backs up the current live override file before writing a new one.
