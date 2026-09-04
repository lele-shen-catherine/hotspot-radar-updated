# Data contracts

## `public/data/latest.json`

Normalized source snapshot. Preserve:

- `generatedAt` and local `date`;
- per-platform source identifier and items;
- item title, URL, heat when available, and source metadata;
- honest absence when a platform cannot be fetched.

## `data/processed/candidates.json`

Audit result of deterministic prefiltering. Preserve:

- source timestamp and date;
- candidates with rule score, keyword match, cross-platform status, and occurrences;
- rejected items with exclusion reason;
- rule summary and thresholds.

## `public/data/radar.json`

Final decision data. Preserve:

- schema version, generation/source timestamps, date, provider, and method identifier;
- selected hotspots and watchlist;
- grade, total and component scores;
- decision reason, event summary, risk level/note;
- business action and communication idea only when intended by the content model.

## Binding checklist

For every dashboard module, record its source:

| Module | Expected source |
|---|---|
| Header date/source status | `latest.json` / `meta.json` |
| Selected grades and ranking | `radar.json` |
| Event details and trend | `radar.json` plus dated history when fully dynamic |
| Meme topics | dedicated generated data or explicitly authored HTML |
| Business advice | selected event plus business configuration, or authored HTML |
| Platform preview | `latest.json` and optional Xiaohongshu source |
| History selector | history manifest |

Do not call a module automatic merely because a neighboring module reads generated JSON.

