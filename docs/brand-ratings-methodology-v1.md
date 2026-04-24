# NeighborlyWork Brand Ratings Methodology v1

_Status: Launch rubric for checkpoint 2.1. Use this document as the source of truth for seeding and refreshing `public.brand_ratings`._

## Purpose

NeighborlyWork shows homeowners a simple **1–10 brand rating** when comparing HVAC quotes.

This score is **brand-level guidance**, not a promise about any single model or installation. The goal is to help homeowners compare brands at a glance while staying honest about the limits of brand-level scoring in HVAC.

## Core product rule

Always pair the brand score with a short caveat in product copy:

> Brand ratings summarize independent research, efficiency certifications, warranty terms, and support footprint. Actual performance depends heavily on correct sizing, installation quality, and maintenance.

## Source hierarchy

Use a hierarchy of evidence instead of pretending all brands have identical data coverage.

### Tier 1 — Primary sources
1. **Consumer Reports**
   - Use for owner satisfaction and predicted reliability when available.
   - Highest-value signal for brand-level quality.
2. **ENERGY STAR / ENERGY STAR Most Efficient**
   - Use for lineup efficiency strength and premium-efficiency presence.
3. **AHRI certified data / AHRI directory**
   - Use for certification and performance transparency.

### Tier 2 — Supporting sources
4. **CEE tiers / federal incentive eligibility / DOE references**
   - Use as supporting evidence for efficiency breadth.
5. **Manufacturer warranty documents**
   - Use for parts/compressor/heat exchanger coverage and transferability.
6. **CPSC or other official recall/enforcement sources**
   - Use as a negative modifier if a recent issue is material.

### Tier 3 — Tie-breaker / qualitative sources
7. **Dealer network / training program evidence**
   - Use for service support footprint.
8. **Installed-base / parts-availability proxies**
   - Use cautiously when strong primary-source data is limited.

## Sources to avoid as primary scoring inputs
Do **not** use the following as primary brand-score inputs:
- Yelp / Google Reviews / BBB complaint counts
- retailer star ratings
- affiliate “best HVAC brand” blog lists
- AI-generated summaries without primary-source verification

Those can be used for background reading only, not direct scoring.

## Scoring dimensions

Use **6 weighted dimensions**.

| Dimension | Weight | What it measures |
|---|---:|---|
| Reliability & owner satisfaction | 30% | Independent evidence that owners report durable, satisfying systems |
| Efficiency lineup strength | 20% | Breadth of efficient / premium-efficiency qualifying products |
| Warranty coverage quality | 15% | Parts/compressor/heat-exchanger coverage quality and transferability |
| Certification & performance transparency | 10% | AHRI certification presence and published spec clarity |
| Service / support footprint | 15% | Dealer network, support availability, installed-base confidence |
| Negative trust modifiers | 10% | Recent recalls or other material issues that should reduce confidence |

## Internal scoring model

Each dimension is scored on a **1–5 scale**:

- **5** = clearly strong evidence
- **4** = above average / solid support
- **3** = adequate / mixed
- **2** = weaker / limited support
- **1** = poor / significant concern

Then calculate:

`weighted_score_100 = Σ((dimension_score / 5) * weight)`

Then map to display score:

`display_score = round_to_nearest_0.5(weighted_score_100 / 10)`

## Display bands

Do not imply false precision. Prefer **0.5-point steps**.

| Display score | Meaning |
|---|---|
| 9.5–10.0 | Exceptional |
| 8.5–9.0 | Excellent |
| 7.5–8.0 | Very good |
| 6.5–7.0 | Good |
| 5.5–6.0 | Above average |
| 4.5–5.0 | Average |
| 3.5–4.0 | Below average |
| 2.5–3.0 | Weak |
| 1.0–2.0 | Limited confidence / major concerns |

## Missing-data rules

We never want a fake-precise score built on weak evidence.

### Rule 1 — No noisy substitutions
If a strong source is missing, do **not** substitute consumer review sites or generic blog rankings.

### Rule 2 — Confidence label is required
Every brand rating should carry one of:
- **High confidence**
- **Medium confidence**
- **Limited data**

