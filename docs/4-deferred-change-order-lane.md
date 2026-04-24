# Deferred Lane — Section 4 Full Change-Order Workflow

_Status: deferred from current Section 5/6 execution lane, but **required before launch**._

## Why this is deferred
Rocky shipped the lead lifecycle/status-control path for `change_order_open`, but the repo still does **not** contain the full Section 4 operational workflow for:
- selected contractor submitting a real `change_orders` record
- 48-hour competing bidder response window
- `change_order_responses` creation and review
- homeowner acceptance / reject-and-switch behavior
- quote supersede + replacement bidder selection workflow

The backend schema and RLS are already present for these tables, but the app/service workflow is incomplete.

## Required pre-launch outcome
Before launch, NeighborlyWork must support the full change-order flow end to end:
1. Selected contractor submits a valid change order tied to the selected quote and lead.
2. Original selected quote is superseded when appropriate.
3. Other eligible original bidders can respond within the documented 48-hour window.
4. Homeowner can:
   - accept
   - reject and switch contractor
   - request more info
5. Lead lifecycle updates correctly across:
   - `pending_verification -> change_order_open`
   - `change_order_open -> confirmed`
   - `change_order_open -> pending_verification`
6. Notifications are created for all involved parties.
7. `lead_status_history` and quote-side effects remain consistent.

## Current shipped fallback
Current shipped state only provides:
- founder/admin ability to move a lead into `change_order_open`
- founder/admin ability to move `change_order_open -> confirmed`
- no contractor-authored `change_orders` workflow yet
- no competitor response workflow yet
- no homeowner response UI yet

This is good enough for internal lifecycle control while building Sections 5 and 6, but **not good enough for launch**.

## Implementation targets
- `app/contractor-portal.html`
  - add contractor submit-change-order flow for selected leads
- `app/homeowner-dashboard.html` and/or a dedicated homeowner change-order page
  - show change order details + response actions
- new shared helpers/modules
  - change-order authoring
  - response window timing
  - homeowner resolution handling
- founder/admin visibility
  - deeper review tooling beyond raw status control

## Data / service layer targets
- create service-layer helpers around existing tables:
  - `public.change_orders`
  - `public.change_order_responses`
- ensure side effects remain aligned with `docs/backend-state-machine.md`
- queue notifications for:
  - selected contractor submission
  - competing bidder response window
  - homeowner response required
  - final acceptance / switch outcome

## Launch gate
**Do not treat Section 4 as complete for launch readiness until the full `change_orders` + competing-response workflow exists in the app and is verified.**
