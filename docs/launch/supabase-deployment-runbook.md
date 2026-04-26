# NeighborlyWork Supabase Deployment Runbook

Purpose: make the Supabase SQL/RPC and Edge Function deployment path explicit without requiring Zayith unless dashboard/CLI auth blocks execution.

## Current verified state

- Supabase project id: `uuaofdponevqwbfzwxtp`.
- Local secrets present without printing values:
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `STRIPE_TEST_SECRET_KEY`
  - `RESEND_API_KEY`
  - `RESEND_FROM_EMAIL`
- Supabase Edge Function URL checked earlier:
  - `https://uuaofdponevqwbfzwxtp.supabase.co/functions/v1/contractor-billing-setup`
  - Response was `404 NOT_FOUND`, meaning function is not deployed/available yet.
- Supabase CLI is not installed on this machine at the time of this run.
- No `SUPABASE_ACCESS_TOKEN` or DB connection URL is saved in `~/.jarvis/secrets.env`.

## SQL/RPC that must be applied

File: `supabase/001_backend_v1_schema.sql`

Required billing-cycle claim pieces now present in repo:

- `processing_started_at` column on `public.billing_cycles`
- `processing_expires_at` column on `public.billing_cycles`
- `processing` status support for billing cycles
- `public.claim_billing_cycle_for_charge(...)` RPC
- `for update skip locked` in the RPC
- claimable index: `idx_billing_cycles_charge_claimable`

The extracted patch prepared during the audit was `/tmp/nw_patch.sql`; if that temp file is missing, re-extract the billing-cycle claim block from `supabase/001_backend_v1_schema.sql` rather than hand-typing SQL.

## Preferred deployment path when auth is available

1. Confirm current repo HEAD and clean status.
2. Back up/read current production schema state if using SQL editor.
3. Apply only the billing-cycle claim/RPC patch, not unrelated schema rewrites.
4. Verify in Supabase SQL editor:
   - `select proname from pg_proc where proname = 'claim_billing_cycle_for_charge';`
   - `select column_name from information_schema.columns where table_schema='public' and table_name='billing_cycles' and column_name in ('processing_started_at','processing_expires_at');`
5. Deploy Edge Function `supabase/functions/contractor-billing-setup` with required env vars.
6. Recheck function endpoint returns non-404 for an expected request path/method.
7. Run test-mode billing setup and charge validation only with Stripe test keys.

## CLI path if Supabase CLI gets installed/authenticated

```bash
supabase link --project-ref uuaofdponevqwbfzwxtp
supabase functions deploy contractor-billing-setup --project-ref uuaofdponevqwbfzwxtp
```

Do not install the CLI or request paid services without explicit approval if the install path prompts for package changes/spend.

## Dashboard path if browser works

- Supabase dashboard → project `uuaofdponevqwbfzwxtp` → SQL Editor.
- Paste/apply the minimal billing-cycle claim/RPC patch.
- Supabase dashboard → Edge Functions → deploy/import `contractor-billing-setup` or use CLI if available.

## Blockers that require Zayith or explicit approval

- Supabase login/auth/2FA if the session expires.
- Installing Supabase CLI if it requires package install approval.
- Any production DB operation beyond the minimal reviewed patch.
- Any live Stripe mode or real charge.
