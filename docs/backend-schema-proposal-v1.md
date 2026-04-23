# NeighborlyWork Backend Schema Proposal v1

_Status: Proposed for Rocky review. Do not execute SQL until frontend/data-model cross-check is complete._

## Purpose
This document is the source-of-truth schema proposal for NeighborlyWork v1 backend foundation. It covers enums, tables, columns, and foreign-key relationships required for:
- extended lead lifecycle tracking
- structured quotes
- change-order workflow
- brand reference data
- contractor pricing profiles + rule-based draft quote generation
- notifications
- billing cycles
- auditable state transitions

## Role assumptions
- `public.users.role` remains the canonical app role field.
- Supported roles assumed by this backend design:
  - `homeowner`
  - `contractor`
  - `admin`
- Founder/admin-managed tables and review workflows use `users.role = 'admin'` in RLS and service logic.

---

## Enums

### `lead_quote_type`
- `quick_quote`
- `accurate_quote`

### `lead_status`
- `new`
- `matched_to_contractors`
- `quotes_submitted`
- `homeowner_selected`
- `pending_verification`
- `change_order_open`
- `confirmed`
- `install_scheduled`
- `install_complete`
- `disputed`
- `cleared`
- `cancelled`

### `quote_status`
- `draft`
- `submitted`
- `superseded`
- `selected`
- `rejected`

### `quote_system_type`
- `heat_pump`
- `gas_furnace`
- `electric_furnace`
- `split_system`
- `package_unit`
- `mini_split`
- `other`

### `change_order_reason_category`
- `equipment_change`
- `additional_work_required`
- `access_issues`
- `code_compliance`
- `homeowner_request_upgrade`
- `other`

### `change_order_need_type`
- `necessary`
- `recommended`
- `optional_upgrade`

### `change_order_homeowner_response`
- `pending`
- `accepted`
- `rejected_switched_contractor`
- `requested_more_info`

### `change_order_response_type`
- `would_match`
- `would_do_for_less`
- `agree_necessary`
- `flag_as_upsell`

### `billing_cycle_status`
- `pending`
- `processing`
- `paid`
- `failed`

### `lead_billing_status`
- `not_ready`
- `ready_for_cycle`
- `in_cycle`
- `paid`
- `failed`
- `waived`

### `notification_channel`
- `email`
- `sms`
- `portal`

### `notification_event_type`
- `quotes_ready`
- `contractor_selected`
- `verification_window_started`
- `change_order_submitted`
- `change_order_response_window_open`
- `change_order_response_received`
- `install_scheduled`
- `install_complete`
- `dispute_window_closing`
- `lead_cleared`
- `new_lead_assigned`
- `draft_quote_created`
- `billing_cycle_pending`
- `billing_cycle_charged`
- `billing_cycle_failed`
- `manual_review_required`

### `notification_status`
- `pending`
- `sent`
- `failed`
- `read`

---

## Existing tables to extend

### `public.contractors` (extend)
Add columns:
- `stripe_customer_id text`
- `stripe_payment_method_id text`
- `payment_authorized boolean not null default false`
- `pricing_profile_complete boolean not null default false`
- `frozen_at timestamptz null`
- `frozen_reason text null`

Notes:
- freeze fields support failed billing-cycle enforcement without deleting/overloading contractor status.

### `public.leads` (extend)
Add columns:
- `quote_type lead_quote_type not null default 'accurate_quote'`
- `status lead_status not null default 'new'`
- `selected_contractor_id uuid null references public.contractors(id) on delete set null`
- `selection_timestamp timestamptz null`
- `verification_window_expires timestamptz null`
- `install_complete_timestamp timestamptz null`
- `dispute_window_expires timestamptz null`
- `billing_cycle_id uuid null references public.billing_cycles(id) on delete set null`
- `billed_at timestamptz null`
- `billing_status lead_billing_status not null default 'not_ready'`

