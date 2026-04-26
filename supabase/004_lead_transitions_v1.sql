create or replace function public.transition_lead_status(
  p_lead_id uuid,
  p_new_status public.lead_status_v1,
  p_reason text default null,
  p_metadata jsonb default '{}'::jsonb,
  p_selected_contractor_id uuid default null,
  p_selected_quote_id uuid default null,
  p_selection_timestamp timestamptz default null,
  p_verification_window_expires timestamptz default null,
  p_install_complete_timestamp timestamptz default null,
  p_dispute_window_expires timestamptz default null,
  p_billing_status public.lead_billing_status default null
)
returns public.leads
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lead public.leads%rowtype;
  v_allowed boolean := false;
  v_actor uuid := auth.uid();
  v_matched_count integer := 0;
  v_distinct_matched_count integer := 0;
  v_selected_quote public.quotes%rowtype;
  v_is_admin boolean := false;
  v_jwt_role text := coalesce(current_setting('request.jwt.claim.role', true), '');
begin
  select *
  into v_lead
  from public.leads
  where id = p_lead_id
  for update;

  if not found then
    raise exception 'Lead % not found', p_lead_id;
  end if;

  if v_lead.status = p_new_status then
    raise exception 'Lead % is already in status %', p_lead_id, p_new_status;
  end if;

  select exists (
    select 1
    from public.users
    where public.users.id = v_actor
      and public.users.role = 'admin'
  ) into v_is_admin;

  if v_jwt_role <> 'service_role' and not v_is_admin then
    if v_actor is null then
      raise exception 'Authentication is required to transition lead status';
    end if;

    if p_new_status in ('install_scheduled', 'install_complete', 'disputed', 'cleared', 'cancelled') then
      raise exception 'Admin authorization required for lead transition to %', p_new_status;
    end if;

    if p_new_status = 'matched_to_contractors' and v_lead.homeowner_id is distinct from v_actor then
      raise exception 'Only the homeowner or admin can submit this lead for matching';
    end if;

    if p_new_status = 'confirmed' and not (v_lead.status = 'change_order_open' and v_lead.homeowner_id = v_actor) then
      raise exception 'Only the homeowner can accept an open change order; other confirmed transitions require admin';
    end if;

    if p_new_status in ('homeowner_selected', 'pending_verification') and v_lead.homeowner_id is distinct from v_actor then
      raise exception 'Only the homeowner or admin can select or verify a quote for this lead';
    end if;

    if p_new_status = 'quotes_submitted' and not exists (
      select 1
      from unnest(coalesce(v_lead.matched_contractors, '{}'::uuid[])) as contractor_id
      where contractor_id = v_actor
    ) then
      raise exception 'Only a matched contractor or admin can mark quotes submitted for this lead';
    end if;

    if p_new_status = 'change_order_open' and v_lead.selected_contractor_id is distinct from v_actor then
      raise exception 'Only the selected contractor or admin can open a change order for this lead';
    end if;
  end if;

  v_allowed := (
    (v_lead.status = 'new' and p_new_status = 'matched_to_contractors')
    or (v_lead.status = 'matched_to_contractors' and p_new_status = 'quotes_submitted')
    or (v_lead.status = 'quotes_submitted' and p_new_status = 'homeowner_selected')
    or (v_lead.status = 'homeowner_selected' and p_new_status = 'pending_verification')
    or (v_lead.status = 'pending_verification' and p_new_status in ('confirmed', 'cancelled', 'change_order_open'))
    or (v_lead.status = 'change_order_open' and p_new_status in ('pending_verification', 'confirmed'))
    or (v_lead.status = 'confirmed' and p_new_status = 'install_scheduled')
    or (v_lead.status = 'install_scheduled' and p_new_status = 'install_complete')
    or (v_lead.status = 'install_complete' and p_new_status in ('disputed', 'cleared'))
    or (v_lead.status = 'disputed' and p_new_status in ('cleared', 'cancelled'))
  );

  if not v_allowed then
    raise exception 'Illegal lead transition: % -> %', v_lead.status, p_new_status;
  end if;

  if p_new_status = 'matched_to_contractors' then
    v_matched_count := coalesce(array_length(v_lead.matched_contractors, 1), 0);

    select count(distinct contractor_id)
    into v_distinct_matched_count
    from unnest(coalesce(v_lead.matched_contractors, '{}'::uuid[])) as contractor_id;

    if v_matched_count < 1 or v_matched_count > 3 then
      raise exception 'Lead % must have between 1 and 3 matched contractors before transition', p_lead_id;
    end if;

    if v_distinct_matched_count <> v_matched_count then
      raise exception 'Lead % has duplicate matched contractors', p_lead_id;
    end if;

    if exists (
      select 1
      from unnest(coalesce(v_lead.matched_contractors, '{}'::uuid[])) as contractor_id
      left join public.contractors c on c.id = contractor_id
      where c.id is null or c.status <> 'approved'
    ) then
      raise exception 'Lead % has unmatched or non-approved contractors in matched list', p_lead_id;
    end if;
  elsif p_new_status = 'quotes_submitted' then
    if not exists (
      select 1
      from public.quotes
      where lead_id = p_lead_id
        and status = 'submitted'
    ) then
      raise exception 'Lead % needs at least one submitted quote before transition', p_lead_id;
    end if;
  elsif p_new_status = 'homeowner_selected' then
    if p_selected_quote_id is null then
      raise exception 'Selecting a homeowner quote requires p_selected_quote_id';
    end if;

    select *
    into v_selected_quote
    from public.quotes
    where id = p_selected_quote_id
      and lead_id = p_lead_id;

    if not found then
      raise exception 'Selected quote % does not belong to lead %', p_selected_quote_id, p_lead_id;
    end if;

    if v_selected_quote.status <> 'submitted' then
      raise exception 'Selected quote % must still be submitted before selection', p_selected_quote_id;
    end if;

    if not exists (
      select 1
      from public.quotes
      where lead_id = p_lead_id
        and status = 'submitted'
    ) then
      raise exception 'Lead % must have at least one submitted quote before homeowner selection', p_lead_id;
    end if;

    if p_selected_contractor_id is null then
      p_selected_contractor_id := v_selected_quote.contractor_id;
    end if;

    if p_selected_contractor_id is distinct from v_selected_quote.contractor_id then
      raise exception 'Selected contractor % does not match quote contractor %', p_selected_contractor_id, v_selected_quote.contractor_id;
    end if;
  end if;

  update public.leads
  set status = p_new_status,
      selected_contractor_id = case when p_selected_contractor_id is not null then p_selected_contractor_id else selected_contractor_id end,
      selection_timestamp = case when p_selection_timestamp is not null then p_selection_timestamp else selection_timestamp end,
      verification_window_expires = case when p_verification_window_expires is not null then p_verification_window_expires else verification_window_expires end,
      install_complete_timestamp = case when p_install_complete_timestamp is not null then p_install_complete_timestamp else install_complete_timestamp end,
      dispute_window_expires = case when p_dispute_window_expires is not null then p_dispute_window_expires else dispute_window_expires end,
      billing_status = case when p_billing_status is not null then p_billing_status else billing_status end
  where id = p_lead_id;

  insert into public.lead_status_history (
    lead_id,
    previous_status,
    new_status,
    triggered_by,
    triggered_by_system,
    reason,
    metadata
  ) values (
    p_lead_id,
    v_lead.status,
    p_new_status,
    v_actor,
    v_actor is null,
    p_reason,
    coalesce(p_metadata, '{}'::jsonb)
  );

  select *
  into v_lead
  from public.leads
  where id = p_lead_id;

  return v_lead;
end;
$$;

revoke all on function public.transition_lead_status(
  uuid,
  public.lead_status_v1,
  text,
  jsonb,
  uuid,
  uuid,
  timestamptz,
  timestamptz,
  timestamptz,
  timestamptz,
  public.lead_billing_status
) from public;

grant execute on function public.transition_lead_status(
  uuid,
  public.lead_status_v1,
  text,
  jsonb,
  uuid,
  uuid,
  timestamptz,
  timestamptz,
  timestamptz,
  timestamptz,
  public.lead_billing_status
) to authenticated, service_role;