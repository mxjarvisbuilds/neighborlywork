import { buildNotificationRecord } from './notifications-queue.mjs';

const MAX_BILLING_RETRIES = 3;
const RETRY_DELAYS_HOURS = [24, 48, 96];

function addHours(iso, hours) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) throw new Error('Invalid timestamp');
  return new Date(date.getTime() + hours * 60 * 60 * 1000).toISOString();
}

function hasStripeBillingProfile(contractor) {
  return Boolean(contractor?.payment_authorized && contractor?.stripe_customer_id && contractor?.stripe_payment_method_id && !contractor?.frozen_at);
}

function shouldAttemptBillingCycleCharge({ cycle, contractor, nowIso = new Date().toISOString() }) {
  if (!cycle || !contractor) return false;
  if (!hasStripeBillingProfile(contractor)) return false;
  const status = String(cycle.status || '').toLowerCase();
  if (status === 'pending' || status === 'processing') return true;
  if (status !== 'failed') return false;
  if ((cycle.retry_count || 0) >= MAX_BILLING_RETRIES) return false;
  if (!cycle.next_retry_at) return true;
  return new Date(cycle.next_retry_at).getTime() <= new Date(nowIso).getTime();
}

function buildStripeChargeRequest({ cycle, contractor }) {
  if (!cycle?.id) throw new Error('cycle.id is required.');
  if (!contractor?.stripe_customer_id || !contractor?.stripe_payment_method_id) {
    throw new Error('Contractor Stripe customer and payment method are required.');
  }
  const amount = Math.round(Number(cycle.total_amount_due || 0) * 100);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Billing cycle amount must be greater than zero.');
  }
  return {
    idempotencyKey: `neighborly-billing-cycle-${cycle.id}-attempt-${(cycle.retry_count || 0) + 1}`,
    form: {
      amount: String(amount),
      currency: 'usd',
      customer: contractor.stripe_customer_id,
      payment_method: contractor.stripe_payment_method_id,
      confirm: 'true',
      off_session: 'true',
      description: `NeighborlyWork billing cycle ${cycle.cycle_start_date || 'start'} to ${cycle.cycle_end_date || 'end'}`,
    },
  };
}

function buildBillingChargeSuccessPlan({ cycle, leadIds = [], chargeId, nowIso = new Date().toISOString(), contractorUserId = null }) {
  if (!cycle?.id) throw new Error('cycle.id is required.');
  if (!chargeId) throw new Error('chargeId is required.');
  return {
    cycleUpdate: {
      status: 'paid',
      stripe_charge_id: chargeId,
      charged_at: nowIso,
      next_retry_at: null,
      failure_reason: null,
      receipt_sent_at: nowIso,
      retry_count: cycle.retry_count || 0,
    },
    leadIds,
    leadUpdate: {
      billing_status: 'paid',
      billed_at: nowIso,
    },
    contractorUpdate: null,
    notifications: [buildNotificationRecord({
      userId: contractorUserId || cycle.contractor_id,
      billingCycleId: cycle.id,
      channel: 'portal',
      eventType: 'billing_cycle_charged',
      subject: 'Billing cycle charged',
      body: 'Your NeighborlyWork billing cycle was charged successfully.',
      payload: {
        stripe_charge_id: chargeId,
        total_amount_due: cycle.total_amount_due ?? null,
      },
    })],
  };
}

function buildBillingChargeFailurePlan({ cycle, leadIds = [], failureReason, nowIso = new Date().toISOString(), contractorUserId = null }) {
  if (!cycle?.id) throw new Error('cycle.id is required.');
  const nextRetryCount = (cycle.retry_count || 0) + 1;
  const finalFailure = nextRetryCount >= MAX_BILLING_RETRIES;
  const nextRetryAt = finalFailure ? null : addHours(nowIso, RETRY_DELAYS_HOURS[Math.min(nextRetryCount - 1, RETRY_DELAYS_HOURS.length - 1)]);
  return {
    cycleUpdate: {
      status: 'failed',
      retry_count: nextRetryCount,
      next_retry_at: nextRetryAt,
      failure_reason: failureReason,
    },
    leadIds,
    leadUpdate: {
      billing_status: finalFailure ? 'failed' : 'in_cycle',
    },
    contractorUpdate: finalFailure ? {
      frozen_at: nowIso,
      frozen_reason: `Billing frozen after final failed charge attempt: ${failureReason}`,
    } : null,
    notifications: [buildNotificationRecord({
      userId: contractorUserId || cycle.contractor_id,
      billingCycleId: cycle.id,
      channel: 'portal',
      eventType: 'billing_cycle_failed',
      subject: finalFailure ? 'Billing failed and account frozen' : 'Billing attempt failed',
      body: finalFailure
        ? 'Your billing cycle failed after the final retry and your contractor billing profile was frozen.'
        : 'Your billing cycle charge failed. We will retry automatically.',
      payload: {
        retry_count: nextRetryCount,
        next_retry_at: nextRetryAt,
        final_failure: finalFailure,
        failure_reason: failureReason,
      },
    })],
  };
}

const BillingChargeExecution = {
  MAX_BILLING_RETRIES,
  buildBillingChargeFailurePlan,
  buildBillingChargeSuccessPlan,
  buildStripeChargeRequest,
  hasStripeBillingProfile,
  shouldAttemptBillingCycleCharge,
};

if (typeof window !== 'undefined') {
  window.BillingChargeExecution = BillingChargeExecution;
}

export {
  MAX_BILLING_RETRIES,
  buildBillingChargeFailurePlan,
  buildBillingChargeSuccessPlan,
  buildStripeChargeRequest,
  hasStripeBillingProfile,
  shouldAttemptBillingCycleCharge,
};
