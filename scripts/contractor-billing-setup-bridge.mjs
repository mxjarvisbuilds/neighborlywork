import http from 'node:http';
import { URL } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import {
  buildCheckoutSessionRequest,
  buildContractorBillingAuthorizationUpdate,
} from '../app/contractor-billing-setup.mjs';

const PORT = Number(process.env.PORT || 8787);
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://uuaofdponevqwbfzwxtp.supabase.co';

function readLocalSecrets() {
  const secretsPath = path.join(os.homedir(), '.jarvis', 'secrets.env');
  if (!fs.existsSync(secretsPath)) return {};
  const out = {};
  for (const raw of fs.readFileSync(secretsPath, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const idx = line.indexOf('=');
    out[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return out;
}

function readAnonKeyFromAppConfig() {
  const configPath = path.join(process.cwd(), 'app', 'supabase-config.js');
  const text = fs.readFileSync(configPath, 'utf8');
  const match = text.match(/SUPABASE_ANON_KEY\s*=\s*\n\s*'([^']+)'/);
  return match?.[1] || '';
}

const localSecrets = readLocalSecrets();
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || readAnonKeyFromAppConfig();
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || localSecrets.SUPABASE_SERVICE_ROLE_KEY;
const STRIPE_TEST_SECRET_KEY = process.env.STRIPE_TEST_SECRET_KEY || localSecrets.STRIPE_TEST_SECRET_KEY;

for (const [name, value] of Object.entries({ SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, STRIPE_TEST_SECRET_KEY })) {
  if (!value) {
    console.error(`${name} is required.`);
    process.exit(1);
  }
}

function send(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  });
  res.end(JSON.stringify(body));
}

function formEncode(data) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && value !== null) params.append(key, String(value));
  }
  return params;
}

async function stripeRequest(path, init = {}) {
  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${STRIPE_TEST_SECRET_KEY}`,
      ...(init.body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
      ...(init.headers || {}),
    },
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) throw new Error(data?.error?.message || `${path} failed`);
  return data;
}

async function getUser(authorization) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: authorization,
    },
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok || !data?.id) throw new Error(data?.msg || 'Authenticated contractor user required.');
  return data;
}

async function getContractor(contractorId) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/contractors?id=eq.${contractorId}&select=*`, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : [];
  if (!response.ok) throw new Error(`Failed to load contractor: ${text}`);
  if (!Array.isArray(data) || !data.length) throw new Error('Contractor record not found.');
  return data[0];
}

async function patchContractor(contractorId, payload) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/contractors?id=eq.${contractorId}`, {
    method: 'PATCH',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(payload),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Failed to update contractor billing profile: ${text}`);
}

async function createCustomerIfNeeded(contractor, contractorId) {
  if (contractor?.stripe_customer_id) return contractor.stripe_customer_id;
  const customer = await stripeRequest('customers', {
    method: 'POST',
    body: formEncode({
      description: `NeighborlyWork contractor ${contractorId}`,
      'metadata[contractor_id]': contractorId,
      name: contractor?.business_name || contractorId,
    }),
  });
  return customer.id;
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 200, { ok: true });
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (req.method !== 'POST' || url.pathname !== '/contractor-billing-setup') {
    return send(res, 404, { ok: false, error: 'Not found.' });
  }

  try {
    const authorization = req.headers.authorization || '';
    if (!authorization) throw new Error('Authorization header required.');
    const user = await getUser(authorization);
    const contractor = await getContractor(user.id);

    let raw = '';
    for await (const chunk of req) raw += chunk;
    const body = raw ? JSON.parse(raw) : {};
    const action = String(body.action || '');

    if (action === 'createCheckoutSession') {
      const customerId = await createCustomerIfNeeded(contractor, user.id);
      if (!contractor?.stripe_customer_id) {
        await patchContractor(user.id, { stripe_customer_id: customerId });
      }
      const request = buildCheckoutSessionRequest({
        customerId,
        contractorId: user.id,
        origin: body.origin,
      });
      const session = await stripeRequest(request.path, {
        method: 'POST',
        body: formEncode(request.form),
      });
      return send(res, 200, { ok: true, checkoutUrl: session.url, customerId });
    }

    if (action === 'finalizeCheckout') {
      const sessionId = String(body.checkoutSessionId || '').trim();
      if (!sessionId) throw new Error('checkoutSessionId is required.');
      const session = await stripeRequest(`checkout/sessions/${sessionId}?expand[]=setup_intent.payment_method`);
      const contractorUpdate = buildContractorBillingAuthorizationUpdate({
        session,
        contractorId: user.id,
      });
      await stripeRequest(`customers/${contractorUpdate.stripe_customer_id}`, {
        method: 'POST',
        body: formEncode({ 'invoice_settings[default_payment_method]': contractorUpdate.stripe_payment_method_id }),
      });
      await patchContractor(user.id, contractorUpdate);
      return send(res, 200, {
        ok: true,
        paymentAuthorized: true,
        stripeCustomerId: contractorUpdate.stripe_customer_id,
        stripePaymentMethodId: contractorUpdate.stripe_payment_method_id,
      });
    }

    return send(res, 400, { ok: false, error: 'Unsupported action.' });
  } catch (error) {
    return send(res, 400, { ok: false, error: error instanceof Error ? error.message : String(error) });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`contractor billing setup bridge listening on http://127.0.0.1:${PORT}`);
});
