# Customization

## Business adaptation

The template contains JD local-life examples such as delivery, instant retail, housekeeping, travel, restaurants, malls, and coffee. For another organization:

1. Inventory the user's actual businesses, service boundaries, locations, fulfillment constraints, and prohibited topics.
2. Replace `businessPatterns` and exclusions in `config/hotspot-rules.json`.
3. Replace business classification and action copy in `scripts/analyze-hotspots.mjs`.
4. Replace the dashboard's business selector, business-advice copy, platform notes, and seed event examples.
5. Keep event details, meme topics, and business advice as different editorial objects.

Do not merely replace brand names. A food-delivery action, travel action, and public-service notice have different evidence, timing, and risk requirements.

## Grading

- **S:** exceptional cross-platform momentum, strong and immediate business fit, executable idea, low/manageable risk.
- **A:** strong signal and clear business action after review.
- **B:** useful but narrower, earlier, or more conditional opportunity.
- **Observe:** insufficient business fit, durability, evidence, or executable action.
- **Reject:** prohibited/high-risk commercial leverage.

Grades are decisions, not raw heat labels. All visible grade colors and lists must derive from the same decision.

## Editorial quality

For each selected event, produce separate fields for:

- factual event summary;
- platform evidence and timestamp;
- explanation of the heat driver;
- selection rationale tied to scoring evidence;
- risk note;
- optional business action and communication idea in the standalone advice module.

For meme topics, require a concrete reproducible template or behavior. Do not duplicate a selected event merely under a new heading.

## Source adaptation

Public platform endpoints are unstable. Keep multiple fallbacks, timeouts, minimum-item checks, normalized fields, and source attribution. If a source requires a token, make it optional where possible and document the reduced coverage when absent.

