import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildBillingCycles,
  collectBillableLeads,
} from '../app/billing-cycle-prep.mjs';

test('collectBillableLeads only returns cleared-ready leads eligible for cycle creation', () => {
  const leads = [
    { id: 'lead-1', status: 'cleared', billing_status: 'ready_for_cycle', selected_contractor_id: 'contractor-1' },
    { id: 'lead-2', status: 'cleared', billing_status: 'not_ready', selected_contractor_id: 'contractor-1' },
    { id: 'lead-3', status: 'install_complete', billing_status: 'ready_for_cycle', selected_contractor_id: 'contractor-2' },
  ];

  const eligible = collectBillableLeads(leads);
  assert.deepEqual(eligible.map(item => item.id), ['lead-1']);
});

test('buildBillingCycles groups ready leads by contractor into pending 14-day cycles at the install referral rate', () => {
  const leads = [
    { id: 'lead-1', status: 'cleared', billing_status: 'ready_for_cycle', selected_contractor_id: 'contractor-1' },
    { id: 'lead-2', status: 'cleared', billing_status: 'ready_for_cycle', selected_contractor_id: 'contractor-1' },
    { id: 'lead-3', status: 'cleared', billing_status: 'ready_for_cycle', selected_contractor_id: 'contractor-2' },
  ];

  const result = buildBillingCycles({
    leads,
    cycleEndDate: '2026-05-14',
  });

  assert.equal(result.cycles.length, 2);
  assert.equal(result.cycles[0].status, 'pending');
  assert.equal(result.cycles[0].cycle_start_date, '2026-05-01');
  assert.equal(result.cycles[0].cycle_end_date, '2026-05-14');
  assert.equal(result.cycles[0].total_cleared_jobs, 2);
  assert.equal(result.cycles[0].total_amount_due, 1600);
  assert.deepEqual(result.assignments.find(item => item.contractor_id === 'contractor-1').lead_ids, ['lead-1', 'lead-2']);
  assert.equal(result.assignments.find(item => item.contractor_id === 'contractor-2').total_amount_due, 800);
});
