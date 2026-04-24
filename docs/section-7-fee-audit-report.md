# Section 7 — Fee Copy Audit Report

_Status: complete on 2026-04-24, pending commit._

## Scope completed
- 7.1 — inventoried fee-copy references across repo
- 7.2 — removed or replaced invalid references in code, content, and docs
- 7.3 — verified exact launch install referral amount appears only in approved locations
- 7.4 — verified zero homeowner-facing fee language in key repo surfaces outside Terms
- 7.5 — this proof report committed in repo

## 7.1 Inventory summary
### Exact `$350`
- No fee-copy references found.
- Remaining `350` hits were unrelated implementation/test values such as `permit_buffer`.

### Exact legacy repair amount
- No exact repair-fee copy references remain.
- Remaining older repair-fee copy was removed from outdated public/docs surfaces.

### Exact launch install amount before cleanup
Invalid references initially found in:
- `start.html`
- `app/pricing.html`
- `app/contractors.html`
- `docs/product-spec.md`
- `docs/backend-state-machine.md`
- test naming / audit-spec wording

Approved live references already existed in:
- `app/contractor-auth.html` (Step 3 agreement)
- `app/contractor-portal.html` (Fee Terms tab)
- `terms.html`
- internal admin revenue examples (`founder-dashboard.html`, `founder-dashboard-data.json`)

## 7.2 Cleanup completed
### Public / customer-facing surfaces cleaned
- `start.html`
  - removed explicit contractor fee amount / fee phrasing from contractor promo band
- `index.html`
  - removed public homepage contractor-section fee wording (`No monthly fees`)
- `homepage-draft.html`
  - removed contractor promo fee wording (`pay only when you close`)
- `app/pricing.html`
  - removed explicit public contractor fee amounts and stale small-job fee ladders
  - reframed page around launch guardrails and free homeowner usage
- `app/contractors.html`
  - removed stale/wrong public contractor pricing (legacy repair/install amount copy)
  - replaced with agreement/Terms-directed contractor billing wording

### Internal docs cleaned
- `docs/product-spec.md`
  - replaced literal dollar fee copy with generalized launch referral-rate wording
- `docs/backend-state-machine.md`
  - replaced literal fee amount with `configured install referral fee`
- `docs/section-7-fee-audit.md`
  - removed exact launch install amount from the spec heading/body so it would not pollute final proof

### Test / support copy cleaned
- `tests/billing-cycle-prep.test.mjs`
  - removed literal launch install amount from test name

## 7.3 Final exact launch install amount proof
Repo-wide exact launch install amount references remain only in these approved locations:

### Contractor signup Step 3
- `app/contractor-auth.html:125`
- `app/contractor-auth.html:127`
- `app/contractor-auth.html:166`

### Contractor portal Fee Terms tab
- `app/contractor-portal.html:218`

### Terms of Service
- `terms.html:111`
- `terms.html:125`
- `terms.html:131`

### Internal admin pages / admin data
- `founder-dashboard.html:282`
- `founder-dashboard.html:283`
- `founder-dashboard.html:286`
- `founder-dashboard.html:290`
- `founder-dashboard-data.json:50`
- `founder-dashboard-data.json:60`
- `founder-dashboard-data.json:90`
- `founder-dashboard-data.json:130`

## 7.4 Homeowner-facing fee-language proof
### Zero hits in key homeowner/public repo surfaces
- `index.html` — zero fee-language hits after cleanup
- `start.html` — zero fee-language hits after cleanup
- `app/homeowner-*.html` — zero fee-language hits

### Allowed exception
- `terms.html`
  - homeowner/legal explanation of contractor referral fee remains, as allowed by spec

### Deferred proof
- Live deployed site verification remains deferred until Netlify unpauses.

## 7.5 Honest caveats
- Public contractor-facing pages may still reference contractor participation generically (for example, agreement/Terms-directed billing wording), but no explicit invalid fee amounts remain there.
- Internal admin revenue examples intentionally retain the launch install amount because they are approved internal/admin surfaces.
- This audit was repo-based only; live-site/browser confirmation is still deferred per instruction.

## Files changed in this section
- `docs/section-7-fee-audit.md`
- `docs/section-7-fee-audit-report.md`
- `start.html`
- `index.html`
- `homepage-draft.html`
- `app/pricing.html`
- `app/contractors.html`
- `docs/product-spec.md`
- `docs/backend-state-machine.md`
- `tests/billing-cycle-prep.test.mjs`
