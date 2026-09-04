# Architecture

## Pipeline

```text
GitHub Actions schedule or manual dispatch
  -> scripts/fetch-hotspot.mjs
  -> public/data/latest.json + public/data/meta.json + data/raw snapshots
  -> scripts/filter-hotspots.mjs
  -> data/processed/candidates.json
  -> scripts/analyze-hotspots.mjs
  -> public/data/radar.json + dated radar history
  -> git commit and push
  -> Git-connected hosting deployment
```

The reference workflow runs at 08:15 and 15:00 Asia/Shanghai. GitHub cron is UTC, so the checked-in expressions are `15 0 * * *` and `0 7 * * *`.

## File ownership

- `public/dashboard.html`: final reference UI and client-side bindings.
- `public/history-view.html` and `public/history/`: archived rendered views.
- `scripts/fetch-hotspot.mjs`: source fallback chains, normalization, raw snapshots.
- `scripts/filter-hotspots.mjs`: keyword, rank, heat, risk, and cross-platform prefilter.
- `scripts/analyze-hotspots.mjs`: deterministic business relevance, safety, grade, and recommendation logic.
- `config/hotspot-rules.json`: editable thresholds and keyword groups.
- `HOTSPOT_RULES.md`: human-readable product and display invariants.
- `.github/workflows/update-hotspot.yml`: schedule, execution, change detection, commit, and push.
- `public/data/`: deployed machine-readable state.

## Failure behavior

The pipeline must stop before commit when fetching or processing fails. The deployed site should therefore retain the last complete dataset. Source-level partial success is acceptable only when `latest.json` records which fallback source succeeded and the UI does not falsely claim unavailable coverage.

## Important limitation of the reference version

The final reference UI includes authored event-detail, trend, meme, and advice copy. The scheduled scripts update JSON data, but not every authored HTML block is automatically regenerated. Preserve this behavior when reproducing the exact version; when a user requests end-to-end dynamic content, bind or generate every module and add tests that compare visible dates and event identifiers with `radar.json`.