### `public.quotes` (extend)
Add columns:
- `status quote_status not null default 'submitted'`
- `equipment_brand text null`
- `equipment_model text null`
- `system_type quote_system_type null`
- `system_size_tons numeric(4,2) null`
- `seer_rating numeric(4,2) null`
- `warranty_years integer null`
- `install_timeline_days integer null`
- `price_total numeric(12,2) null`
- `price_breakdown jsonb not null default '{}'::jsonb`
- `what_included text null`
- `what_not_included text null`
- `contractor_notes text null`
- `superseded_by_change_order_id uuid null`
- `draft_generated_at timestamptz null`
- `submitted_at timestamptz null`
- `selected_at timestamptz null`
- `rejected_at timestamptz null`

Notes:
- `status='draft'` supports system-generated quote drafts.
- `superseded_by_change_order_id` links an original quote to its replacement flow.

---

## New tables

### `public.change_orders`
Purpose: track contractor-requested post-selection price changes and homeowner resolution.

Columns:
- `id uuid primary key default gen_random_uuid()`
- `quote_id uuid not null references public.quotes(id) on delete cascade`
- `lead_id uuid not null references public.leads(id) on delete cascade`
- `contractor_id uuid not null references public.contractors(id) on delete cascade`
- `original_price numeric(12,2) not null`
- `revised_price numeric(12,2) not null`
- `price_difference numeric(12,2) not null`
- `reason_category change_order_reason_category not null`
- `reason_description text not null`
- `is_upsell_or_necessary change_order_need_type not null`
- `submitted_at timestamptz not null default now()`
- `response_window_expires timestamptz not null`
- `homeowner_response change_order_homeowner_response not null default 'pending'`
- `homeowner_responded_at timestamptz null`
- `visible_to_other_contractors boolean not null default true`
- `requested_more_info_at timestamptz null`
- `resolved_at timestamptz null`
- `created_by uuid null references public.users(id) on delete set null`

Foreign keys:
- `quote_id -> public.quotes(id)`
- `lead_id -> public.leads(id)`
- `contractor_id -> public.contractors(id)`
- `created_by -> public.users(id)`

### `public.change_order_responses`
Purpose: let non-selected original bidders respond during the 48-hour rebuttal window.

Columns:
- `id uuid primary key default gen_random_uuid()`
- `change_order_id uuid not null references public.change_orders(id) on delete cascade`
- `responding_contractor_id uuid not null references public.contractors(id) on delete cascade`
- `response_type change_order_response_type not null`
- `alternative_price numeric(12,2) null`
- `response_notes text null`
- `submitted_at timestamptz not null default now()`

Constraints:
- unique `(change_order_id, responding_contractor_id)`

### `public.brand_ratings`
Purpose: founder/admin-managed HVAC brand reference data for quote-comparison views.

Columns:
- `id uuid primary key default gen_random_uuid()`
- `brand_name text not null`
- `system_type quote_system_type not null`
- `rating_score numeric(4,2) not null`
- `rating_sources jsonb not null default '[]'::jsonb`
- `methodology_notes text not null`
- `last_updated timestamptz not null default now()`
- `updated_by uuid null references public.users(id) on delete set null`

Constraints:
- check `rating_score >= 1 and rating_score <= 10`
- unique `(brand_name, system_type)`

### `public.contractor_pricing_profiles`
Purpose: rule-based quote draft generation inputs.

Columns:
- `id uuid primary key default gen_random_uuid()`
- `contractor_id uuid not null unique references public.contractors(id) on delete cascade`
- `base_labor_rate numeric(12,2) not null default 0`
- `brand_markups jsonb not null default '{}'::jsonb`
- `service_area_fees jsonb not null default '{}'::jsonb`
- `default_warranty_offered integer null`
- `default_install_timeline_days integer null`
- `markup_preferences jsonb not null default '{}'::jsonb`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### `public.billing_cycles`
Purpose: 14-day contractor billing aggregation and charge tracking.

