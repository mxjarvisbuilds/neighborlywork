#!/usr/bin/env node

import { randomUUID } from 'node:crypto';
import { loadLocalSecrets } from './load-local-secrets.mjs';
import { buildBillingCycles } from '../app/billing-cycle-prep.mjs';

loadLocalSecrets();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://uuaofdponevqwbfzwxtp.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const PREPARE_CYCLE = process.argv.includes('--prepare-cycle');
const USE_EXISTING_STRIPE_IDS = process.argv.includes('--use-existing-stripe');

function headers() {
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  };
}

async function insert(table, payload) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(payload),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`${table} insert failed (${response.status}): ${text}`);
  return text ? JSON.parse(text) : [];
}

async function patch(table, query, payload) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify(payload),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`${table} patch failed (${response.status}): ${text}`);
  return text ? JSON.parse(text) : [];
}

async function main() {
  if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required.');

  const stamp = Date.now();
  const contractorId = randomUUID();
  const homeownerId = randomUUID();
  const leadId = randomUUID();
  const baseZip = '95825';
  const serviceType = 'AC Installation';

  await insert('users', [{
    id: contractorId,
    email: `contractor+${stamp}@neighborlywork.test`,
    full_name: 'Fixture Contractor',
    phone: '+15555550101',
    role: 'contractor',
  }]);

  await insert('contractors', [{
    id: contractorId,
    business_name: 'Fixture HVAC Co',
    license_number: `TEST-${stamp}`,
    insured: true,
    service_zips: [baseZip],
    services: [serviceType],
    status: 'approved',
    payment_authorized: false,
    ...(USE_EXISTING_STRIPE_IDS ? {
      stripe_customer_id: process.env.STRIPE_TEST_CUSTOMER_ID || null,
      stripe_payment_method_id: process.env.STRIPE_TEST_PAYMENT_METHOD_ID || null,
      payment_authorized: Boolean(process.env.STRIPE_TEST_CUSTOMER_ID && process.env.STRIPE_TEST_PAYMENT_METHOD_ID),
    } : {}),
  }]);

  await insert('users', [{
    id: homeownerId,
    email: `homeowner+${stamp}@neighborlywork.test`,
    full_name: 'Fixture Homeowner',
    phone: '+15555550102',
    role: 'homeowner',
  }]);

  await insert('leads', [{
    id: leadId,
    homeowner_id: homeownerId,
    status: 'cleared',
    billing_status: 'ready_for_cycle',
    service_type: serviceType,
    zip_code: baseZip,
    address: '123 Fixture St, Sacramento, CA 95825',
    matched_contractors: [contractorId],
    selected_contractor_id: contractorId,
    selection_timestamp: new Date().toISOString(),
    install_complete_timestamp: new Date().toISOString(),
    billed_at: null,
  }]);

  let cycle = null;
  if (PREPARE_CYCLE) {
    const { cycles, assignments } = buildBillingCycles({
      leads: [{
        id: leadId,
        status: 'cleared',
        billing_status: 'ready_for_cycle',
        selected_contractor_id: contractorId,
      }],
      cycleEndDate: new Date().toISOString().slice(0, 10),
    });
    const inserted = await insert('billing_cycles', cycles);
    cycle = inserted[0] || null;
    if (cycle) {
      const assignment = assignments.find(item => item.contractor_id === contractorId);
      if (assignment?.lead_ids?.length) {
        await patch('leads', `id=in.(${assignment.lead_ids.join(',')})`, {
          billing_status: 'in_cycle',
          billing_cycle_id: cycle.id,
        });
      }
    }
  }

  console.log(JSON.stringify({
    contractorId,
    homeownerId,
    leadId,
    preparedCycleId: cycle?.id || null,
    stripeProfileAttached: Boolean(USE_EXISTING_STRIPE_IDS && process.env.STRIPE_TEST_CUSTOMER_ID && process.env.STRIPE_TEST_PAYMENT_METHOD_ID),
  }, null, 2));
}

main().catch(error => {
  console.error(error.message || error);
  process.exit(1);
});
