import test from 'node:test';
import assert from 'node:assert/strict';

import {
  MAX_BILLING_RETRIES,
  buildBillingChargeSuccessPlan,
  buildBillingChargeFailurePlan,
  buildStripeChargeRequest,
  shouldAttemptBillingCycleCharge,
} from '../app/billing-charge-execution.mjs';

test('shouldAttemptBillingCycleCharge only allows pending or due failed cycles with payment authorization and Stripe billing profile', () => {
  const contractor = {
    id: 'contractor-1',
    payment_authorized: true,
    stripe_customer_id: 'cus_123',
    stripe_payment_method_id: 'pm_123',
    frozen_at: null,
  };

  assert.equal(shouldAttemptBillingCycleCharge({
    cycle: { status: 'pending', retry_count: 0, next_retry_at: null },
    contractor,
    nowIso: '2026-05-15T12:00:00.000Z',
  }), true);

  assert.equal(shouldAttemptBillingCycleCharge({
    cycle: { status: 'failed', retry_count: 1, next_retry_at: '2026-05-16T12:00:00.000Z' },
    contractor,
    nowIso: '2026-05-15T12:00:00.000Z',
  }), false);

  assert.equal(shouldAttemptBillingCycleCharge({
    cycle: { status: 'failed', retry_count: 1, next_retry_at: '2026-05-14T12:00:00.000Z' },
    contractor,
    nowIso: '2026-05-15T12:00:00.000Z',
  }), true);

  assert.equal(shouldAttemptBillingCycleCharge({
    cycle: { status: 'pending', retry_count: 0 },
    contractor: { ...contractor, stripe_payment_method_id: null },
    nowIso: '2026-05-15T12:00:00.000Z',
  }), false);
});

test('buildStripeChargeRequest converts billing cycle totals into a Stripe payment-intent request with deterministic idempotency', () => {
  const result = buildStripeChargeRequest({
    cycle: {
      id: 'cycle-1',
      retry_count: 1,
      total_amount_due: 1600,
      cycle_start_date: '2026-05-01',
      cycle_end_date: '2026-05-14',
    },
    contractor: {
      id: 'contractor-1',
      stripe_customer_id: 'cus_123',
      stripe_payment_method_id: 'pm_123',
    },
  });

  assert.equal(result.idempotencyKey, 'neighborly-billing-cycle-cycle-1-attempt-2');
  assert.equal(result.form.amount, '160000');
  assert.equal(result.form.currency, 'usd');
  assert.equal(result.form.customer, 'cus_123');
  assert.equal(result.form.payment_method, 'pm_123');
  assert.equal(result.form.confirm, 'true');
  assert.equal(result.form.off_session, 'true');
  assert.match(result.form.description, /2026-05-01/);
});

test('buildBillingChargeSuccessPlan marks cycle paid, clears retry scheduling, marks leads paid, and queues receipt notifications', () => {
  const cycle = {
    id: 'cycle-1',
    contractor_id: 'contractor-1',
    total_amount_due: 1600,
    retry_count: 1,
  };
  const leadIds = ['lead-1', 'lead-2'];

  const result = buildBillingChargeSuccessPlan({
    cycle,
    leadIds,
    chargeId: 'pi_123',
    nowIso: '2026-05-15T12:00:00.000Z',
    contractorUserId: 'contractor-1',
  });

  assert.equal(result.cycleUpdate.status, 'paid');
  assert.equal(result.cycleUpdate.stripe_charge_id, 'pi_123');
  assert.equal(result.cycleUpdate.charged_at, '2026-05-15T12:00:00.000Z');
  assert.equal(result.cycleUpdate.receipt_sent_at, '2026-05-15T12:00:00.000Z');
  assert.equal(result.cycleUpdate.retry_count, 1);
  assert.equal(result.leadUpdate.billing_status, 'paid');
  assert.equal(result.leadUpdate.billed_at, '2026-05-15T12:00:00.000Z');
  assert.deepEqual(result.leadIds, leadIds);
  assert.equal(result.notifications.length, 1);
  assert.equal(result.notifications[0].event_type, 'billing_cycle_charged');
});

test('buildBillingChargeFailurePlan schedules retry before max retries and keeps contractor unfrozen', () => {
  const cycle = {
    id: 'cycle-1',
    contractor_id: 'contractor-1',
    retry_count: 1,
  };

  const result = buildBillingChargeFailurePlan({
    cycle,
    leadIds: ['lead-1', 'lead-2'],
    failureReason: 'card_declined',
    nowIso: '2026-05-15T12:00:00.000Z',
    contractorUserId: 'contractor-1',
  });

  assert.equal(MAX_BILLING_RETRIES, 3);
  assert.equal(result.cycleUpdate.status, 'failed');
  assert.equal(result.cycleUpdate.retry_count, 2);
  assert.equal(result.cycleUpdate.next_retry_at, '2026-05-17T12:00:00.000Z');
  assert.equal(result.leadUpdate.billing_status, 'in_cycle');
  assert.equal(result.contractorUpdate, null);
  assert.equal(result.notifications[0].event_type, 'billing_cycle_failed');
});

test('buildBillingChargeFailurePlan freezes contractor and marks leads failed after final retry', () => {
  const cycle = {
    id: 'cycle-1',
    contractor_id: 'contractor-1',
    retry_count: 2,
  };

  const result = buildBillingChargeFailurePlan({
    cycle,
    leadIds: ['lead-1'],
    failureReason: 'insufficient_funds',
    nowIso: '2026-05-15T12:00:00.000Z',
    contractorUserId: 'contractor-1',
  });

  assert.equal(result.cycleUpdate.retry_count, 3);
  assert.equal(result.cycleUpdate.next_retry_at, null);
  assert.equal(result.leadUpdate.billing_status, 'failed');
  assert.equal(result.contractorUpdate.frozen_at, '2026-05-15T12:00:00.000Z');
  assert.match(result.contractorUpdate.frozen_reason, /billing/i);
  assert.equal(result.notifications.length, 1);
  assert.equal(result.notifications[0].event_type, 'billing_cycle_failed');
});
