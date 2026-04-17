-- NeighborlyWork signup / onboarding RLS fix
-- Run this in the Supabase SQL Editor for project uuaofdponevqwbfzwxtp

alter table public.users enable row level security;
alter table public.contractors enable row level security;
alter table public.leads enable row level security;
alter table public.quotes enable row level security;
alter table public.messages enable row level security;
alter table public.reviews enable row level security;

-- USERS
create policy if not exists "users_select_own"
on public.users
for select
using (auth.uid() = id);

create policy if not exists "users_insert_own"
on public.users
for insert
with check (auth.uid() = id);

create policy if not exists "users_update_own"
on public.users
for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- CONTRACTORS
create policy if not exists "contractors_select_own"
on public.contractors
for select
using (auth.uid() = id);

create policy if not exists "contractors_insert_own"
on public.contractors
for insert
with check (auth.uid() = id);

create policy if not exists "contractors_update_own"
on public.contractors
for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- LEADS
create policy if not exists "leads_select_homeowner_own"
on public.leads
for select
using (auth.uid() = homeowner_id);

create policy if not exists "leads_insert_homeowner_own"
on public.leads
for insert
with check (auth.uid() = homeowner_id);

create policy if not exists "leads_update_homeowner_own"
on public.leads
for update
using (auth.uid() = homeowner_id)
with check (auth.uid() = homeowner_id);

-- QUOTES
create policy if not exists "quotes_select_contractor_own"
on public.quotes
for select
using (auth.uid() = contractor_id);

create policy if not exists "quotes_insert_contractor_own"
on public.quotes
for insert
with check (auth.uid() = contractor_id);

create policy if not exists "quotes_update_contractor_own"
on public.quotes
for update
using (auth.uid() = contractor_id)
with check (auth.uid() = contractor_id);

-- Homeowner can read quotes for their own leads
create policy if not exists "quotes_select_homeowner_for_own_leads"
on public.quotes
for select
using (
  exists (
    select 1
    from public.leads
    where public.leads.id = public.quotes.lead_id
      and public.leads.homeowner_id = auth.uid()
  )
);

-- Homeowner can update quote status when selecting contractor on their own lead
create policy if not exists "quotes_update_homeowner_for_own_leads"
on public.quotes
for update
using (
  exists (
    select 1
    from public.leads
    where public.leads.id = public.quotes.lead_id
      and public.leads.homeowner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.leads
    where public.leads.id = public.quotes.lead_id
      and public.leads.homeowner_id = auth.uid()
  )
);

-- MESSAGES
create policy if not exists "messages_select_participants"
on public.messages
for select
using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy if not exists "messages_insert_sender"
on public.messages
for insert
with check (auth.uid() = sender_id);

create policy if not exists "messages_update_receiver_or_sender"
on public.messages
for update
using (auth.uid() = sender_id or auth.uid() = receiver_id)
with check (auth.uid() = sender_id or auth.uid() = receiver_id);

-- REVIEWS
create policy if not exists "reviews_select_homeowner_or_contractor"
on public.reviews
for select
using (auth.uid() = homeowner_id or auth.uid() = contractor_id);

create policy if not exists "reviews_insert_homeowner_own"
on public.reviews
for insert
with check (auth.uid() = homeowner_id);

create policy if not exists "reviews_update_homeowner_own"
on public.reviews
for update
using (auth.uid() = homeowner_id)
with check (auth.uid() = homeowner_id);
