# NeighborlyWork Production Marketplace Audit

Date: 2026-04-26
Scope: Sacramento-area HVAC blind-bid marketplace launch readiness across product, business operations, support, growth, trust/safety, monitoring, data integrity, and provider dependencies.

## Checklist

### Business operations
- [x] Contractor commercial model documented: $800 referral fee only after selected contractor completes qualifying install.
- [x] Test-mode billing authorization path documented and code-covered.
- [x] Contractor agreement, terms, privacy, and payment terms exist.
- [x] Manual launch operations can run from founder dashboard / lead inbox while production volume is low.
- [x] Provider dependency runbooks exist for Netlify, Supabase, Stripe test-mode, Resend, and Twilio.
- [ ] Production service restoration depends on Netlify billing/usage decision by Zayith.
- [ ] Production email domain verification depends on DNS action by Zayith.
- [ ] Live Stripe remains intentionally blocked until explicit approval.

### Homeowner flow
- [x] Public homepage explains Sacramento HVAC quote request flow.
- [x] Homeowner auth, dashboard, request intake, quote comparison, messaging, and change-order review pages exist.
- [x] Intake captures address, home details, equipment context, urgency, timeline, budget/financing, contact info, and supporting notes.
- [x] Homeowner quote selection starts a verification window and notification path.
- [x] Change-order review supports accept, request-more-info, or switch to an eligible original bidder.
- [x] Homeowner-facing dynamic renders audited for obvious XSS exposures and escaped where fixable in this pass.
- [ ] Live production E2E validation waits on Netlify restore and provider readiness.

### Contractor flow
- [x] Contractor signup discloses fee terms and links terms/privacy/contractor agreement.
- [x] Contractor portal supports matched lead review, quote submission, profile/pricing profile, billing authorization, and change-order submission/response.
- [x] Billing setup guards are hardened: strict origin allowlist, contractor metadata required, no raw Stripe IDs surfaced.
- [x] Contractor-facing dynamic renders audited for obvious XSS exposures and escaped where fixable in this pass.
- [ ] Live SMS validation requires Twilio login/sender setup if SMS is required for launch.

### Admin tooling
- [x] Lead inbox supports filtering, lead detail review, lifecycle actions, matching/quote visibility, change-order visibility, and billing status context.
- [x] Founder dashboard supports summary metrics, contractor approval/rejection, billing-cycle preparation, and notification counts.
- [x] Admin-only pages check authenticated role before loading data.
- [x] Admin-facing dynamic renders audited for obvious XSS exposures and escaped where fixable in this pass.
- [ ] Live admin production validation waits on Netlify restore.

### Data integrity and lifecycle
- [x] SQL schema defines lead lifecycle, quote statuses, billing statuses, notification statuses, change orders, pricing profiles, brand ratings, and status history.
- [x] Billing-cycle claim RPC uses DB-side locking with `FOR UPDATE SKIP LOCKED` to avoid double charging.
- [x] Lead status transitions and notification builders have node test coverage.
- [x] Billing charge execution has failure/freeze/retry coverage.
- [ ] Live Supabase SQL/RPC and Edge Function deployment still need authenticated deploy path.

### Notifications and customer support
- [x] Portal notification queue builders exist for lifecycle, change order, and billing events.
- [x] Resend deliverability hardening requires owned `neighborlywork.com` sender, reply-to alignment, plain text body, footer, and List-Unsubscribe header.
- [x] Notification readiness doc names email/SMS/provider validation gates.
- [x] Support operating model for launch is manual founder-led triage via lead inbox, dashboard, messages, and notifications.
- [ ] Business mailing address is still required before marketing/cold outreach email sends.
- [ ] Production email validation waits on Resend DNS verification.

### Growth and retention
- [x] Homeowner and contractor landing page copy exists.
- [x] Contractor onboarding email sequence exists.
- [x] Local SEO copy exists for Sacramento-area priority ZIPs.
- [x] Robots and sitemap launch crawl surfaces exist.
- [x] Analytics intentionally not installed to preserve privacy posture until provider choice is made.
- [ ] Analytics vendor/privacy posture remains a Zayith product decision if desired.

### Monitoring and launch operations
- [x] Deployment checklist covers headers, redirects, robots, sitemap, production routes, and provider validation.
- [x] Netlify `_headers` includes baseline security headers.
- [x] Root 404/500 pages exist.
- [x] Production HTTP checks are defined but blocked by Netlify `503 usage_exceeded`.
- [ ] Production monitoring/alerts beyond platform dashboards are not installed; for Monday launch, manual founder/Jarvis checks are the accepted no-spend path unless Zayith chooses an analytics/monitoring vendor.

### Abuse prevention and trust/safety
- [x] Contractors require approval before full operational trust.
- [x] Contractor signup captures license/service area and legal consent.
- [x] Lead routing is capped to up to 3 contractors.
- [x] Blind bidding protects contractor pricing from other contractors.
- [x] Change-order flow includes competing response and homeowner choice path.
- [x] Dynamic admin/homeowner/contractor render surfaces were hardened against obvious stored-XSS paths in this pass.
- [ ] External contractor license/background verification remains a manual operations step until automated verification is added.

### Edge cases and fallback posture
- [x] Netlify down: logged as Zayith To-Do because service is paused by billing/credits.
- [x] Supabase function missing: documented with deployment runbook and kept as provider readiness blocker.
- [x] Email DNS not verified: logged as Zayith DNS action.
- [x] SMS unavailable: launch can continue with portal/email/manual fallback if Zayith does not require SMS validation.
- [x] Live charging: intentionally blocked until explicit approval.
- [x] Analytics absent: privacy posture documented; no hidden tracking scripts found in prior audit.

## Agent-fixed gaps from this pass
- Added this production marketplace audit checklist so Monday readiness has one complete cross-layer source.
- Hardened additional dynamic HTML rendering in founder dashboard, lead inbox, homeowner dashboard, contractor portal, messages, and change-order review pages to escape user/provider-controlled values before injecting them into templates.
- Added static regression coverage for the audit doc and key XSS escape guards.

## Zayith-only gaps
The only remaining launch blockers that require Zayith are the same categories already in the living tracker: Netlify billing/usage restoration, Resend DNS, Twilio login/sender setup if SMS is required, explicit live Stripe approval, business mailing address for marketing/cold outreach, analytics/monitoring vendor choice if desired, and any manual contractor verification policy that changes product scope.
