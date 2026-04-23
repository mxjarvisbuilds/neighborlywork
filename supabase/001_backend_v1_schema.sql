-- NeighborlyWork backend v1 schema foundation
-- Generated 2026-04-22
-- Applies enum, table, and column changes required for v1 lifecycle, billing, notifications,
-- draft quote generation, and change-order support.
-- CHECKPOINT 1.2 hardening notes:
-- - safe to rerun
-- - tolerates legacy lead status typing
-- - reconciles legacy quote total fields when present

begin;

create extension if not exists pgcrypto;

-- Enums ---------------------------------------------------------------------
do $$ begin
  create type public.lead_quote_type as enum ('quick_quote', 'accurate_quote');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.lead_status_v1 as enum (
    'new',
    'matched_to_contractors',
    'quotes_submitted',
    'homeowner_selected',
    'pending_verification',
    'change_order_open',
    'confirmed',
    'install_scheduled',
    'install_complete',
    'disputed',
    'cleared',
    'cancelled'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.quote_status as enum ('draft', 'submitted', 'superseded', 'selected', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.quote_system_type as enum (
    'heat_pump',
    'gas_furnace',
    'electric_furnace',
    'split_system',
    'package_unit',
    'mini_split',
    'other'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.change_order_reason_category as enum (
    'equipment_change',
    'additional_work_required',
    'access_issues',
    'code_compliance',
    'homeowner_request_upgrade',
    'other'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.change_order_need_type as enum ('necessary', 'recommended', 'optional_upgrade');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.change_order_homeowner_response as enum (
    'pending',
    'accepted',
    'rejected_switched_contractor',
    'requested_more_info'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.change_order_response_type as enum (
    'would_match',
    'would_do_for_less',
    'agree_necessary',
    'flag_as_upsell'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.billing_cycle_status as enum ('pending', 'processing', 'paid', 'failed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.lead_billing_status as enum ('not_ready', 'ready_for_cycle', 'in_cycle', 'paid', 'failed', 'waived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.notification_channel as enum ('email', 'sms', 'portal');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.notification_event_type as enum (
    'quotes_ready',
    'contractor_selected',
    'verification_window_started',
    'change_order_submitted',
    'change_order_response_window_open',
    'change_order_response_received',
    'install_scheduled',
    'install_complete',
    'dispute_window_closing',
    'lead_cleared',
    'new_lead_assigned',
    'draft_quote_created',
    'billing_cycle_pending',
    'billing_cycle_charged',
    'billing_cycle_failed',
    'manual_review_required'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.notification_status as enum ('pending', 'sent', 'failed', 'read');
exception when duplicate_object then null; end $$;

-- New tables ----------------------------------------------------------------
create table if not exists public.billing_cycles (
  id uuid primary key default gen_random_uuid(),
  contractor_id uuid not null references public.contractors(id) on delete cascade,
  cycle_start_date date not null,
  cycle_end_date date not null,
  total_cleared_jobs integer not null default 0,
  total_amount_due numeric(12,2) not null default 0,
  status public.billing_cycle_status not null default 'pending',
  stripe_charge_id text,
  charged_at timestamptz,
  retry_count integer not null default 0,
  next_retry_at timestamptz,
  failure_reason text,
  receipt_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.change_orders (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  contractor_id uuid not null references public.contractors(id) on delete cascade,
  original_price numeric(12,2) not null,
  revised_price numeric(12,2) not null,
  price_difference numeric(12,2) not null,
  reason_category public.change_order_reason_category not null,
  reason_description text not null,
  is_upsell_or_necessary public.change_order_need_type not null,
  submitted_at timestamptz not null default now(),
  response_window_expires timestamptz not null,
  homeowner_response public.change_order_homeowner_response not null default 'pending',
  homeowner_responded_at timestamptz,
  visible_to_other_contractors boolean not null default true,
  requested_more_info_at timestamptz,
  resolved_at timestamptz,
  created_by uuid references public.users(id) on delete set null
);

create table if not exists public.change_order_responses (
  id uuid primary key default gen_random_uuid(),
  change_order_id uuid not null references public.change_orders(id) on delete cascade,
  responding_contractor_id uuid not null references public.contractors(id) on delete cascade,
  response_type public.change_order_response_type not null,
  alternative_price numeric(12,2),
  response_notes text,
  submitted_at timestamptz not null default now(),
  unique(change_order_id, responding_contractor_id)
);

create table if not exists public.brand_ratings (
  id uuid primary key default gen_random_uuid(),
  brand_name text not null,
  system_type public.quote_system_type not null,
  rating_score numeric(4,2) not null check (rating_score >= 1 and rating_score <= 10),
  rating_sources jsonb not null default '[]'::jsonb,
  methodology_notes text not null,
  last_updated timestamptz not null default now(),
  updated_by uuid references public.users(id) on delete set null,
  unique (brand_name, system_type)
);

create table if not exists public.contractor_pricing_profiles (
  id uuid primary key default gen_random_uuid(),
  contractor_id uuid not null unique references public.contractors(id) on delete cascade,
  base_labor_rate numeric(12,2) not null default 0,
  brand_markups jsonb not null default '{}'::jsonb,
  service_area_fees jsonb not null default '{}'::jsonb,
  default_warranty_offered integer,
  default_install_timeline_days integer,
  markup_preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lead_status_history (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  previous_status public.lead_status_v1,
  new_status public.lead_status_v1 not null,
  triggered_by uuid references public.users(id) on delete set null,
  triggered_by_system boolean not null default false,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete cascade,
  quote_id uuid references public.quotes(id) on delete cascade,
  change_order_id uuid references public.change_orders(id) on delete cascade,
  billing_cycle_id uuid references public.billing_cycles(id) on delete cascade,
  channel public.notification_channel not null,
  event_type public.notification_event_type not null,
  status public.notification_status not null default 'pending',
  subject text,
  body text not null,
  payload jsonb not null default '{}'::jsonb,
  scheduled_for timestamptz,
  sent_at timestamptz,
  read_at timestamptz,
  failed_at timestamptz,
  failure_reason text,
  created_at timestamptz not null default now()
);

-- Existing table extensions --------------------------------------------------
alter table public.contractors
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_payment_method_id text,
  add column if not exists payment_authorized boolean not null default false,
  add column if not exists pricing_profile_complete boolean not null default false,
  add column if not exists frozen_at timestamptz,
  add column if not exists frozen_reason text;

alter table public.leads
  add column if not exists quote_type public.lead_quote_type not null default 'accurate_quote',
  add column if not exists selected_contractor_id uuid references public.contractors(id) on delete set null,
  add column if not exists selection_timestamp timestamptz,
  add column if not exists verification_window_expires timestamptz,
  add column if not exists install_complete_timestamp timestamptz,
  add column if not exists dispute_window_expires timestamptz,
  add column if not exists billing_cycle_id uuid references public.billing_cycles(id) on delete set null,
  add column if not exists billed_at timestamptz,
  add column if not exists billing_status public.lead_billing_status not null default 'not_ready';

alter table public.quotes
  add column if not exists status public.quote_status not null default 'submitted',
  add column if not exists equipment_brand text,
  add column if not exists equipment_model text,
  add column if not exists system_type public.quote_system_type,
  add column if not exists system_size_tons numeric(4,2),
  add column if not exists seer_rating numeric(4,2),
  add column if not exists warranty_years integer,
  add column if not exists install_timeline_days integer,
  add column if not exists price_total numeric(12,2),
  add column if not exists price_breakdown jsonb not null default '{}'::jsonb,
  add column if not exists what_included text,
  add column if not exists what_not_included text,
  add column if not exists contractor_notes text,
  add column if not exists superseded_by_change_order_id uuid,
  add column if not exists draft_generated_at timestamptz,
  add column if not exists submitted_at timestamptz,
  add column if not exists selected_at timestamptz,
  add column if not exists rejected_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'quotes_superseded_by_change_order_fk'
  ) then
    alter table public.quotes
      add constraint quotes_superseded_by_change_order_fk
      foreign key (superseded_by_change_order_id)
      references public.change_orders(id)
      on delete set null;
  end if;
end $$;

-- Migrate existing lead status column if needed ------------------------------
do $$
declare
  current_data_type text;
  current_udt_name text;
begin
  select data_type, udt_name
    into current_data_type, current_udt_name
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'leads'
    and column_name = 'status';

  if current_data_type = 'text' then
    alter table public.leads
      alter column status drop default;

    update public.leads
    set status = case
      when status in ('open', 'new') then 'new'
      when status = 'quoted' then 'quotes_submitted'
      when status = 'selected' then 'homeowner_selected'
      when status = 'installed' then 'install_complete'
      when status = 'closed' then 'cleared'
      when status = 'cancelled' then 'cancelled'
      else 'new'
    end;

    alter table public.leads
      alter column status type public.lead_status_v1
      using status::public.lead_status_v1;

    alter table public.leads
      alter column status set default 'new';
  elsif current_udt_name is not null and current_udt_name <> 'lead_status_v1' then
    alter table public.leads
      alter column status drop default;

    alter table public.leads
      alter column status type text
      using status::text;

    update public.leads
    set status = case
      when status in ('open', 'new') then 'new'
      when status = 'quoted' then 'quotes_submitted'
      when status = 'selected' then 'homeowner_selected'
      when status = 'installed' then 'install_complete'
      when status = 'closed' then 'cleared'
      when status = 'cancelled' then 'cancelled'
      else 'new'
    end;

    alter table public.leads
      alter column status type public.lead_status_v1
      using status::public.lead_status_v1;

    alter table public.leads
      alter column status set default 'new';
  end if;
exception when undefined_column then
  null;
end $$;

-- Reconcile legacy total_price column if present.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'quotes'
      and column_name = 'total_price'
  ) then
    update public.quotes
    set price_total = coalesce(price_total, total_price)
    where total_price is not null;
  end if;
end $$;

create index if not exists idx_leads_status_v1 on public.leads(status);
create index if not exists idx_leads_selected_contractor on public.leads(selected_contractor_id);
create index if not exists idx_quotes_status on public.quotes(status);
create index if not exists idx_quotes_lead_status on public.quotes(lead_id, status);
create index if not exists idx_change_orders_lead on public.change_orders(lead_id);
create index if not exists idx_change_orders_contractor on public.change_orders(contractor_id);
create index if not exists idx_change_order_responses_change_order on public.change_order_responses(change_order_id);
create index if not exists idx_brand_ratings_brand_type on public.brand_ratings(brand_name, system_type);
create index if not exists idx_billing_cycles_contractor_status on public.billing_cycles(contractor_id, status);
create index if not exists idx_lead_status_history_lead_created on public.lead_status_history(lead_id, created_at desc);
create index if not exists idx_notifications_user_status on public.notifications(user_id, status);
create index if not exists idx_notifications_lead on public.notifications(lead_id);

commit;
