# NeighborlyWork Email Deliverability DNS Checklist

Current sender target: `NeighborlyWork <notifications@neighborlywork.com>` via Resend.

Code launch guardrail: `RESEND_FROM_EMAIL` must resolve to an `@neighborlywork.com` address. Use the canonical sender above unless there is a deliberate owned-domain reason to use another local part.

## Required Resend records captured from API

| Type | Name | Value | Priority | TTL |
|---|---|---|---|---|
| TXT | `resend._domainkey` | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDGNH+7IEZvWWctfXOvJy2SbPmElW9dTtcEum7GKgyq7ZqpJwDDbiPb1fVSUCJD3ITeqXLNQT2e5lySaDX5rCg5SYBH5tEXorqdAjeAACLBKvLYRiJabRyu28ga0NBvtj8IRTOP9CB3SaYum1dsfzB2TtxFcMHAWITezF4Xh8jWqwIDAQAB` | — | Auto |
| MX | `send` | `feedback-smtp.us-east-1.amazonses.com` | 10 | Auto |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` | — | Auto |

## DMARC gap

No DMARC record has been verified yet for `neighborlywork.com` in this repo/run. Add a conservative monitoring record before production email validation:

```text
TYPE: TXT
NAME: _dmarc
VALUE: v=DMARC1; p=none; rua=mailto:postmaster@neighborlywork.com; adkim=s; aspf=s
TTL: Auto or 1 hour
```

Move from `p=none` to stricter policy only after several days of clean mail flow.

## Verification after DNS

- Resend domain status should become verified.
- Confirm there is only one SPF TXT record at each hostname. If other mail providers are added later, merge SPF mechanisms into one record instead of creating duplicate SPF records.
- `NeighborlyWork <notifications@neighborlywork.com>` should pass SPF alignment, DKIM signing, and DMARC policy evaluation.
- Send one test notification to an owned inbox and inspect headers before customer-facing launch:
  - SPF: pass/aligned for the Resend sending path.
  - DKIM: pass for `neighborlywork.com` or the Resend-authenticated selector.
  - DMARC: pass with aligned SPF or DKIM.
  - From: `NeighborlyWork <notifications@neighborlywork.com>`.
  - Reply-To present and monitored.
  - List-Unsubscribe present.
- Do not treat API credentials alone as launch readiness; DNS/authentication and received-header checks must pass.

See also: `docs/launch/notification-readiness.md`.
