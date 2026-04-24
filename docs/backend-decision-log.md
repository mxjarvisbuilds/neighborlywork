# NeighborlyWork Backend Decision Log

## 2026-04-22 — Backend v1 ownership split
- Jarvis owns backend foundation for NeighborlyWork v1: schema, RLS, backend logic, notifications infrastructure, billing infrastructure, and data-layer review of Rocky UI work.
- Rocky owns frontend/UX implementation. Jarvis should not independently edit frontend HTML/CSS/JS in this phase unless Rocky explicitly hands off a frontend-specific task.
- Cross-check rule: schema changes should be posted for Rocky review before shipping; major Rocky UI flows should be reviewed by Jarvis against the data model before Rocky ships.

## 2026-04-22 — Delivery order locked
1. Schema updates + RLS
2. Brand ratings seed data
3. State machine + change order workflow logic
4. Contractor pricing profiles + draft quote generation
5. Notifications infrastructure
6. Stripe integration + auto-billing
7. Fee copy audit

## 2026-04-22 — Validation rule
- Do not resume general NeighborlyWork validation while backend/frontend rebuild is in progress. Final validation happens after both backend and Rocky-owned frontend changes are shipped.

## 2026-04-22 — Approved backend schema direction before SQL
- Source-of-truth backend files will live at:
  - `neighborlywork/supabase/001_backend_v1_schema.sql`
  - `neighborlywork/supabase/002_backend_v1_rls.sql`
  - `neighborlywork/docs/backend-state-machine.md`
- Admin/founder RLS model should use `users.role = 'admin'`.
- `leads.selected_contractor_id` should reference `public.contractors(id)`.
- `quotes` should gain a `status` enum with: `draft`, `submitted`, `superseded`, `selected`, `rejected`.
- Lifecycle state separation is approved:
  - `leads.status` = lead lifecycle
  - `quotes.status` = quote lifecycle
  - `change_orders` fields = change-order lifecycle
- `leads` should gain explicit billing linkage fields: `billing_cycle_id`, `billed_at`, `billing_status`.
- Additional approved tables beyond the original list:
  - `lead_status_history`
  - `notifications`
- Cross-check rule was superseded by direct user instruction for full autonomous build. Jarvis should self-review schema against the locked product vision and ship when confident.

## 2026-04-23 — Inheritance audit and backend foundation repair
- Rocky inherited NeighborlyWork as sole build owner and re-audited checkpoints 1.1–1.3 before touching Supabase.
- The inherited backend package was not trustworthy as claimed: `docs/backend-schema-proposal-v1.md` was stale versus the shipped SQL, `001_backend_v1_schema.sql` was missing real inherited-schema hardening around `leads.status` / `quotes.status`, and `002_backend_v1_rls.sql` was too permissive around change-order and notification updates.
- Repaired docs to make `lead_status_v1` the explicit lifecycle enum used during migration.
- Hardened `001_backend_v1_schema.sql` to add missing inherited `leads.status`, reconcile legacy `quotes.status`, add integrity constraints, and validate change-order quote/lead/contractor consistency.
- Hardened `002_backend_v1_rls.sql` to narrow active change-order access/response paths, remove broad lead-history access for non-selected contractors, and constrain notification creation/acknowledgement semantics before checkpoint 1.4 apply.

## 2026-04-23 — Brand ratings methodology locked for launch seed work
- Added `docs/brand-ratings-methodology-v1.md` as the source-of-truth rubric for `public.brand_ratings` seed work.
- Launch methodology uses a 6-dimension weighted model with Consumer Reports, ENERGY STAR, AHRI, warranty docs, support footprint, and trust modifiers.
- Launch brand universe for Sacramento seed work starts with: Carrier, Bryant, Payne, Trane, American Standard, Lennox, Rheem, Ruud, Goodman, Amana, Daikin, York, Coleman, Bosch, and Mitsubishi Electric, with Fujitsu and Gree as the next expansion set.
