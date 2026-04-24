-- NeighborlyWork checkpoint 3.2 verification artifact
-- Purpose: prove the lead transition RPC writes the expected lead_status_history rows
-- without mutating durable project data.
--
-- Run this script in a privileged SQL session against the live project.
-- Expected outcome:
--   1. A single `proof_result` row is returned.
--   2. `final_status` = `homeowner_selected`.
--   3. `history_count` = 3.
--   4. The `history_rows` array shows:
--        new -> matched_to_contractors
--        matched_to_contractors -> quotes_submitted
--        quotes_submitted -> homeowner_selected
--   5. Final statement is `rollback;` so no fixture data persists.

begin;

insert into public.users (id, email, full_name, role)
values
  ('11111111-1111-1111-1111-111111111111'::uuid, 'fixture-contractor-1@example.com', 'Fixture Contractor One', 'contractor'),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'fixture-contractor-2@example.com', 'Fixture Contractor Two', 'contractor');

insert into public.contractors (id, business_name, license_number, insured, service_zips, services, status)
values
  ('11111111-1111-1111-1111-111111111111'::uuid, 'Fixture HVAC One', 'LIC-FIX-001', true, array['95814'], array['AC Installation'], 'approved'),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'Fixture HVAC Two', 'LIC-FIX-002', true, array['95814'], array['AC Installation'], 'approved');

with new_lead as (
  insert into public.leads (service_type, zip_code, timeline, matched_contractors)
  values (
    'AC Installation',
    '95814',
    'planning',
    array[
      '11111111-1111-1111-1111-111111111111'::uuid,
      '22222222-2222-2222-2222-222222222222'::uuid
    ]
  )
  returning id
), matched as (
  select public.transition_lead_status(
    id,
    'matched_to_contractors',
    'rollback proof: matched contractors',
    jsonb_build_object('proof', '3.2', 'step', 'step1')
  ) as lead_row
  from new_lead
), inserted_quote as (
  insert into public.quotes (
    lead_id,
    contractor_id,
    equipment_brand,
    seer_rating,
    warranty_years,
    equipment_cost,
    labor_cost,
    total_price,
    status
  )
  select
    id,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Carrier',
    16,
    10,
    5000,
    2000,
    7000,
    'submitted'
  from new_lead
  returning id, lead_id
), quoted as (
  select public.transition_lead_status(
    lead_id,
    'quotes_submitted',
    'rollback proof: quote submitted',
    jsonb_build_object('proof', '3.2', 'step', 'step2')
  ) as lead_row
  from inserted_quote
), selected as (
  select public.transition_lead_status(
    iq.lead_id,
    'homeowner_selected',
    'rollback proof: homeowner selected quote',
    jsonb_build_object('proof', '3.2', 'step', 'step3'),
    '11111111-1111-1111-1111-111111111111'::uuid,
    iq.id,
    now(),
    null,
    null,
    null,
    null
  ) as lead_row
  from inserted_quote iq
), proof as (
  select json_build_object(
    'lead_id', (select id from new_lead),
    'final_status', ((select lead_row from selected)).status,
    'selected_contractor_id', ((select lead_row from selected)).selected_contractor_id,
    'history_count', (
      select count(*)
      from public.lead_status_history
      where lead_id = (select id from new_lead)
    ),
    'history_rows', (
      select json_agg(
        json_build_object(
          'previous_status', previous_status,
          'new_status', new_status,
          'reason', reason
        )
        order by created_at
      )
      from public.lead_status_history
      where lead_id = (select id from new_lead)
    )
  ) as proof_result
)
select proof_result
from proof;

rollback;
