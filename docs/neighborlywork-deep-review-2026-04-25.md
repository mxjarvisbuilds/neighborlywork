# NeighborlyWork Deep Review — Billing Auth + Charge Runner

Timestamp: 2026-04-25 02:30:44 PDT  
Reviewer: Rocky  
Scope: security audit of contractor billing authorization flow and Stripe charge runner; test coverage gaps; code quality/refactor review for files touched in the last 5 commits.  
Constraint: report-only review. No code changes made.

## Executive verdict

The recent NeighborlyWork billing work is **real and directionally solid for test-mode/operator validation**, not hollow. The core billing authorization helpers, Stripe Checkout setup path, billing-cycle charge builder, retry/failure planning, and notification planning are covered by pure-function tests and one live Stripe TEST-mode charge has already been verified.

However, it is **not production-ready without hardening**. The biggest concerns are:

1. **Open redirect / unvalidated return origin in billing setup URLs.** The Edge Function and local helper trust caller-provided origin when constructing Stripe Checkout `success_url` and `cancel_url`.
2. **No durable DB-side lock/claim/transaction around billing-cycle charging.** Sequential REST updates after Stripe charge create partial-failure and concurrent-run risks.
3. **Wildcard CORS on the billing setup Edge Function/local bridge.** Auth still gates access, but origin should be restricted before production.
4. **Sensitive Stripe object IDs are displayed/returned more than needed.** Not secrets, but unnecessary exposure.
5. **Testing is mostly pure-function/unit coverage.** Missing Edge Function handler tests, runner integration tests, origin abuse tests, concurrency/partial-failure tests, and browser E2E coverage.

## Evidence gathered

- Repo state before report: `main` synced to `origin/main` at `7b0ba14`.
- Last five commits reviewed:
  - `7b0ba14 chore: clean deprecated production files`
  - `75f35b5 docs: record production validation blocker`
  - `5d4fdf0 feat: verify contractor billing authorization flow`
  - `80705a7 ops: add minimum billing fixture path`
  - `4145279 ops: add local billing and notification runners`
- Files touched across last five commits included billing setup helper/page, contractor portal, billing charge execution, charge runner, fixture/profile scripts, Edge Function, notification runner, tests, deployment docs, heartbeat, redirects, and removed deprecated pages.
- Test command run: `node --test tests/*.test.mjs`
- Test result: **36 tests, 36 pass, 0 fail, 0 skipped, 0 todo**.

## What the current tests verify

The 36 passing tests cover:

- Billing charge eligibility for pending/failed cycles with authorized Stripe billing profile.
- Stripe PaymentIntent request construction, including cents conversion, USD currency, off-session confirmation, and deterministic idempotency key.
- Billing success plan: cycle paid, retry cleared, leads paid/billed, receipt notification queued.
- Billing failure plan: retry scheduling, final failure contractor freeze, lead billing status transitions.
- Billing-cycle prep: eligible cleared/ready leads grouped into 14-day contractor cycles.
- Contractor billing setup helper:
  - origin trimming/defaulting,
  - setup-mode Checkout request fields,
  - incomplete/cross-contractor session rejection,
  - authorization update extraction and freeze clearing.
- Notification delivery pure helpers for Twilio/Resend request construction and retry updates.
- Existing quote/change-order/lifecycle/helper flows.

## Security audit findings

### High — unvalidated origin can control Stripe Checkout return URLs

Files:
- `app/contractor-billing-setup.mjs:1-24`
- `supabase/functions/contractor-billing-setup/index.ts:33-52`
- `supabase/functions/contractor-billing-setup/index.ts:172-178`
- `app/contractor-portal.html:639-645`

Issue:
- `buildCheckoutSessionRequest` / `buildCheckoutSessionForm` build `success_url` and `cancel_url` from raw `origin`.
- The Edge Function uses `body?.origin || req.headers.get('origin')`.
- Current tests only assert happy-path `https://neighborlywork.com/`; they do not reject hostile origins.

Impact:
- A malicious authenticated contractor or script using a stolen session could create a Checkout session returning to an attacker-controlled origin. Stripe metadata still protects the finalization from cross-contractor assignment, but the redirect target can be abused for phishing/confusion and may leak the Checkout `session_id` in a URL the attacker controls.

Recommendation:
- Add a strict allowlist: production `https://neighborlywork.com`, maybe `https://www.neighborlywork.com`, and localhost only in explicit dev mode.
- Do not accept arbitrary body origin in production.
- Add tests for `https://evil.example`, `javascript:`, whitespace, path injection, and unknown domains.

### High — charge runner lacks durable claim/lock/transaction around Stripe charges

Files:
- `scripts/run-billing-cycle-charges.mjs:74-87`
- `scripts/run-billing-cycle-charges.mjs:97-118`
- `scripts/run-billing-cycle-charges.mjs:120-130`
- `scripts/run-billing-cycle-charges.mjs:133-180`

