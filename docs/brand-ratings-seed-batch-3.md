# NeighborlyWork Brand Ratings Seed — Batch 3

_Status: Checkpoint 2.4 working seed set. Final launch batch + expansion brands._

## Scope

This batch finishes the initial launch universe and adds the first ductless-focused expansion brands.

## System types used in this batch
- `split_system` for mainstream ducted holdouts
- `mini_split` for ductless-first brands

---

## 1. Payne
- **brand_name:** Payne
- **system_type:** `split_system`
- **rating_score:** 7.0
- **confidence:** Medium
- **summary:** Value-oriented mainstream brand within the Carrier family ecosystem.
- **methodology_notes:** Launch score reflects broad residential relevance and family support strength without placing it in the premium tier.
- **source_notes:** Carrier-family ecosystem support; ENERGY STAR/AHRI coverage where available; warranty docs; contractor prevalence.

## 2. Bosch
- **brand_name:** Bosch
- **system_type:** `split_system`
- **rating_score:** 8.0
- **confidence:** Medium
- **summary:** Strong modern/inverter-oriented brand with meaningful relevance in heat-pump and higher-efficiency discussions.
- **methodology_notes:** Launch score reflects strong efficiency relevance and premium positioning in modern electrification conversations. Keep confidence medium pending fuller seed refresh on local install prevalence.
- **source_notes:** ENERGY STAR / higher-efficiency lineup evidence; AHRI certification; warranty docs; contractor support footprint.

## 3. Mitsubishi Electric
- **brand_name:** Mitsubishi Electric
- **system_type:** `mini_split`
- **rating_score:** 9.0
- **confidence:** High
- **summary:** Top-tier ductless brand for launch comparisons, especially where mini-split / zone-based solutions are in play.
- **methodology_notes:** Strong ductless-market reputation, broad mini-split relevance, and strong support footprint justify a top-tier launch score for the `mini_split` context.
- **source_notes:** Independent reputation strength in ductless market; ENERGY STAR / premium efficiency presence; AHRI-certified products; support/dealer footprint.

## 4. Fujitsu
- **brand_name:** Fujitsu
- **system_type:** `mini_split`
- **rating_score:** 8.0
- **confidence:** Medium
- **summary:** Strong ductless-focused brand that belongs in launch expansion for mini-split comparisons.
- **methodology_notes:** Solid mini-split relevance and support strength justify an upper-tier score, but keep it below Mitsubishi Electric at launch unless stronger independent evidence supports parity.
- **source_notes:** Ductless market relevance; ENERGY STAR / AHRI coverage; warranty docs; installer footprint.

## 5. Gree
- **brand_name:** Gree
- **system_type:** `mini_split`
- **rating_score:** 7.0
- **confidence:** Medium
- **summary:** Useful ductless expansion brand for launch coverage, but not in the top premium tier.
- **methodology_notes:** Include for breadth in mini-split comparisons while keeping the score conservative relative to stronger premium ductless brands.
- **source_notes:** Mini-split market presence; efficiency/certification evidence where available; warranty docs; contractor footprint.

## 6. Sacramento expansion / regional fallback note
If an additional Sacramento-specific brand repeatedly appears in live quote traffic after launch, add it as a **regional expansion seed** rather than forcing it into the initial launch set prematurely.

Suggested rule:
- if a brand appears in **3+ real homeowner quote comparisons** within the first launch window, add it to the next seed refresh batch with system-type-specific scoring.

---

## Launch coverage summary after Batch 3

### Mainstream ducted launch coverage
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

### Ductless launch / expansion coverage
- Mitsubishi Electric
- Fujitsu
- Gree

## Batch 3 acceptance notes

Checkpoint 2.4 is complete when:
- the remaining planned launch brands are drafted
- ductless expansion brands are represented
- system-type differences are explicit where needed
- the launch coverage set is complete enough to convert into seed SQL in checkpoint 2.5

## Next step

Checkpoint 2.5 should convert the approved batches into:
- a SQL seed file for `public.brand_ratings`
- consistent `rating_sources` JSON shapes
- founder/admin-friendly update guidance