Columns:
- `id uuid primary key default gen_random_uuid()`
- `contractor_id uuid not null references public.contractors(id) on delete cascade`
- `cycle_start_date date not null`
- `cycle_end_date date not null`
- `total_cleared_jobs integer not null default 0`
- `total_amount_due numeric(12,2) not null default 0`
- `status billing_cycle_status not null default 'pending'`
- `stripe_charge_id text null`
- `charged_at timestamptz null`
- `retry_count integer not null default 0`
- `next_retry_at timestamptz null`
- `failure_reason text null`
- `receipt_sent_at timestamptz null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### `public.lead_status_history`
Purpose: auditable state-transition log for lifecycle enforcement, analytics, and disputes.

Columns:
- `id uuid primary key default gen_random_uuid()`
- `lead_id uuid not null references public.leads(id) on delete cascade`
- `previous_status lead_status null`
- `new_status lead_status not null`
- `triggered_by uuid null references public.users(id) on delete set null`
- `triggered_by_system boolean not null default false`
- `reason text null`
- `metadata jsonb not null default '{}'::jsonb`
- `created_at timestamptz not null default now()`

### `public.notifications`
Purpose: unified event + delivery record for portal/realtime/email/SMS messaging.

Columns:
- `id uuid primary key default gen_random_uuid()`
- `user_id uuid null references public.users(id) on delete cascade`
- `lead_id uuid null references public.leads(id) on delete cascade`
- `quote_id uuid null references public.quotes(id) on delete cascade`
- `change_order_id uuid null references public.change_orders(id) on delete cascade`
- `billing_cycle_id uuid null references public.billing_cycles(id) on delete cascade`
- `channel notification_channel not null`
- `event_type notification_event_type not null`
- `status notification_status not null default 'pending'`
- `subject text null`
- `body text not null`
- `payload jsonb not null default '{}'::jsonb`
- `scheduled_for timestamptz null`
- `sent_at timestamptz null`
- `read_at timestamptz null`
- `failed_at timestamptz null`
- `failure_reason text null`
- `created_at timestamptz not null default now()`

---

## Relationship map

### Existing relationships preserved
- `users.id -> contractors.id` (implicit shared auth/user identity pattern)
- `users.id -> leads.homeowner_id`
- `contractors.id -> quotes.contractor_id`
- `leads.id -> quotes.lead_id`
- `leads.id -> messages.lead_id`

### New key relationships
- `leads.selected_contractor_id -> contractors.id`
- `leads.billing_cycle_id -> billing_cycles.id`
- `quotes.superseded_by_change_order_id -> change_orders.id` (nullable link added after table creation in SQL phase)
- `change_orders.quote_id -> quotes.id`
- `change_orders.lead_id -> leads.id`
- `change_orders.contractor_id -> contractors.id`
- `change_order_responses.change_order_id -> change_orders.id`
- `change_order_responses.responding_contractor_id -> contractors.id`
- `contractor_pricing_profiles.contractor_id -> contractors.id`
- `billing_cycles.contractor_id -> contractors.id`
- `lead_status_history.lead_id -> leads.id`
- `notifications.user_id -> users.id`
- `notifications.lead_id -> leads.id`
- `notifications.quote_id -> quotes.id`
- `notifications.change_order_id -> change_orders.id`
- `notifications.billing_cycle_id -> billing_cycles.id`

---

## Implementation notes for SQL phase (not executed yet)
- `billing_cycles` must be created before `leads.billing_cycle_id` foreign key can be added in SQL.
- `change_orders` must be created before `quotes.superseded_by_change_order_id` foreign key can be added in SQL.
- Existing `leads.status` or `quotes` price fields may already exist in some form; SQL migration should be defensive and reconcile rather than assume a pristine schema.
- RLS will follow existing patterns:
  - homeowners see their own leads / related quotes / notifications
  - contractors see their own profile / pricing profile / billing cycles / assigned leads / their quotes / relevant change-order records
  - admins manage `brand_ratings`, disputes, billing, and global review paths
  - service-role/server-side jobs handle automated transitions, draft generation, and billing scans

---

## Questions for Rocky review
1. Does this schema cover every contractor/homeowner/admin screen you expect to build in v1?
2. Do you need any additional UI-facing derived fields stored directly instead of computed in queries?
3. Is the split of `leads.status`, `quotes.status`, and `change_orders.homeowner_response` sufficient for your flows?
4. Do you want any additional portal-visible notification event types before SQL is shipped?

---

## Next file after approval
Once Rocky signs off, I will ship:
- `neighborlywork/supabase/001_backend_v1_schema.sql`
- `neighborlywork/supabase/002_backend_v1_rls.sql`
- `neighborlywork/docs/backend-state-machine.md`
