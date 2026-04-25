#!/usr/bin/env node

import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { loadLocalSecrets } from './load-local-secrets.mjs';

loadLocalSecrets();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://uuaofdponevqwbfzwxtp.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || readAnonKeyFromAppConfig();
const EMAIL = process.argv.find(arg => arg.startsWith('--email='))?.split('=')[1]
  || `contractor-billing+${Date.now()}@neighborlywork.test`;
const PASSWORD = process.argv.find(arg => arg.startsWith('--password='))?.split('=')[1]
  || `NeighborlyWork-${randomUUID().slice(0, 8)}!`;

function readAnonKeyFromAppConfig() {
  const text = readFileSync(new URL('../app/supabase-config.js', import.meta.url), 'utf8');
  const match = text.match(/SUPABASE_ANON_KEY\s*=\s*\n\s*'([^']+)'/);
  return match?.[1] || '';
}

function serviceHeaders(prefer = 'return=representation') {
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    ...(prefer ? { Prefer: prefer } : {}),
  };
}

function anonHeaders() {
  return {
    apikey: SUPABASE_ANON_KEY,
    'Content-Type': 'application/json',
  };
}

async function supabaseJson(path, init = {}) {
  const response = await fetch(`${SUPABASE_URL}${path}`, init);
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const message = data?.msg || data?.message || data?.error_description || text || `${path} failed`;
    throw new Error(message);
  }
  return data;
}

async function findAuthUserByEmail(email) {
  const data = await supabaseJson(`/auth/v1/admin/users?per_page=1000`, {
    headers: serviceHeaders(null),
  });
  const users = Array.isArray(data?.users) ? data.users : [];
  return users.find(user => String(user.email || '').toLowerCase() === email.toLowerCase()) || null;
}

async function upsertAuthUser() {
  const existing = await findAuthUserByEmail(EMAIL);
  if (existing?.id) {
    const updated = await supabaseJson(`/auth/v1/admin/users/${existing.id}`, {
      method: 'PUT',
      headers: serviceHeaders(null),
      body: JSON.stringify({
        email: EMAIL,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { role: 'contractor', fixture: 'contractor-billing-authorization' },
      }),
    });
    return updated;
  }
  return supabaseJson('/auth/v1/admin/users', {
    method: 'POST',
    headers: serviceHeaders(null),
    body: JSON.stringify({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { role: 'contractor', fixture: 'contractor-billing-authorization' },
    }),
  });
}

async function upsertTable(table, payload) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?on_conflict=id`, {
    method: 'POST',
    headers: serviceHeaders('resolution=merge-duplicates,return=representation'),
    body: JSON.stringify(payload),
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : [];
  if (!response.ok) throw new Error(`${table} upsert failed (${response.status}): ${text}`);
  return Array.isArray(data) ? data[0] : data;
}

async function signInForAccessToken() {
  const data = await supabaseJson('/auth/v1/token?grant_type=password', {
    method: 'POST',
    headers: anonHeaders(),
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!data?.access_token) throw new Error('Fixture sign-in did not return an access token.');
  return data;
}

async function main() {
  if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required.');
  if (!SUPABASE_ANON_KEY) throw new Error('SUPABASE_ANON_KEY is required.');

  const authUser = await upsertAuthUser();
  const contractorId = authUser.id;
  if (!contractorId) throw new Error('Supabase Auth user id missing.');

  await upsertTable('users', {
    id: contractorId,
    email: EMAIL,
    full_name: 'Billing Fixture Contractor',
    phone: '+155****0201',
    role: 'contractor',
  });

  await upsertTable('contractors', {
    id: contractorId,
    business_name: 'Billing Fixture HVAC Co',
    license_number: `BILLING-${Date.now()}`,
    insured: true,
    service_zips: ['95825'],
    services: ['AC Installation'],
    status: 'approved',
    stripe_customer_id: null,
    stripe_payment_method_id: null,
    payment_authorized: false,
    frozen_at: null,
    frozen_reason: null,
  });

  const session = await signInForAccessToken();

  console.log(JSON.stringify({
    contractorId,
    email: EMAIL,
    password: PASSWORD,
    accessTokenPresent: Boolean(session.access_token),
    refreshTokenPresent: Boolean(session.refresh_token),
  }, null, 2));
}

main().catch(error => {
  console.error(error.message || error);
  process.exit(1);
});
