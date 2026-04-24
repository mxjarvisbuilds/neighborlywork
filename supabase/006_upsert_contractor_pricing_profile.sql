create or replace function public.upsert_contractor_pricing_profile(
  p_base_labor_rate numeric(12,2),
  p_brand_markups jsonb default '{}'::jsonb,
  p_service_area_fees jsonb default '{}'::jsonb,
  p_default_warranty_offered integer default null,
  p_default_install_timeline_days integer default null,
  p_markup_preferences jsonb default '{}'::jsonb,
  p_contractor_id uuid default null
)
returns public.contractor_pricing_profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_target_contractor uuid;
  v_is_admin boolean := false;
  v_complete boolean := false;
  v_profile public.contractor_pricing_profiles%rowtype;
begin
  if v_actor is null then
    raise exception 'Authentication required';
  end if;

  select exists (
    select 1
    from public.users
    where id = v_actor
      and role = 'admin'
  ) into v_is_admin;

  v_target_contractor := coalesce(p_contractor_id, v_actor);

  if not v_is_admin and v_target_contractor <> v_actor then
    raise exception 'Cannot manage another contractor pricing profile';
  end if;

  if not exists (
    select 1
    from public.contractors
    where id = v_target_contractor
  ) then
    raise exception 'Contractor % not found', v_target_contractor;
  end if;

  if p_base_labor_rate < 0 then
    raise exception 'Base labor rate must be nonnegative';
  end if;

  if p_default_warranty_offered is not null and p_default_warranty_offered < 0 then
    raise exception 'Default warranty must be nonnegative';
  end if;

  if p_default_install_timeline_days is not null and p_default_install_timeline_days < 0 then
    raise exception 'Default install timeline days must be nonnegative';
  end if;

  insert into public.contractor_pricing_profiles (
    contractor_id,
    base_labor_rate,
    brand_markups,
    service_area_fees,
    default_warranty_offered,
    default_install_timeline_days,
    markup_preferences
  ) values (
    v_target_contractor,
    p_base_labor_rate,
    coalesce(p_brand_markups, '{}'::jsonb),
    coalesce(p_service_area_fees, '{}'::jsonb),
    p_default_warranty_offered,
    p_default_install_timeline_days,
    coalesce(p_markup_preferences, '{}'::jsonb)
  )
  on conflict (contractor_id)
  do update set
    base_labor_rate = excluded.base_labor_rate,
    brand_markups = excluded.brand_markups,
    service_area_fees = excluded.service_area_fees,
    default_warranty_offered = excluded.default_warranty_offered,
    default_install_timeline_days = excluded.default_install_timeline_days,
    markup_preferences = excluded.markup_preferences,
    updated_at = now()
  returning * into v_profile;

  v_complete := (
    v_profile.base_labor_rate > 0
    and v_profile.default_warranty_offered is not null
    and v_profile.default_install_timeline_days is not null
  );

  update public.contractors
  set pricing_profile_complete = v_complete
  where id = v_target_contractor;

  return v_profile;
end;
$$;

revoke all on function public.upsert_contractor_pricing_profile(
  numeric,
  jsonb,
  jsonb,
  integer,
  integer,
  jsonb,
  uuid
) from public;

grant execute on function public.upsert_contractor_pricing_profile(
  numeric,
  jsonb,
  jsonb,
  integer,
  integer,
  jsonb,
  uuid
) to authenticated, service_role;