### Rule 3 — Score cap for weak evidence
If independent reliability / owner-satisfaction data is unavailable, cap the displayed score at **8.0** unless there is unusually strong support in the remaining dimensions.

### Rule 4 — Insufficient data fallback
If more than **2 core dimensions** are unsupported, prefer:
- `rating_score` still stored if needed for internal sorting, but
- UI should show **Limited data** and avoid making the score feel authoritative.

## Freshness rules

| Source type | Refresh cadence |
|---|---|
| Consumer Reports reliability / owner satisfaction | Annually or when new results publish |
| ENERGY STAR / incentive eligibility | Quarterly |
| Warranty docs | At least annually |
| Recalls / official safety notices | Quarterly |
| Service/support footprint review | Semiannually |
| Full brand score refresh | Annually |

### Staleness penalties
- Reliability data older than **24 months** → reduce reliability weight by 25% and note stale data.
- Warranty docs older than **12 months** → verify before using.
- Efficiency eligibility older than **12 months** → refresh before relying on it.

## Public-facing copy guidance

Use phrasing like:
- “Brand rating summarizes independent research, efficiency certifications, warranty terms, and support footprint.”
- “Ratings reflect brand-level signals, not every model or installer.”
- “Where third-party data is limited, we label that clearly.”

Avoid phrasing like:
- “best brand”
- “most reliable” unless directly tied to a named source and period
- “scientific score”
- “guaranteed quality” or anything that implies installation quality does not matter

## Data shape for `rating_sources`

Store `rating_sources` as a JSON array of source objects. Recommended shape:

```json
[
  {
    "category": "reliability",
    "source_name": "Consumer Reports",
    "source_type": "independent_survey",
    "evidence_date": "2026-01-01",
    "url": "https://...",
    "notes": "Predicted reliability available for central AC and heat pumps"
  },
  {
    "category": "efficiency",
    "source_name": "ENERGY STAR",
    "source_type": "certification",
    "evidence_date": "2026-02-15",
    "url": "https://...",
    "notes": "Most Efficient models present"
  }
]
```

## `methodology_notes` guidance

`methodology_notes` should be written in plain language and answer:
- what helped the score most
- what limited the score or confidence
- what the homeowner should understand about the brand at a glance

Example:

> Strong warranty support and broad efficient lineup. Independent reliability data available. Score reflects brand-level signals only; install quality still matters heavily.

## Launch brand set for Sacramento seed work

Use this as the initial brand universe for checkpoint 2.2+.

### Core launch set (15)
- Carrier
- Bryant
- Payne
- Trane
- American Standard
- Lennox
- Rheem
- Ruud
- Goodman
- Amana
- Daikin
- York
- Coleman
- Bosch
- Mitsubishi Electric

### Expansion set (add next if needed)
- Fujitsu
- Gree

## Brand-family normalization guidance

Use family-aware normalization so quotes don’t look fragmented:

- **Carrier family**: Carrier, Bryant, Payne
- **Trane family**: Trane, American Standard
- **Rheem family**: Rheem, Ruud
- **Daikin family**: Daikin, Goodman, Amana
- **Johnson Controls family**: York, Coleman
- **Ductless leaders**: Mitsubishi Electric, Fujitsu, Gree

Do **not** collapse these into one displayed brand for the homeowner. Keep them distinct in UI, but use family awareness during research and quality review.

## System-type coverage notes

### Ducted central AC / furnace / heat pump quotes
Most likely launch brands:
- Carrier / Bryant / Payne
- Trane / American Standard
- Lennox
- Rheem / Ruud
- Goodman / Amana / Daikin
- York / Coleman
- Bosch

### Mini-split / ductless quotes
Most likely launch brands:
- Mitsubishi Electric
- Daikin
- Fujitsu
- Gree

### Sacramento-specific expectation
For Sacramento launch, expect strong visibility for:
- standard split-system replacements
- heat-pump replacement / conversion quotes
- some mini-split quotes for additions, garages, ADUs, and partial-home solutions

## Acceptance criteria for checkpoint 2.1

Checkpoint 2.1 is complete when:
- a written methodology exists in-repo
- the source hierarchy is explicit
- the scoring dimensions and weights are explicit
- freshness rules are explicit
- missing-data and confidence handling are explicit
- the launch brand universe is defined for seed work