Issue:
- Candidate cycles are selected with `status=in.(pending,failed)` and then charged.
- There is no DB-side atomic claim such as `pending -> processing` with `where status = pending` before calling Stripe.
- After Stripe succeeds, the script applies several REST updates in sequence: billing cycle, leads, contractor, notifications.

Impact:
- Two operators/processes can select and attempt the same pending cycle concurrently.
- Stripe idempotency key reduces duplicate Stripe charge risk for the same retry count, but it does not make DB updates atomic.
- If Stripe succeeds and a later Supabase PATCH/INSERT fails, the system can be left partially updated: money captured, cycle not marked paid, leads not marked paid, receipt notification missing.
- If failure-plan DB writes fail after a Stripe failure, retry/freeze state can drift from actual attempts.

Recommendation:
- Move billing execution into a Postgres RPC/Edge Function with transaction semantics, or at minimum add a claim step that updates `billing_cycles.status='processing'` with a strict `where id=... and status in (...)` and verifies one row updated before Stripe call.
- Persist an attempt row before/after Stripe so reconciliation is possible.
- Store PaymentIntent status and raw provider code in an audit table.
- Add an idempotent reconciliation command for cycles with Stripe PI but incomplete DB side effects.

### Medium — wildcard CORS on billing setup endpoint

Files:
- `supabase/functions/contractor-billing-setup/index.ts:1-5`
- `scripts/contractor-billing-setup-bridge.mjs:47-53`

Issue:
- `Access-Control-Allow-Origin: *` is used for billing setup endpoints.
- Authentication is required, and the local bridge binds to `127.0.0.1`, so this is not immediately catastrophic. But for production Edge Function, the billing setup endpoint should not be callable cross-origin from any site with a contractor's browser session/token.

Recommendation:
- Return the request origin only if it is in the production/dev allowlist.
- Pair with the return-origin allowlist above.

### Medium — Stripe setup session validation accepts missing metadata

Files:
- `app/contractor-billing-setup.mjs:26-35`
- `supabase/functions/contractor-billing-setup/index.ts:55-63`

Issue:
- Validation rejects cross-contractor metadata only if metadata is present:
  - `if (metadataContractorId && metadataContractorId !== contractorId) throw ...`
- A session with status `complete`, a customer, and a payment method but no contractor metadata would pass the helper validation.

Impact:
- In normal flow, created sessions include metadata. But requiring metadata would be stronger and would prevent finalizing unrelated Stripe Checkout sessions for the same logged-in user/customer shape.

Recommendation:
- Require `metadata.contractor_id` or setup-intent metadata to equal the authenticated contractor ID. Missing metadata should fail.
- Add tests for missing metadata and conflicting customer/payment method shapes.

### Medium — unnecessary exposure of Stripe object IDs in UI/API responses

Files:
- `supabase/functions/contractor-billing-setup/index.ts:193-198`
- `app/contractor-portal.html:601-607`

Issue:
- Finalize response returns `stripeCustomerId` and `stripePaymentMethodId`.
- Contractor portal displays full Stripe customer and payment method IDs.

Impact:
- These IDs are not secrets and cannot charge by themselves, but exposing them is unnecessary. It increases data leakage surface and creates support/privacy noise.

Recommendation:
- Return/display only `paymentAuthorized=true`, maybe card brand/last4 if intentionally fetched from Stripe and safe.
- Keep raw Stripe IDs in DB/operator logs only.

### Medium — HTML injection risk patterns in portal/notification rendering

Files:
- `app/contractor-portal.html` has extensive `innerHTML` with DB-backed fields, including billing freeze reason.
- `app/notification-delivery.mjs:50-68` injects user name and notification body into email HTML.

Issue:
- Many UI sections construct HTML with unsanitized dynamic values. Some data is system-generated, but contractor/business/user/homeowner fields can ultimately be user-controlled.

Impact:
- Potential stored XSS in static app pages if attacker-controlled text reaches fields inserted via `innerHTML`.
- Potential HTML injection in notification emails.

Recommendation:
- Refactor rendering to `textContent`/DOM nodes or add a small `escapeHtml()` helper for interpolated values.
- Add tests for escaping in notification email body and browser-rendered view models.

### Low/Medium — test-mode vs live-mode guard is mostly procedural, not enforced in charge runner

Files:
- `scripts/run-billing-cycle-charges.mjs:13-16`
- `DEPLOYMENT.md:90-98, 163-167, 181-182`

Issue:
- The runner chooses `STRIPE_TEST_SECRET_KEY || STRIPE_SECRET_KEY`.
- Docs say live-mode must not run without explicit approval, but the script itself does not require an explicit `--live` flag or reject `sk_live_` by default.

Impact:
- Accidental live charge risk if environment contains a live key and operator runs without realizing it.

Recommendation:
- Default to test-only. If a live key is detected, require an explicit `--live --confirm-live-billing` style gate and print a non-secret warning.
- Add a test around key-mode selection if factored into a helper.

## Test coverage gaps

