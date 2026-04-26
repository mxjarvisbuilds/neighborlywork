#!/usr/bin/env node

import { loadLocalSecrets } from './load-local-secrets.mjs';
import {
  buildBillingChargeFailurePlan,
  buildBillingChargeSuccessPlan,
  buildStripeChargeRequest,
  shouldAttemptBillingCycleCharge,
} from '../app/billing-charge-execution.mjs';

loadLocalSecrets();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://uuaofdponevqwbfzwxtp.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const STRIPE_SECRET_KEY = process.env.STRIPE_TEST_SECRET_KEY || process.env.STRIPE_SECRET_KEY || '';
const DRY_RUN = process.argv.includes('--dry-run');
const LIMIT_ARG = process.argv.find(arg => arg.startsWith('--limit='));
const LIMIT = LIMIT_ARG ? Number(LIMIT_ARG.split('=')[1]) : null;

function ensureEnv() {
  const missing = [];
  if (!SUPABASE_URL) missing.push('SUPABASE_URL');
  if (!SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (!STRIPE_SECRET_KEY && !DRY_RUN) missing.push('STRIPE_SECRET_KEY');
  if (missing.length) {
    throw new Error(`Missing required environment variable(s): ${missing.join(', ')}`);
  }
}

function supabaseHeaders() {
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  };
}

async function supabaseGet(path) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: supabaseHeaders() });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Supabase GET failed (${response.status}): ${text}`);
  }
  return text ? JSON.parse(text) : [];
}

async function supabasePatch(table, query, payload) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    method: 'PATCH',
    headers: supabaseHeaders(),
    body: JSON.stringify(payload),
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Supabase PATCH ${table} failed (${response.status}): ${text}`);
  }
  return text ? JSON.parse(text) : [];
}

async function supabaseInsert(table, payload) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: supabaseHeaders(),
    body: JSON.stringify(payload),
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Supabase INSERT ${table} failed (${response.status}): ${text}`);
  }
  return text ? JSON.parse(text) : [];
}

async function supabaseRpc(functionName, payload = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${functionName}`, {
    method: 'POST',
    headers: supabaseHeaders(),
    body: JSON.stringify(payload),
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Supabase RPC ${functionName} failed (${response.status}): ${text}`);
  }
  return text ? JSON.parse(text) : [];
}

async function claimNextBillingCycleForCharge() {
  const rows = await supabaseRpc('claim_billing_cycle_for_charge', {
    p_now: new Date().toISOString(),
    p_lock_minutes: 15,
  });
  return rows[0] || null;
}

async function fetchContractor(contractorId) {
  const rows = await supabaseGet(`contractors?id=eq.${contractorId}&select=id,payment_authorized,stripe_customer_id,stripe_payment_method_id,frozen_at,frozen_reason`);
  return rows[0] || null;
}

async function fetchCycleLeadIds(cycleId) {
  const rows = await supabaseGet(`leads?billing_cycle_id=eq.${cycleId}&select=id,billing_status`);
  return (rows || []).map(row => row.id);
}

function formEncode(data) {
  const params = new URLSearchParams();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== null && value !== undefined) params.append(key, String(value));
  });
  return params;
}

async function createStripePaymentIntent({ cycle, contractor }) {
  const request = buildStripeChargeRequest({ cycle, contractor });
  const response = await fetch('https://api.stripe.com/v1/payment_intents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Idempotency-Key': request.idempotencyKey,
    },
    body: formEncode(request.form),
  });
  const text = await response.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  if (!response.ok) {
    const message = data?.error?.message || data?.error?.code || `stripe_http_${response.status}`;
    const err = new Error(message);
    err.stripe = data;
    throw err;
  }
  return data;
}

async function applyPlan({ cycle, leadIds, plan }) {
  await supabasePatch('billing_cycles', `id=eq.${cycle.id}`, plan.cycleUpdate);
  if (leadIds.length) {
    await supabasePatch('leads', `id=in.(${leadIds.join(',')})`, plan.leadUpdate);
  }
  if (plan.contractorUpdate) {
    await supabasePatch('contractors', `id=eq.${cycle.contractor_id}`, plan.contractorUpdate);
  }
  if (plan.notifications?.length) {
    await supabaseInsert('notifications', plan.notifications);
  }
}

async function processCycle(cycle) {
  const contractor = await fetchContractor(cycle.contractor_id);
  const leadIds = await fetchCycleLeadIds(cycle.id);
  const nowIso = new Date().toISOString();

  if (!shouldAttemptBillingCycleCharge({ cycle, contractor, nowIso })) {
    return { cycleId: cycle.id, status: 'skipped', reason: 'not_chargeable_now' };
  }

  if (DRY_RUN) {
    return {
      cycleId: cycle.id,
      status: 'dry_run',
      contractorId: cycle.contractor_id,
      totalAmountDue: cycle.total_amount_due,
      leadIds,
    };
  }

  try {
    const paymentIntent = await createStripePaymentIntent({ cycle, contractor });
    const successPlan = buildBillingChargeSuccessPlan({
      cycle,
      leadIds,
      chargeId: paymentIntent.id,
      nowIso,
      contractorUserId: cycle.contractor_id,
    });
    await applyPlan({ cycle, leadIds, plan: successPlan });
    return { cycleId: cycle.id, status: 'paid', chargeId: paymentIntent.id, leadCount: leadIds.length };
  } catch (error) {
    const failurePlan = buildBillingChargeFailurePlan({
      cycle,
      leadIds,
      failureReason: error.message || 'stripe_charge_failed',
      nowIso,
      contractorUserId: cycle.contractor_id,
    });
    await applyPlan({ cycle, leadIds, plan: failurePlan });
    return {
      cycleId: cycle.id,
      status: 'failed',
      leadCount: leadIds.length,
      retryCount: failurePlan.cycleUpdate.retry_count,
      frozen: Boolean(failurePlan.contractorUpdate),
      reason: error.message || 'stripe_charge_failed',
    };
  }
}

async function main() {
  ensureEnv();
  const results = [];
  const maxCycles = LIMIT && Number.isFinite(LIMIT) && LIMIT > 0 ? LIMIT : Number.POSITIVE_INFINITY;
  while (results.length < maxCycles) {
    const cycle = await claimNextBillingCycleForCharge();
    if (!cycle) break;
    results.push(await processCycle(cycle));
  }
  console.log(JSON.stringify({
    dryRun: DRY_RUN,
    cycleCount: results.length,
    results,
  }, null, 2));
}

main().catch(error => {
  console.error(error.message || error);
  process.exit(1);
});
