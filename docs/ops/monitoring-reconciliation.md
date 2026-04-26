# Monitoring and Reconciliation

## No-spend monitoring path for Monday
- Netlify dashboard / HTTP checks for availability and deploy status.
- Supabase dashboard for function logs, table activity, RLS errors, and auth failures.
- Stripe test dashboard for setup sessions, payment methods, and test PaymentIntents.
- Resend dashboard for domain status and email event logs after DNS verification.
- Twilio dashboard for sender status and SMS logs if SMS is enabled.
- Manual Jarvis/founder checks using `node scripts/run-launch-reconciliation.mjs`.

## Reconciliation checks
Run before public traffic and at least twice daily during launch week:

```bash
node scripts/run-launch-reconciliation.mjs
node scripts/run-timeout-automation.mjs --dry-run
node --test tests/*.test.mjs
```

## What to reconcile
- Leads stuck in `new` with matching contractors available.
- Leads in `matched_to_contractors` older than 48h with submitted quotes.
- Leads in `pending_verification` past 72h.
- Leads in `install_complete` past dispute window.
- Change orders with expired response windows and no resolution.
- Notifications stuck in `pending` or repeated `failed`.
- Billing cycles stuck in `processing` past lock expiry.
- Contractors approved without service ZIPs, services, legal consent trail, or payment authorization.

## Alert-worthy conditions
- Production HTTP 5xx or Netlify paused/usage exceeded.
- Supabase Edge Function `contractor-billing-setup` missing or returning non-2xx in test validation.
- Resend DNS unverified or SPF/DKIM/DMARC fail after DNS is supposedly added.
- Twilio sender not configured when SMS is required.
- Any live Stripe-mode charge path appearing before explicit approval.
- More than 3 lead submissions or contractor signups from same local identity within one hour.

## Paid/vendor monitoring decision
No analytics or paid monitoring vendor is installed. If Zayith wants more than manual/platform checks, choose a provider/privacy posture first.
