# NeighborlyWork Brand Ratings Seed — Batch 2

_Status: Checkpoint 2.3 working seed set. Second 6 launch brands for mainstream ducted residential quote comparisons._

## Scope

This batch continues the **mainstream ducted residential** launch seed set started in `docs/brand-ratings-seed-batch-1.md`.

### System type used in this batch
- `split_system`

## 1. Ruud
- **brand_name:** Ruud
- **system_type:** `split_system`
- **rating_score:** 7.5
- **confidence:** Medium
- **summary:** Strong mainstream residential brand closely tied to Rheem with broad contractor familiarity.
- **methodology_notes:** Broad residential quote relevance and support footprint support a solid upper-mid launch score. Keep closely aligned with Rheem unless later evidence supports a stronger separation.
- **source_notes:** Brand-family support relationship to Rheem; ENERGY STAR lineup presence; AHRI-certified products; warranty documentation; contractor/dealer footprint.

## 2. Goodman
- **brand_name:** Goodman
- **system_type:** `split_system`
- **rating_score:** 7.0
- **confidence:** Medium
- **summary:** Very common quote brand with strong market presence and value-positioning, but not positioned as a top premium score at launch.
- **methodology_notes:** Strong installed-base presence and broad contractor familiarity support a solid score. Keep below the premium tier until stronger independent reliability evidence justifies moving it higher.
- **source_notes:** Broad contractor prevalence; ENERGY STAR lineup presence; AHRI-certified products; warranty docs; Daikin-family support context.

## 3. Amana
- **brand_name:** Amana
- **system_type:** `split_system`
- **rating_score:** 7.5
- **confidence:** Medium
- **summary:** Mainstream residential brand with stronger premium positioning than Goodman inside the same family ecosystem.
- **methodology_notes:** Benefits from the Daikin/Goodman/Amana support ecosystem and recognizable warranty positioning. Slightly above Goodman at launch, but not in the top 8.5 tier without stronger independent reliability evidence.
- **source_notes:** Manufacturer warranty docs; ENERGY STAR lineup presence; AHRI certification; family support context; dealer footprint.

## 4. Daikin
- **brand_name:** Daikin
- **system_type:** `split_system`
- **rating_score:** 8.0
- **confidence:** Medium
- **summary:** Strong global HVAC brand with broad lineup depth and strong relevance in inverter and premium-efficiency conversations.
- **methodology_notes:** Strong product breadth, efficiency relevance, and family ecosystem support justify an upper-tier launch score. Keep confidence medium until seed evidence is fully localized and refreshed for Sacramento-facing quote patterns.
- **source_notes:** ENERGY STAR / high-efficiency lineup evidence; AHRI-certified products; warranty docs; support footprint; family ecosystem context.

## 5. York
- **brand_name:** York
- **system_type:** `split_system`
- **rating_score:** 7.0
- **confidence:** Medium
- **summary:** Established mainstream brand with broad residential familiarity and adequate launch coverage.
- **methodology_notes:** Strong enough support footprint and residential relevance to merit inclusion, but not enough launch evidence for a premium-tier score. Keep in the solid middle tier for initial comparisons.
- **source_notes:** ENERGY STAR lineup presence; AHRI-certified products; manufacturer warranty docs; dealer footprint; Johnson Controls family context.

## 6. Coleman
- **brand_name:** Coleman
- **system_type:** `split_system`
- **rating_score:** 6.5
- **confidence:** Medium
- **summary:** Recognizable mainstream value brand that belongs in launch comparisons but should start below the stronger mid-tier brands.
- **methodology_notes:** Launch score reflects residential relevance and support ecosystem without overclaiming premium quality. Keep slightly below York at launch unless stronger evidence emerges in later refreshes.
- **source_notes:** Johnson Controls family context; ENERGY STAR/AHRI coverage where applicable; warranty docs; contractor/dealer footprint.

---

## Batch 2 acceptance notes

Checkpoint 2.3 is complete when:
- six additional launch brands are defined
- each has a `system_type`
- each has a score
- each has a confidence level
- each has methodology/source notes sufficient for SQL seed conversion

## Next batch recommendation

Checkpoint 2.4 should cover the final launch batch and expansion brands:
- Payne
- Bosch
- Mitsubishi Electric
- Fujitsu
- Gree
- any regional / fallback additions if Sacramento-specific quoting patterns justify them
