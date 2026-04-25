#!/usr/bin/env node

import { loadLocalSecrets } from './load-local-secrets.mjs';

loadLocalSecrets();

const TEST_KEY = process.env.STRIPE_TEST_SECRET_KEY || '';
const CONTRACTOR_ID = process.argv.find(arg => arg.startsWith('--contractor-id='))?.split('=')[1] || '';
const TEST_PAYMENT_METHOD = process.argv.find(arg => arg.startsWith('--payment-method='))?.split('=')[1] || 'pm_card_visa';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://uuaofdponevqwbfzwxtp.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function formEncode(data) {
  const params = new URLSearchParams();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== null && value !== undefined) params.append(key, String(value));
  });
  return params;
}

function dbHeaders() {
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  };
}

async function stripePost(path, body) {
  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TEST_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formEncode(body),
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) throw new Error(data?.error?.message || `${path} failed`);
  return data;
}

async function patchContractor(payload) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/contractors?id=eq.${CONTRACTOR_ID}`, {
    method: 'PATCH',
    headers: dbHeaders(),
    body: JSON.stringify(payload),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`contractor patch failed: ${text}`);
}

async function main() {
  if (!TEST_KEY) throw new Error('STRIPE_TEST_SECRET_KEY is required.');
  if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required.');
  if (!CONTRACTOR_ID) throw new Error('--contractor-id=<uuid> is required.');
  if (!TEST_PAYMENT_METHOD.startsWith('pm_')) throw new Error('--payment-method must be a Stripe payment method id, for example pm_card_visa');

  const customer = await stripePost('customers', {
    description: `NeighborlyWork fixture contractor ${CONTRACTOR_ID}`,
  });

  await stripePost(`payment_methods/${TEST_PAYMENT_METHOD}/attach`, {
    customer: customer.id,
  });

  await patchContractor({
    stripe_customer_id: customer.id,
    stripe_payment_method_id: TEST_PAYMENT_METHOD,
    payment_authorized: true,
    frozen_at: null,
    frozen_reason: null,
  });

  console.log(JSON.stringify({
    contractorId: CONTRACTOR_ID,
    stripeCustomerId: customer.id,
    stripePaymentMethodId: TEST_PAYMENT_METHOD,
  }, null, 2));
}

main().catch(error => {
  console.error(error.message || error);
  process.exit(1);
});
