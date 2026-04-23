-- NeighborlyWork backend v1 RLS policies
-- Generated 2026-04-22
-- CHECKPOINT 1.3 hardening notes:
-- - safe to rerun
-- - keeps admin management isolated to admin users
-- - limits contractor visibility on change-order records to original bidders only

begin;

alter table public.billing_cycles enable row level security;
alter table public.change_orders enable row level security;
alter table public.change_order_responses enable row level security;
alter table public.brand_ratings enable row level security;
alter table public.contractor_pricing_profiles enable row level security;
alter table public.lead_status_history enable row level security;
alter table public.notifications enable row level security;

-- Helper predicates are inlined through EXISTS on public.users role='admin'.

-- billing_cycles -------------------------------------------------------------
drop policy if exists "billing_cycles_select_contractor_or_admin" on public.billing_cycles;
drop policy if exists "billing_cycles_admin_manage" on public.billing_cycles;

create policy "billing_cycles_select_contractor_or_admin"
on public.billing_cycles
for select
using (
  auth.uid() = contractor_id
  or exists (
    select 1 from public.users
    where public.users.id = auth.uid()
      and public.users.role = 'admin'
  )
);

create policy "billing_cycles_admin_manage"
on public.billing_cycles
for all
using (
  exists (
    select 1 from public.users
    where public.users.id = auth.uid()
      and public.users.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.users
    where public.users.id = auth.uid()
      and public.users.role = 'admin'
  )
);

-- change_orders --------------------------------------------------------------
drop policy if exists "change_orders_select_participants" on public.change_orders;
drop policy if exists "change_orders_insert_selected_contractor" on public.change_orders;
drop policy if exists "change_orders_update_participants_or_admin" on public.change_orders;

create policy "change_orders_select_participants"
on public.change_orders
for select
using (
  auth.uid() = contractor_id
  or exists (
    select 1
    from public.leads
    where public.leads.id = public.change_orders.lead_id
      and public.leads.homeowner_id = auth.uid()
  )
  or exists (
    select 1 from public.users
    where public.users.id = auth.uid()
      and public.users.role = 'admin'
  )
  or (
    visible_to_other_contractors = true
    and exists (
      select 1
      from public.quotes q
      where q.lead_id = public.change_orders.lead_id
        and q.status in ('submitted', 'selected', 'rejected', 'superseded')
        and q.contractor_id = auth.uid()
        and q.contractor_id <> public.change_orders.contractor_id
    )
  )
);

create policy "change_orders_insert_selected_contractor"
on public.change_orders
for insert
with check (
  auth.uid() = contractor_id
  and exists (
    select 1
    from public.leads
    where public.leads.id = public.change_orders.lead_id
      and public.leads.selected_contractor_id = auth.uid()
  )
);

create policy "change_orders_update_participants_or_admin"
on public.change_orders
for update
using (
  auth.uid() = contractor_id
  or exists (
    select 1
    from public.leads
    where public.leads.id = public.change_orders.lead_id
      and public.leads.homeowner_id = auth.uid()
  )
  or exists (
    select 1 from public.users
    where public.users.id = auth.uid()
      and public.users.role = 'admin'
  )
)
with check (
  auth.uid() = contractor_id
  or exists (
    select 1
    from public.leads
    where public.leads.id = public.change_orders.lead_id
      and public.leads.homeowner_id = auth.uid()
  )
  or exists (
    select 1 from public.users
    where public.users.id = auth.uid()
      and public.users.role = 'admin'
  )
);

-- change_order_responses -----------------------------------------------------
drop policy if exists "change_order_responses_select_participants" on public.change_order_responses;
drop policy if exists "change_order_responses_insert_eligible_contractor" on public.change_order_responses;
drop policy if exists "change_order_responses_update_responder_or_admin" on public.change_order_responses;

create policy "change_order_responses_select_participants"
on public.change_order_responses
for select
using (
  auth.uid() = responding_contractor_id
  or exists (
    select 1
    from public.change_orders co
    join public.leads l on l.id = co.lead_id
    where co.id = public.change_order_responses.change_order_id
      and (l.homeowner_id = auth.uid() or co.contractor_id = auth.uid())
  )
  or exists (
    select 1 from public.users
    where public.users.id = auth.uid()
      and public.users.role = 'admin'
  )
);

create policy "change_order_responses_insert_eligible_contractor"
on public.change_order_responses
for insert
with check (
  auth.uid() = responding_contractor_id
  and exists (
    select 1
    from public.change_orders co
    join public.quotes q on q.lead_id = co.lead_id
    where co.id = public.change_order_responses.change_order_id
      and co.visible_to_other_contractors = true
      and q.status in ('submitted', 'selected', 'rejected', 'superseded')
      and q.contractor_id = auth.uid()
      and q.contractor_id <> co.contractor_id
  )
);

