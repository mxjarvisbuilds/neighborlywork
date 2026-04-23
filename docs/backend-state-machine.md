# NeighborlyWork Backend State Machine v1

## Canonical lead lifecycle
`leads.status` is the canonical lifecycle field.

### Allowed states
1. `new`
2. `matched_to_contractors`
3. `quotes_submitted`
4. `homeowner_selected`
5. `pending_verification`
6. `change_order_open`
7. `confirmed`
8. `install_scheduled`
9. `install_complete`
10. `disputed`
11. `cleared`
12. `cancelled`

## Allowed transitions
- `new -> matched_to_contractors`
- `matched_to_contractors -> quotes_submitted`
- `quotes_submitted -> homeowner_selected`
- `homeowner_selected -> pending_verification`
- `pending_verification -> confirmed`
- `pending_verification -> cancelled`
- `pending_verification -> change_order_open`
- `change_order_open -> pending_verification` (homeowner switches contractor)
- `change_order_open -> confirmed` (change order accepted)
- `confirmed -> install_scheduled`
- `install_scheduled -> install_complete`
- `install_complete -> disputed`
- `install_complete -> cleared`
- `disputed -> cleared`
- `disputed -> cancelled`

## Transition preconditions

### `new -> matched_to_contractors`
Requires:
- lead exists
- homeowner exists
- up to 3 eligible contractors matched

Effects:
- notifications queued for selected contractors
- optional draft quotes generated
- state history logged

### `matched_to_contractors -> quotes_submitted`
Requires:
- at least 1 quote with `quotes.status = 'submitted'`

### `quotes_submitted -> homeowner_selected`
Requires:
- selected quote belongs to lead
- selected quote status = `submitted`
- selected contractor exists

Effects:
- set `selected_contractor_id`
- set `selection_timestamp`

### `homeowner_selected -> pending_verification`
Requires:
- `selected_contractor_id` present

Effects:
- set `verification_window_expires = selection_timestamp + interval '72 hours'`
- selected quote status becomes `selected`
- non-selected submitted quotes become `rejected`

### `pending_verification -> change_order_open`
Requires:
- selected contractor submits valid change order
- original selected quote exists

Effects:
- original selected quote becomes `superseded`
- 48-hour response window opens for other eligible bidders

### `change_order_open -> pending_verification`
Use when homeowner rejects change order and switches to another bidder.

Requires:
- homeowner response = `rejected_switched_contractor`
- replacement contractor chosen from original eligible bidders

Effects:
- `selected_contractor_id` updates to replacement contractor
- `selection_timestamp` resets to switch time
- `verification_window_expires` resets to switch time + 72 hours

### `change_order_open -> confirmed`
Requires:
- homeowner response = `accepted`

### `pending_verification -> confirmed`
Requires one of:
- contractor/homeowner verification complete with no change order
- system/admin confirms verification period passed cleanly and work confirmed

### `confirmed -> install_scheduled`
Requires:
- install date or scheduling confirmation captured

### `install_scheduled -> install_complete`
Requires:
- contractor marks install complete
- photo confirmation stored or equivalent evidence path recorded

Effects:
- set `install_complete_timestamp`
- set `dispute_window_expires = install_complete_timestamp + interval '7 days'`
- billing status remains `not_ready` until dispute window clears

### `install_complete -> disputed`
Requires:
- homeowner dispute submitted within dispute window

### `install_complete -> cleared`
Requires:
- dispute window expires with no active dispute

Effects:
- set `billing_status = 'ready_for_cycle'`

### `disputed -> cleared`
Requires:
- admin manual review resolves dispute in contractor/platform favor or acceptable settlement path

### `disputed -> cancelled`
Requires:
- admin manual review voids chargeable outcome and cancels billing path

## Quote lifecycle (`quotes.status`)
Allowed values:
- `draft`
- `submitted`
- `superseded`
- `selected`
- `rejected`

### Rules
- system-generated draft quotes start as `draft`
- contractor-edited final bids move to `submitted`
- selected quote becomes `selected`
- non-selected quotes become `rejected`
- quote replaced by a change order becomes `superseded`

## Change order lifecycle
Represented by:
- `change_orders.homeowner_response`
- lead state `change_order_open`

### Core rules
- only selected contractor may submit a change order
- other original bidders may respond within 48 hours
- homeowner may:
  - accept
  - reject and switch contractor
  - request more info

## Billing lifecycle
Tracked on `leads.billing_status` and `billing_cycles.status`.

### Lead billing statuses
- `not_ready`
- `ready_for_cycle`
- `in_cycle`
- `paid`
- `failed`
- `waived`

### Billing rules
- fee amount = `$800` per cleared install
- only `cleared` leads are billable
- nightly job marks eligible leads `ready_for_cycle`
- 14-day billing job groups by contractor into `billing_cycles`
- on successful charge:
  - lead.billing_status = `paid`
  - lead.billed_at set
  - lead.billing_cycle_id set
- on failed charge:
  - lead.billing_status = `failed` or remains `in_cycle` depending on retry stage
  - retry up to 3 times in 7 days
  - freeze contractor account after final failure

## Audit logging rule
Every successful lead status transition must create one `lead_status_history` row with:
- `lead_id`
- `previous_status`
- `new_status`
- `triggered_by`
- `triggered_by_system`
- `reason`
- `metadata`

## Notifications rule
Any major lifecycle event should create notification records for the relevant user(s) before downstream channel delivery.
