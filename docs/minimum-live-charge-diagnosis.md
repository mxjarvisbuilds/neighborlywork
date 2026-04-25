# Minimum Live Charge Diagnosis

## Bucket-by-bucket diagnosis

### 1. `payment_authorized` contractors = 0
**Expected source:** a contractor billing authorization path should populate `contractors.stripe_customer_id`, `contractors.stripe_payment_method_id`, and set `contractors.payment_authorized = true`.

**Where the code expects it:**
- `app/billing-charge-execution.mjs`
- `scripts/run-billing-cycle-charges.mjs`
- founder dashboard count in `app/founder-dashboard.html`

**Why it is still zero:**
- there is currently **no app/UI or service-layer code** in the repo that writes those contractor billing fields
- the live `contractors` table is empty, so the count is zero even before payment authorization logic is considered

### 2. `ready_for_cycle` leads = 0
**Expected source:** founder lifecycle actions should move a lead into billable state by setting `billing_status = 'ready_for_cycle'` when a lead reaches `cleared`.

**Where the code expects it:**
- `app/lead-lifecycle-actions.mjs`
  - `clear_install`
  - `resolve_dispute_clear`
- founder/admin execution path in `app/lead-inbox.html`
- billing rules in `docs/backend-state-machine.md`

**Why it is still zero:**
- the live `leads` table is empty
- no lead has gone through the required transition chain to `cleared`
- there is no nightly/background reconciler yet promoting any existing eligible rows; the repo currently relies on explicit founder lifecycle actions

### 3. `billing_cycles` = 0
**Expected source:** founder billing prep should group `cleared + ready_for_cycle` leads by contractor and insert pending `billing_cycles`.

**Where the code expects it:**
- `app/billing-cycle-prep.mjs`
- `app/founder-dashboard.html` via **Prepare Billing Cycles**

**Why it is still zero:**
- `buildBillingCycles(...)` only emits cycles from leads already in `status = 'cleared'` and `billing_status = 'ready_for_cycle'`
- because the live DB has zero ready leads, the founder prep path has nothing to insert

### 4. queued notifications = 0
**Expected source:** lifecycle and ops actions insert `notifications` rows with `status = 'pending'`.

**Where the code expects it:**
- founder lifecycle transitions in `app/lead-inbox.html`
- founder billing prep in `app/founder-dashboard.html`
- change-order submission/response flows in `app/contractor-portal.html`
- homeowner change-order resolution in `app/change-order-review.html`

**Why it is still zero:**
- the live `notifications` table is empty because the DB has no leads/contractors and no lifecycle events have fired
- current live queueing is mostly `portal` channel events; the new SMS/email dispatcher only processes `sms` and `email`, so even once portal notifications exist that is a separate stream from outbound provider delivery

## Shortest minimum path to one test-mode charge attempt
The shortest path is **not** the full app happy path.

It is:
1. create one test contractor user + contractor row
2. attach a Stripe **test-mode** customer + payment method to that contractor and set `payment_authorized = true`
3. create one test homeowner user + one `cleared` lead with `billing_status = 'ready_for_cycle'` tied to that contractor
4. prepare one pending `billing_cycle`
5. run `scripts/run-billing-cycle-charges.mjs` against that cycle in Stripe **test mode**

## What is currently the single remaining blocker for a real test-mode attempt
- `SUPABASE_SERVICE_ROLE_KEY` is now fixed locally
- the machine still does **not** have a Stripe **test-mode** secret key available locally
- the only Stripe key discovered locally is a **live-mode** key, which must not be used for this requested test-mode end-to-end run

## Minimum wire-up decision
Wire the database fixture path and the Stripe test-profile creation path now, but do **not** execute a charge until a Stripe test secret is present locally.
