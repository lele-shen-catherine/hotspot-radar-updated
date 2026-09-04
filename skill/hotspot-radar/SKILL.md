---
name: hotspot-radar
description: Build, customize, audit, or repair a deployable Chinese social hotspot radar that fetches daily platform trends, applies business and safety rules, publishes dashboard data through GitHub Actions, and deploys from Git. Use for hotspot monitoring dashboards and their automation; do not use for one-off news summaries.
---

# Hotspot Radar

Create or maintain a hotspot radar while preserving the user's chosen page structure, business logic, and deployment provider. The bundled template is the latest reference implementation and is JD local-life oriented; adapt business names and rules when the user is not asking for an exact replica.

## Choose the operating mode

- **Create a new radar:** copy `assets/project-template/` into the requested project directory, then customize it. Do not copy generated Git history, deployment IDs, credentials, or old raw archives.
- **Update an existing radar:** inspect its current dashboard, rules, workflow, and data contracts first. Treat the existing UI and content model as authoritative unless the user explicitly asks to replace them. Do not overwrite a richer dashboard with the template merely because the template is available.
- **Audit or troubleshoot:** inspect the GitHub Actions run, generated JSON, commit on the production branch, and live deployment as separate checkpoints. Report exactly which checkpoint failed.

## JD local-life mandatory profile

When maintaining the bundled JD local-life radar or the user's existing `hotspot-radar` project, read [references/jd-local-life-requirements.md](references/jd-local-life-requirements.md) before fetching, editing, previewing, archiving, or deploying. Treat it as the authoritative product specification.

In particular:

- Preserve the accepted UI exactly unless the user explicitly requests a redesign.
- Keep the fixed sources: Zhiwei event ranking, official Weibo hot search, official Douyin hot-word ranking, and verifiable Xiaohongshu Diandian answers.
- Expand no more than four commercially usable events that are inside the current platform TOP10; fewer is preferable to padding.
- Independently reason about why each event is hot, why it qualifies, and how each JD local-life business can or cannot act on it.
- Generate event explanation, why-hot analysis, selection reason, local-life fit, and risk boundary through AI reasoning. Interactive runs may use the current agent; unattended workflows must call a configured model API. Deterministic keyword rules may pre-filter candidates but must never author these final fields.
- Research real user videos and discussions before calling something a meme; hide the entire meme module when evidence is insufficient.
- For each meme candidate, inspect 10-20 Douyin search-result videos, separate ordinary-user remixes from media, celebrity, institution, and brand posts, and require at least three independent ordinary creators using a similar repeatable template. Otherwise mark it only as creative potential or not a meme. Write the evidence to meme-topics.json.
- Build trend charts only from multiple comparable real snapshots. A single snapshot must be labeled as unavailable trend data, not drawn as a trend.
- Archive yesterday, update every visible current-day module, preview locally, and deploy only after explicit user confirmation.
- Use only the fixed official sources defined in the JD profile. Use Douyin Creator Center's Douyin Index for trend series, archive the prior complete rendered dashboard before a new day update, and never substitute stale or aggregator data when a source fails.
## Essential workflow

1. Confirm the target business, platforms, update times/timezone, repository, production branch, and hosting provider from available context. Ask only when a missing choice would materially change the result.
2. For a new project, copy the template and replace JD-specific business names, recommendations, examples, risk language, and seed content as required. Keep the template unchanged only when the user requests this exact radar.
3. Keep the pipeline auditable by default:
   `fetch-hotspot.mjs` → `filter-hotspots.mjs` → `analyze-hotspots.mjs` → `public/data/*.json` → Git commit → deployment.
4. Do not add an LLM or label a section “AI decision” unless the user explicitly requests model-based analysis. The reference implementation uses deterministic local scoring and needs no model API key.
5. Put optional source credentials only in repository/hosting secrets. Never embed or echo secrets in source, logs, sample data, URLs, commits, or final responses.
6. Run the full local pipeline and build before proposing deployment. Inspect the rendered dashboard, not only the JSON or build exit code.
7. For external mutations—creating repositories, setting secrets, pushing, merging, or deploying—use the appropriate available tool and obtain any confirmation required at action time.

## Non-negotiable content invariants

- “可借势热点”、排行榜、事件详情, and business advice must agree on selection and grade.
- Event explanations state what happened, why it is hot, and why it matters; do not merely repeat the headline.
- Platform performance must retain platform, rank/hotness, source time, and evidence URL when available.
- “用户层面玩梗热点” remains a distinct module; do not rename it “可参与话题” or duplicate the event-detail copy.
- Business and communication advice belong in the standalone business-advice module, not inside each event-detail/trend card, unless the user asks otherwise.
- Do not introduce an “自动热点决策” module unless explicitly requested.
- Disaster, casualty, crime, scandal, and brand-crisis topics default to exclusion or public-service-only handling. Never turn suffering or emergencies into promotional copy.
- A fetched data date must be visible. Never claim “today” when the rendered page still contains older hard-coded events.

## Verify automation honestly

The reference dashboard contains both data-bound and authored sections. A successful update to `public/data/latest.json` or `radar.json` does not prove every visible module changed. Before claiming full automation, trace each visible section to its data source and verify the new date/content in the live DOM.

Minimum verification:

```bash
npm install
npm run radar:update
npm run build
```

Then verify:

- the scheduled workflow uses UTC cron values corresponding to the stated local times;
- `contents: write` is enabled and the bot can push to the production branch;
- new raw/processed/public data is committed only after all stages succeed;
- the production deployment is tied to that branch and commit;
- the live page loads its JSON without 404s and shows the new generation date;
- every module promised as automatic actually changed or was intentionally preserved.

## Read only what the task needs

- For structure, data flow, and file ownership, read [references/architecture.md](references/architecture.md).
- For adapting the radar to another business without damaging the UI logic, read [references/customization.md](references/customization.md).
- For GitHub Actions, Netlify/Vercel, schedules, secrets, and deployment checks, read [references/deployment.md](references/deployment.md).
- For JSON contracts and rendering bindings, read [references/data-contracts.md](references/data-contracts.md).
