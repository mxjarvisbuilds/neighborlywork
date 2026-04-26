# NeighborlyWork Notification Launch Readiness

Last updated: 2026-04-25

## Scope

This checklist covers production readiness for outbound NeighborlyWork notifications. It is intentionally broader than Resend DNS: sender alignment, DNS/authentication, compliance metadata, provider configuration, and post-send verification all have to pass before customer-facing email or SMS validation is considered ready.

Stripe remains test-mode for launch preparation. Do not use this checklist as authorization for live-mode Stripe charges.

## Email sender standard

Canonical production sender:

- From: `NeighborlyWork <notifications@neighborlywork.com>`
- Sender domain: `neighborlywork.com`
- Reply-to: `support@neighborlywork.com` or another owned `@neighborlywork.com`/approved support inbox before launch

Code guardrails now reject Resend delivery when `RESEND_FROM_EMAIL` is not aligned to `neighborlywork.com`. Generic senders such as Gmail must not be used for provider-backed launch notifications.

Required environment values for email delivery:

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL=NeighborlyWork <notifications@neighborlywork.com>`
- `RESEND_REPLY_TO_EMAIL` for replies/unsubscribe handling
- `EMAIL_FOOTER_ADDRESS` before any marketing or cold-outreach send

## DNS/authentication gates

Before live email validation:

1. Resend domain `neighborlywork.com` must be verified.
2. Resend DKIM record must be published and passing.
3. Resend return-path/bounce MX record must be published.
4. SPF record for the Resend send subdomain must be published.
5. DMARC record for `_dmarc.neighborlywork.com` must exist at least in monitoring mode (`p=none`) with strict SPF/DKIM alignment tags unless the DNS provider or Resend guidance requires a safer staged alternative.
6. No second conflicting SPF TXT record should exist at the same host. If other senders are added later, merge includes into one SPF record instead of creating duplicates.

DNS details live in `docs/launch/email-deliverability-dns.md`.

## Payload/compliance gates

Provider-backed email should include:

- HTML body with escaped user-controlled fields.
- Plain-text body.
- Reply-to address.
- List-Unsubscribe mailto header.
- Footer explaining why the recipient is receiving the email and how to opt out of non-transactional emails.
- Physical mailing address before marketing/cold-outreach sends.

Known launch limitation: the real physical business mailing address is not available to agents. `EMAIL_FOOTER_ADDRESS` must be set before marketing/cold-outreach sends. Transactional request updates can be tested with the footer placeholder only in non-customer-facing validation.

## SMS gate

SMS remains separate from email deliverability. Do not mark notification delivery fully ready unless Twilio sender setup is complete and tested:

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM_NUMBER`
- STOP/HELP handling and opt-out expectations understood for the selected Twilio sender type

## Safe validation sequence

Run these only after Netlify is serving the app and DNS/provider configuration is intentionally present:

1. `node --test tests/notification-delivery.test.mjs`
2. `node --check scripts/run-notification-delivery.mjs`
3. Dry-run notification dispatcher with a low limit against owned/test data only.
4. Send one email notification to an owned inbox.
5. Inspect received headers for SPF pass, DKIM pass, DMARC pass/aligned, correct From, Reply-To, List-Unsubscribe, and Resend message ID.
6. Confirm failed provider responses do not leak secrets in logs.
7. Only after owned-inbox validation passes, allow customer-facing notification validation.

## Current status

Agent-fixable code/doc holes fixed in this pass:

- Resend sender must be aligned to `neighborlywork.com`.
- Canonical launch sender documented as `NeighborlyWork <notifications@neighborlywork.com>`.
- Resend payload includes reply-to, text body, compliance footer, and List-Unsubscribe mailto header.
- Launch docs now distinguish provider credentials from deliverability readiness.

Zayith-only or external blockers:

- Publish/verify DNS records in the domain provider/Resend.
- Provide/confirm a physical mailing address or compliant business mailing address before marketing/cold-outreach sends.
- Complete Twilio sender/account setup if SMS launch validation is required.