Priority coverage gaps to close before production:

1. **Origin allowlist tests** for billing setup URL generation and Edge Function input handling.
2. **Missing-metadata setup session test**: finalization should fail when contractor metadata is absent.
3. **Edge Function handler tests** with mocked Stripe/Supabase fetch:
   - no auth header,
   - non-contractor user,
   - create session success,
   - finalize success,
   - bad session ID,
   - Stripe error,
   - Supabase patch error.
4. **Charge runner integration tests** with mocked fetch:
   - candidate selection,
   - Stripe success then DB cycle patch failure,
   - lead patch failure after cycle paid,
   - notification insert failure,
   - Stripe failure plan write failure.
5. **Concurrency/idempotency tests** or DB-level proof for two runners selecting the same cycle.
6. **Live/test key mode guard tests** once the runner enforces explicit live mode.
7. **Browser E2E tests** for contractor portal billing button -> Checkout URL creation -> completion page finalize path. Current browser automation verified locally once, but there is no repeatable automated E2E test.
8. **XSS/HTML escaping tests** for contractor portal dynamic fields and notification email HTML.
9. **Negative billing amount/rounding tests** for decimal and invalid `total_amount_due` values beyond the current happy path.
10. **RLS / role boundary tests** showing contractors cannot update billing profile directly through browser Supabase client and must go through the Edge Function.

## Code quality / refactor opportunities only

No refactors were made. Suggested refactors:

1. **Deduplicate billing setup logic.**
   - `app/contractor-billing-setup.mjs`, `supabase/functions/contractor-billing-setup/index.ts`, and `scripts/contractor-billing-setup-bridge.mjs` duplicate origin normalization, Checkout form construction, Stripe request helpers, contractor patch logic, and finalization logic.
   - Extract shared pure logic where possible, or generate Edge/local versions from one tested module.

2. **Centralize Supabase REST helpers.**
   - `run-billing-cycle-charges.mjs`, `run-notification-delivery.mjs`, fixture scripts, and bridge all define their own REST GET/PATCH/INSERT/header helpers.
   - A small `scripts/lib/supabase-rest.mjs` would reduce drift.

3. **Centralize provider HTTP helpers.**
   - Stripe form encoding/error parsing repeats across billing setup, test profile helper, bridge, and runner.
   - Consolidate Stripe request creation and non-secret error normalization.

4. **Separate pure plan builders from operator side effects.**
   - `app/billing-charge-execution.mjs` is a clean pure helper, but `scripts/run-billing-cycle-charges.mjs` mixes fetching, charging, state mutation, result reporting, and retry handling.
   - Split into claim/fetch/charge/apply/reconcile units for testability.

5. **Replace string-built HTML for sensitive/dynamic text.**
   - `contractor-portal.html` uses large inline script and many `innerHTML` assignments.
   - A tiny render helper that escapes text would reduce XSS risk without a framework.

6. **Avoid showing raw Stripe IDs in UI.**
   - Replace with authorized/not authorized state and optional card display metadata.

7. **Make environment/key mode explicit.**
   - Instead of `STRIPE_TEST_SECRET_KEY || STRIPE_SECRET_KEY`, require `--mode=test` by default and block live unless explicit approval flags are present.

8. **Use a billing attempt/audit table.**
   - This is partly design, partly refactor. It would make Stripe/DB reconciliation much easier.

9. **Move fee amount into one config constant.**
   - Portal copy says `$800 per closed install job`; memory/original business model mentions about `$500`; billing-cycle prep likely uses a configured rate elsewhere. Confirm and centralize pricing terms before production.

10. **Consistent naming for Stripe charge ID.**
   - Code stores PaymentIntent IDs in `stripe_charge_id`. PaymentIntent is not the same object as a Charge in newer Stripe APIs. Rename later or document that the field stores PaymentIntent ID.

## Anything that looks fake/hollow?

No. The billing path is not fake:

- Tests are real and pass.
- Stripe Checkout setup request construction is real.
- Stripe PaymentIntent request construction is real.
- A Stripe TEST-mode charge was previously executed and DB side effects were verified.
- Fixture/profile scripts use documented Stripe test payment method token path, not raw card data.

What is unproven:

- Production Edge Function deployment/runtime.
- Production browser flow on `neighborlywork.com`, still blocked by Netlify usage limit.
- Twilio/Resend live notification delivery, still blocked by missing config.
- Live-mode Stripe charge, intentionally not authorized.
- Concurrency and partial-failure reconciliation.

## Recommended next sequence when blockers clear

1. Patch high-risk billing setup origin allowlist + require setup metadata.
2. Add targeted tests for those two security gates.
3. Add explicit test/live mode guard to charge runner.
4. Add DB claim/reconciliation design before any recurring/operator charge runs.
5. Once Netlify is unblocked, run full Section D/E browser validation against the deployed commit.
6. Only after explicit approval/config, validate Twilio/Resend.

## Review closeout

This report is documentation-only. No production code was changed in this review pass.
