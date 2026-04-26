-- NeighborlyWork admin RLS overlay
-- Adds explicit admin policies for legacy/core marketplace tables that predate 002_backend_v1_rls.sql.
-- Safe to re-run: drops/recreates only the admin overlay policies.

begin;

alter table if exists public.users enable row level security;
alter table if exists public.contractors enable row level security;
alter table if exists public.leads enable row level security;
alter table if exists public.quotes enable row level security;
alter table if exists public.messages enable row level security;
alter table if exists public.reviews enable row level security;

do $$
begin
  if to_regclass('public.users') is not null then
    drop policy if exists "users_admin_select" on public.users;
    drop policy if exists "users_admin_manage" on public.users;
    create policy "users_admin_select" on public.users for select
      using (exists (select 1 from public.users admin_user where admin_user.id = auth.uid() and admin_user.role = 'admin'));
    create policy "users_admin_manage" on public.users for all
      using (exists (select 1 from public.users admin_user where admin_user.id = auth.uid() and admin_user.role = 'admin'))
      with check (exists (select 1 from public.users admin_user where admin_user.id = auth.uid() and admin_user.role = 'admin'));
  end if;

  if to_regclass('public.contractors') is not null then
    drop policy if exists "contractors_admin_select" on public.contractors;
    drop policy if exists "contractors_admin_manage" on public.contractors;
    create policy "contractors_admin_select" on public.contractors for select
      using (exists (select 1 from public.users admin_user where admin_user.id = auth.uid() and admin_user.role = 'admin'));
    create policy "contractors_admin_manage" on public.contractors for all
      using (exists (select 1 from public.users admin_user where admin_user.id = auth.uid() and admin_user.role = 'admin'))
      with check (exists (select 1 from public.users admin_user where admin_user.id = auth.uid() and admin_user.role = 'admin'));
  end if;

  if to_regclass('public.leads') is not null then
    drop policy if exists "leads_admin_select" on public.leads;
    drop policy if exists "leads_admin_manage" on public.leads;
    create policy "leads_admin_select" on public.leads for select
      using (exists (select 1 from public.users admin_user where admin_user.id = auth.uid() and admin_user.role = 'admin'));
    create policy "leads_admin_manage" on public.leads for all
      using (exists (select 1 from public.users admin_user where admin_user.id = auth.uid() and admin_user.role = 'admin'))
      with check (exists (select 1 from public.users admin_user where admin_user.id = auth.uid() and admin_user.role = 'admin'));
  end if;

  if to_regclass('public.quotes') is not null then
    drop policy if exists "quotes_admin_select" on public.quotes;
    drop policy if exists "quotes_admin_manage" on public.quotes;
    create policy "quotes_admin_select" on public.quotes for select
      using (exists (select 1 from public.users admin_user where admin_user.id = auth.uid() and admin_user.role = 'admin'));
    create policy "quotes_admin_manage" on public.quotes for all
      using (exists (select 1 from public.users admin_user where admin_user.id = auth.uid() and admin_user.role = 'admin'))
      with check (exists (select 1 from public.users admin_user where admin_user.id = auth.uid() and admin_user.role = 'admin'));
  end if;

  if to_regclass('public.messages') is not null then
    drop policy if exists "messages_admin_select" on public.messages;
    drop policy if exists "messages_admin_update" on public.messages;
    create policy "messages_admin_select" on public.messages for select
      using (exists (select 1 from public.users admin_user where admin_user.id = auth.uid() and admin_user.role = 'admin'));
    create policy "messages_admin_update" on public.messages for update
      using (exists (select 1 from public.users admin_user where admin_user.id = auth.uid() and admin_user.role = 'admin'))
      with check (exists (select 1 from public.users admin_user where admin_user.id = auth.uid() and admin_user.role = 'admin'));
  end if;

  if to_regclass('public.reviews') is not null then
    drop policy if exists "reviews_admin_select" on public.reviews;
    drop policy if exists "reviews_admin_manage" on public.reviews;
    create policy "reviews_admin_select" on public.reviews for select
      using (exists (select 1 from public.users admin_user where admin_user.id = auth.uid() and admin_user.role = 'admin'));
    create policy "reviews_admin_manage" on public.reviews for all
      using (exists (select 1 from public.users admin_user where admin_user.id = auth.uid() and admin_user.role = 'admin'))
      with check (exists (select 1 from public.users admin_user where admin_user.id = auth.uid() and admin_user.role = 'admin'));
  end if;
end $$;

commit;
