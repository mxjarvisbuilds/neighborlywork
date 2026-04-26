# NeighborlyWork Email Deliverability DNS Checklist

Current sender target: `notifications@neighborlywork.com` via Resend.

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
- `notifications@neighborlywork.com` should pass SPF alignment, DKIM signing, and DMARC policy evaluation.
- Send one test notification to an owned inbox and inspect headers before customer-facing launch.
