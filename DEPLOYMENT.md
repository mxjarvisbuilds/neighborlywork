# NeighborlyWork Deployment Guide

Last updated: 2026-04-25

## 1. Production surface

NeighborlyWork is a static Netlify deployment that publishes the repository root. There is no build command and no package install step for the production site.

### Root production files

- `index.html` — active marketing homepage and entry point.
- `privacy.html` — Privacy Policy.
- `terms.html` — Terms of Service, including contractor billing terms.
- `supabase-config.js` — root Supabase browser config for legacy-compatible root pages.
- `_redirects` — Netlify redirects for removed legacy URLs.
- `DEPLOYMENT.md` — deployment and validation guide.

### Active `/app` pages

- `app/homeowner-auth.html` — homeowner signup/login and role-aware redirect handling.
- `app/homeowner-intake.html` — homeowner lead intake wired to Supabase lead insert and matching.
- `app/homeowner-dashboard.html` — homeowner request dashboard, quote/change-order entry points, and verification-window visibility.
- `app/quotes.html` — homeowner quote comparison, canonical price/brand/system fields, and selected-quote handoff into pending verification.
- `app/messages.html` — realtime messaging after a selected contractor exists.
- `app/contractor-auth.html` — contractor signup/login, contractor row setup, and role-aware redirects.
- `app/contractor-portal.html` — contractor portal with pricing profile, quote submission, change orders, Fee Terms, and billing authorization entry point.
- `app/contractor-billing-setup-complete.html` — Stripe setup completion page.
- `app/founder-dashboard.html` — founder/admin dashboard and billing-cycle prep summary.
- `app/lead-inbox.html` — founder/admin lead lifecycle controls and change-order visibility.
- `app/change-order-review.html` — homeowner change-order review, accept/reject-switch/request-more-info flow.
- `app/supabase-config.js` — app Supabase browser config.

### Supporting browser modules

- `app/draft-quote-generator.mjs`
- `app/quote-comparison.mjs`
- `app/lead-verification.mjs`
- `app/lead-lifecycle-actions.mjs`
- `app/notifications-queue.mjs`
- `app/billing-cycle-prep.mjs`
- `app/change-order-workflow.mjs`
- `app/billing-charge-execution.mjs`
- `app/notification-delivery.mjs`
- `app/contractor-billing-setup.mjs`

### Local/operator scripts

These scripts are for controlled local/operator runs, not normal browser production execution:

- `scripts/create-contractor-auth-fixture.mjs`
- `scripts/create-minimum-billing-fixture.mjs`
- `scripts/create-stripe-test-billing-profile.mjs`
- `scripts/run-billing-cycle-charges.mjs`
- `scripts/run-notification-delivery.mjs`
- `scripts/contractor-billing-setup-bridge.mjs` — localhost-only bridge for billing setup testing.
- `scripts/load-local-secrets.mjs`

### Supabase artifacts

- `supabase/001_backend_v1_schema.sql`
- `supabase/002_backend_v1_rls.sql`
- `supabase/003_brand_ratings_seed_v1.sql`
- `supabase/004_lead_transitions_v1.sql`
- `supabase/005_verify_lead_transition_history_rollback.sql`
- `supabase/006_upsert_contractor_pricing_profile.sql`
- `supabase/functions/contractor-billing-setup/index.ts`

## 2. Deprecated files removed

The following stale or deprecated files were removed from production deploy scope on 2026-04-25:

- Root legacy pages: `start.html`, `homepage-draft.html`, `homeowner-intake.html`, `contractor-portal.html`, `lead-inbox.html`, `founder-dashboard.html`.
- Deprecated backend/sample assets: `apps-script.gs`, `founder-dashboard-data.json`.
- Non-production preview/test pages: `logo-preview.html`, `app/test-community.html`, `app/test-pro.html`.
- Incomplete old static app marketing pages: `app/pricing.html`, `app/contractors.html`, `app/get-quotes.html`.

Legacy public routes are handled in `_redirects` so users do not land on stale pages.

## 3. Environment and credential requirements

### Browser production

The current browser app reads Supabase browser config from:

- `supabase-config.js`
- `app/supabase-config.js`

No Netlify build environment variables are required for the current static deployment.

### Local/operator billing

Required for local billing runner / fixture operations:

- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_TEST_SECRET_KEY` for test-mode charges
- `STRIPE_SECRET_KEY` only if an explicitly approved live-mode billing run is ever performed

Current verified status: Stripe **test-mode** contractor billing authorization plus one test charge have been verified locally against live Supabase data.

### Notification delivery

Live SMS/email delivery is intentionally skipped until provider configuration and deliverability gates are available:

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM_NUMBER`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL` — must resolve to an `@neighborlywork.com` sender; launch default is `NeighborlyWork <notifications@neighborlywork.com>`
- `RESEND_REPLY_TO_EMAIL` — monitored reply/unsubscribe inbox
- `EMAIL_FOOTER_ADDRESS` — required before marketing/cold-outreach sends

Do not attempt customer-facing Twilio/Resend validation without the required provider configuration. Do not treat Resend credentials alone as email launch readiness: Resend DNS verification, SPF/DKIM/DMARC alignment, reply-to handling, unsubscribe handling, and an owned-inbox header inspection must pass first. See `docs/launch/email-deliverability-dns.md` and `docs/launch/notification-readiness.md`.

## 4. Netlify deployment settings

1. Connect the GitHub repo to Netlify.
2. Publish directory: repository root.
3. Build command: none.
4. Ensure `_redirects` is deployed from the repository root.
5. Custom domain: `neighborlywork.com`.
6. Optional `www` domain should redirect to the primary domain.
7. Wait for SSL provisioning after DNS/domain changes.

## 5. Production validation checklist

Run this only after Netlify is serving the app, not the usage-limit page.

### Section D — Netlify / production site

- Confirm `https://neighborlywork.com/` returns the app homepage, not Netlify `Site not available`.
- Confirm `https://www.neighborlywork.com/` redirects or serves consistently.
- Confirm removed legacy routes redirect correctly:
  - `/start.html` -> `/index.html`
  - `/homeowner-intake.html` -> `/app/homeowner-intake.html`
  - `/contractor-portal.html` -> `/app/contractor-portal.html`
  - `/lead-inbox.html` -> `/app/lead-inbox.html`
  - `/founder-dashboard.html` -> `/app/founder-dashboard.html`
- Confirm current deployed assets include the post-billing commit lineage, including `5d4fdf0` and later cleanup commits.

### Section E — full production browser walkthrough

Homeowner flow:
- Homepage loads without console errors.
- Homeowner signup/login page loads.
- Intake form can be opened.
- Dashboard loads for a homeowner test session.
- Quote comparison page renders canonical fields when quotes exist.
- Change-order review page opens for an eligible lead.

Contractor flow:
- Contractor signup/login page loads.
- Contractor portal loads for a contractor test session.
- Pricing Profile screen loads/saves.
- Quote draft generation path renders and remains editable.
- Fee Terms / billing authorization entry point is visible.
- Change Orders screen renders.

Founder/admin flow:
- Founder dashboard loads for an admin test session.
- Lead inbox loads lifecycle controls.
- Billing Ops counts render.
- Prepare-cycle controls remain visible.
- Notification rows are queued by lifecycle actions where expected.

Skipped until credentials/config and deliverability gates are present:
- Twilio live SMS delivery.
- Resend live email delivery, including verified Resend DNS, SPF/DKIM/DMARC alignment, canonical `NeighborlyWork <notifications@neighborlywork.com>` sender, monitored reply-to/unsubscribe handling, and owned-inbox header inspection.
- Any live-mode Stripe charge.

## 6. Latest verified offline state

- Commit `5d4fdf0` verified contractor billing authorization and one Stripe test-mode charge.
- Commit `75f35b5` recorded that production validation stayed blocked by Netlify `503 usage_exceeded`.
- This cleanup pass removes deprecated deploy files and updates this guide.
- Offline tests: `node --test tests/*.test.mjs` should pass before deploy.

## 7. Known limitations

- Production browser validation is blocked while Netlify returns `503 usage_exceeded` / `Site not available`.
- Google auth is not enabled yet.
- `additionalServices` from intake is still stored inside `additional_notes`, not a dedicated structured column.
- `app/messages.html` requires a selected contractor before messaging is allowed.
- Twilio/Resend delivery remains unverified without provider configuration and email deliverability gates: verified Resend DNS, SPF/DKIM/DMARC alignment, owned-domain sender, monitored reply-to/unsubscribe handling, and owned-inbox header inspection.
- Live-mode billing must not run without explicit approval.

## 8. Next production steps

1. Clear Netlify usage/billing limit so `neighborlywork.com` serves the app.
2. Verify `_redirects` deploys and stale legacy URLs redirect.
3. Run Section D and Section E production browser validation.
4. Only after provider credentials/config and email deliverability gates are intentionally supplied, validate Twilio/Resend notification delivery using `docs/launch/notification-readiness.md`.
