import assert from 'node:assert/strict';
import test from 'node:test';
import { buildTimeoutAutomationPlan } from '../app/timeout-automation.mjs';

test('timeout automation advances quote window when submitted quotes exist', () => {
  const plan = buildTimeoutAutomationPlan({
    nowIso: '2026-04-26T12:00:00.000Z',
    leads: [{ id: 'lead-1', status: 'matched_to_contractors', created_at: '2026-04-24T10:00:00.000Z' }],
    quotes: [{ id: 'quote-1', lead_id: 'lead-1', status: 'submitted' }],
  });
  assert.deepEqual(plan.leadUpdates[0], {
    leadId: 'lead-1',
    newStatus: 'quotes_submitted',
    reason: 'Quote response window expired with at least one submitted quote',
    metadata: { source: 'timeout-automation', timeout_type: 'quote_window_48h' },
  });
});

test('timeout automation confirms expired verification windows and clears expired dispute windows', () => {
  const plan = buildTimeoutAutomationPlan({
    nowIso: '2026-04-26T12:00:00.000Z',
    leads: [
      { id: 'lead-2', status: 'pending_verification', verification_window_expires: '2026-04-26T11:59:00.000Z' },
      { id: 'lead-3', status: 'install_complete', dispute_window_expires: '2026-04-26T11:59:00.000Z' },
    ],
  });
  assert.equal(plan.leadUpdates[0].newStatus, 'confirmed');
  assert.equal(plan.leadUpdates[1].newStatus, 'cleared');
  assert.equal(plan.leadUpdates[1].billingStatus, 'ready_for_cycle');
});

test('timeout automation closes expired change order response windows', () => {
  const plan = buildTimeoutAutomationPlan({
    nowIso: '2026-04-26T12:00:00.000Z',
    changeOrders: [{ id: 'co-1', lead_id: 'lead-1', resolved_at: null, response_window_expires: '2026-04-26T11:59:00.000Z' }],
  });
  assert.equal(plan.changeOrderUpdates[0].visibleToOtherContractors, false);
});
