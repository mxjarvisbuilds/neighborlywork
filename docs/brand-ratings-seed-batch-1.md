# NeighborlyWork Brand Ratings Seed — Batch 1

_Status: Checkpoint 2.2 working seed set. First 6 launch brands for mainstream ducted residential quote comparisons._

## Scope

This batch covers **mainstream ducted residential brands** most likely to appear in Sacramento replacement/install quotes.

### System type used in this batch
- `split_system`

This batch is intentionally focused on the most common “central split-system replacement” quote context. Later batches should expand into:
- `heat_pump`
- `gas_furnace`
- `mini_split`

## Launch scoring notes

These scores follow `docs/brand-ratings-methodology-v1.md`.

They are:
- brand-level summary signals
- shown on a **1–10 scale in 0.5-point steps**
- paired with a confidence label
- not presented as absolute truth for every model or install

---

## 1. Carrier
- **brand_name:** Carrier
- **system_type:** `split_system`
- **rating_score:** 8.5
- **confidence:** High
- **summary:** Strong all-around legacy brand with broad lineup depth, strong market recognition, and solid support footprint.
- **methodology_notes:** Strong support footprint, broad efficient lineup, and strong brand familiarity in residential replacement quotes. Brand-level score should still be paired with install-quality caveat.
- **source_notes:** Consumer Reports reliability/satisfaction when available; ENERGY STAR lineup presence; AHRI-certified product breadth; manufacturer warranty docs; broad dealer footprint.

## 2. Bryant
- **brand_name:** Bryant
- **system_type:** `split_system`
- **rating_score:** 8.0
- **confidence:** Medium
- **summary:** Strong mainstream brand with close family ties to Carrier and broad residential quote relevance.
- **methodology_notes:** Benefits from broad residential presence and strong support ecosystem. Slightly lower confidence than Carrier because public consumer-facing independent coverage is often less front-and-center at the brand level.
- **source_notes:** Brand-family support relationship to Carrier ecosystem; ENERGY STAR and AHRI coverage; manufacturer warranty docs; dealer network evidence.

## 3. Trane
- **brand_name:** Trane
- **system_type:** `split_system`
- **rating_score:** 8.5
- **confidence:** High
- **summary:** Premium-leaning mainstream brand with strong homeowner recognition, broad lineup, and strong installer footprint.
- **methodology_notes:** Strong support footprint and premium-market perception combined with broad residential install presence. Use the same installation-quality caveat because premium branding does not guarantee a better install.
- **source_notes:** Consumer Reports reliability/satisfaction when available; ENERGY STAR lineup strength; AHRI-certified products; warranty docs; broad dealer footprint.

## 4. American Standard
- **brand_name:** American Standard
- **system_type:** `split_system`
- **rating_score:** 8.5
- **confidence:** High
- **summary:** Strong mainstream brand closely aligned with Trane, with broad residential fit and strong service support.
- **methodology_notes:** Comparable brand-family support strength and market reputation to Trane in residential split-system work. Keep rating aligned unless stronger contrary evidence appears in later seed review.
- **source_notes:** Brand-family relationship to Trane platform; ENERGY STAR and AHRI coverage; warranty documentation; contractor/dealer footprint.

## 5. Lennox
- **brand_name:** Lennox
- **system_type:** `split_system`
- **rating_score:** 7.5
- **confidence:** Medium
- **summary:** Well-known premium/mainstream brand with strong efficiency reputation, but should not automatically outrank peers without stronger reliability evidence.
- **methodology_notes:** Strong efficiency perception and lineup depth support a solid score. Keep below the top 8.5 tier until seed evidence shows clearly superior independent reliability and support signals for the launch market.
- **source_notes:** ENERGY STAR / premium efficiency presence; AHRI-certified lineup; warranty docs; mainstream dealer footprint; independent reliability data when available.

## 6. Rheem
- **brand_name:** Rheem
- **system_type:** `split_system`
- **rating_score:** 7.5
- **confidence:** Medium
- **summary:** Strong mainstream residential brand with broad quote presence and solid support footprint.
- **methodology_notes:** Good all-around launch candidate with broad residential install presence and recognizable support network. Keep in the upper-mid launch tier pending fuller model-specific evidence and refresh review.
- **source_notes:** ENERGY STAR lineup presence; AHRI-certified products; manufacturer warranty docs; support/dealer footprint; independent reliability data where available.

---

## Batch 1 acceptance notes

Checkpoint 2.2 is complete when:
- six launch brands are defined
- each has a `system_type`
- each has a score
- each has a confidence level
- each has methodology/source notes sufficient for later SQL seeding

## Next batch recommendation

Checkpoint 2.3 should cover the next 6 mainstream brands:
- Ruud
- Goodman
- Amana
- Daikin
- York
- Coleman
