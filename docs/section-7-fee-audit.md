# Section 7 — Fee Copy Audit

_Status: grounded in-repo on 2026-04-24 before execution._

## Scope

### 7.1 — Inventory
- Grep and inventory all `$350` / fee-copy references across the entire codebase.

### 7.2 — Cleanup
- Remove or replace invalid references in code, content, and docs.

### 7.3 — Approved launch install referral amount locations
- Verify the launch install referral amount appears only in approved locations:
  - contractor signup Step 3
  - contractor portal Fee Terms tab
  - Terms of Service
  - internal admin pages

### 7.4 — Homeowner-facing fee language
- Verify zero homeowner-facing fee language outside Terms.
- Defer live-site verification until Netlify unpauses.

### 7.5 — Final proof
- Produce a final audit report with proof paths and commit it to the repo.

## Execution rule
- Chain through the full section without stopping unless genuinely blocked.

## Launch requirement
- Fee copy must be internally consistent before launch.
- Contractor fee language may remain in contractor/admin/internal surfaces and Terms.
- Homeowner-facing surfaces must not expose contractor fee language outside Terms.