create policy "change_order_responses_update_responder_or_admin"
on public.change_order_responses
for update
using (
  auth.uid() = responding_contractor_id
  or exists (
    select 1 from public.users
    where public.users.id = auth.uid()
      and public.users.role = 'admin'
  )
)
with check (
  auth.uid() = responding_contractor_id
  or exists (
    select 1 from public.users
    where public.users.id = auth.uid()
      and public.users.role = 'admin'
  )
);

-- brand_ratings --------------------------------------------------------------
drop policy if exists "brand_ratings_select_all_authenticated" on public.brand_ratings;
drop policy if exists "brand_ratings_admin_manage" on public.brand_ratings;

create policy "brand_ratings_select_all_authenticated"
on public.brand_ratings
for select
using (auth.uid() is not null);

create policy "brand_ratings_admin_manage"
on public.brand_ratings
for all
using (
  exists (
    select 1 from public.users
    where public.users.id = auth.uid()
      and public.users.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.users
    where public.users.id = auth.uid()
      and public.users.role = 'admin'
  )
);

-- contractor_pricing_profiles ------------------------------------------------
drop policy if exists "pricing_profiles_select_owner_or_admin" on public.contractor_pricing_profiles;
drop policy if exists "pricing_profiles_insert_owner_or_admin" on public.contractor_pricing_profiles;
drop policy if exists "pricing_profiles_update_owner_or_admin" on public.contractor_pricing_profiles;

create policy "pricing_profiles_select_owner_or_admin"
on public.contractor_pricing_profiles
for select
using (
  auth.uid() = contractor_id
  or exists (
    select 1 from public.users
    where public.users.id = auth.uid()
      and public.users.role = 'admin'
  )
);

create policy "pricing_profiles_insert_owner_or_admin"
on public.contractor_pricing_profiles
for insert
with check (
  auth.uid() = contractor_id
  or exists (
    select 1 from public.users
    where public.users.id = auth.uid()
      and public.users.role = 'admin'
  )
);

create policy "pricing_profiles_update_owner_or_admin"
on public.contractor_pricing_profiles
for update
using (
  auth.uid() = contractor_id
  or exists (
    select 1 from public.users
    where public.users.id = auth.uid()
      and public.users.role = 'admin'
  )
)
with check (
  auth.uid() = contractor_id
  or exists (
    select 1 from public.users
    where public.users.id = auth.uid()
      and public.users.role = 'admin'
  )
);

-- lead_status_history --------------------------------------------------------
drop policy if exists "lead_status_history_select_participants_or_admin" on public.lead_status_history;
drop policy if exists "lead_status_history_admin_manage" on public.lead_status_history;

create policy "lead_status_history_select_participants_or_admin"
on public.lead_status_history
for select
using (
  exists (
    select 1
    from public.leads
    where public.leads.id = public.lead_status_history.lead_id
      and (
        public.leads.homeowner_id = auth.uid()
        or public.leads.selected_contractor_id = auth.uid()
      )
  )
  or exists (
    select 1
    from public.quotes q
    where q.lead_id = public.lead_status_history.lead_id
      and q.contractor_id = auth.uid()
  )
  or exists (
    select 1 from public.users
    where public.users.id = auth.uid()
      and public.users.role = 'admin'
  )
);

create policy "lead_status_history_admin_manage"
on public.lead_status_history
for all
using (
  exists (
    select 1 from public.users
    where public.users.id = auth.uid()
      and public.users.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.users
    where public.users.id = auth.uid()
      and public.users.role = 'admin'
  )
);

-- notifications --------------------------------------------------------------
drop policy if exists "notifications_select_owner_or_admin" on public.notifications;
drop policy if exists "notifications_insert_owner_or_admin" on public.notifications;
drop policy if exists "notifications_update_owner_or_admin" on public.notifications;

create policy "notifications_select_owner_or_admin"
on public.notifications
for select
using (
  auth.uid() = user_id
  or exists (
    select 1 from public.users
    where public.users.id = auth.uid()
      and public.users.role = 'admin'
  )
);

create policy "notifications_insert_owner_or_admin"
on public.notifications
for insert
with check (
  (user_id is null and exists (
    select 1 from public.users
    where public.users.id = auth.uid()
      and public.users.role = 'admin'
  ))
  or auth.uid() = user_id
  or exists (
    select 1 from public.users
    where public.users.id = auth.uid()
      and public.users.role = 'admin'
  )
);

create policy "notifications_update_owner_or_admin"
on public.notifications
for update
using (
  auth.uid() = user_id
  or exists (
    select 1 from public.users
    where public.users.id = auth.uid()
      and public.users.role = 'admin'
  )
)
with check (
  auth.uid() = user_id
  or exists (
    select 1 from public.users
    where public.users.id = auth.uid()
      and public.users.role = 'admin'
  )
);

commit;
