const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type JsonMap = Record<string, unknown>;

function json(body: JsonMap, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

function requiredEnv(name: string) {
  const value = Deno.env.get(name) || '';
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function formEncode(data: JsonMap) {
  const params = new URLSearchParams();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== null && value !== undefined) params.append(key, String(value));
  });
  return params;
}

function normalizeOrigin(rawOrigin: unknown) {
  const candidate = String(rawOrigin || '').trim();
  if (!candidate) return 'http://127.0.0.1:8000';
  return candidate.replace(/\/$/, '');
}

function buildCheckoutSessionForm({ customerId, contractorId, origin }: { customerId: string; contractorId: string; origin: unknown }) {
  if (!customerId) throw new Error('customerId is required.');
  if (!contractorId) throw new Error('contractorId is required.');
  const normalizedOrigin = normalizeOrigin(origin);
  return {
    mode: 'setup',
    customer: customerId,
    currency: 'usd',
    'payment_method_types[0]': 'card',
    success_url: `${normalizedOrigin}/app/contractor-billing-setup-complete.html?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${normalizedOrigin}/app/contractor-portal.html?billing_setup=cancelled`,
    'metadata[contractor_id]': contractorId,
    'setup_intent_data[metadata][contractor_id]': contractorId,
  };
}

function validateStripeSetupSession(session: any, contractorId: string) {
  if (String(session?.status || '').toLowerCase() !== 'complete') {
    throw new Error('Stripe setup session is not complete yet.');
  }
  const metadataContractorId = session?.metadata?.contractor_id || session?.setup_intent?.metadata?.contractor_id || '';
  if (metadataContractorId && metadataContractorId !== contractorId) {
    throw new Error('Stripe setup session belongs to a different contractor.');
  }
}

function buildContractorBillingAuthorizationUpdate(session: any, contractorId: string) {
  validateStripeSetupSession(session, contractorId);
  const customerId = typeof session?.customer === 'string' ? session.customer : session?.customer?.id;
  const paymentMethod = typeof session?.setup_intent?.payment_method === 'string'
    ? { id: session.setup_intent.payment_method }
    : session?.setup_intent?.payment_method;
  const paymentMethodId = paymentMethod?.id || '';
  if (!customerId) throw new Error('Stripe setup session customer missing.');
  if (!paymentMethodId) throw new Error('Stripe setup did not return a payment method.');
  return {
    stripe_customer_id: customerId,
    stripe_payment_method_id: paymentMethodId,
    payment_authorized: true,
    frozen_at: null,
    frozen_reason: null,
  };
}

async function stripeRequest(path: string, init: RequestInit = {}) {
  const stripeKey = requiredEnv('STRIPE_TEST_SECRET_KEY');
  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      ...(init.body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
      ...(init.headers || {}),
    },
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) throw new Error(data?.error?.message || `${path} failed`);
  return data;
}

function supabaseHeaders(serviceRoleKey: string) {
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  };
}

async function getAuthenticatedUser(req: Request, supabaseUrl: string, anonKey: string) {
  const authHeader = req.headers.get('Authorization') || '';
  if (!authHeader) throw new Error('Authorization header required.');
  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: anonKey, Authorization: authHeader },
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok || !data?.id) throw new Error(data?.msg || 'Authenticated contractor user required.');
  return data;
}

async function getContractor(serviceRoleKey: string, supabaseUrl: string, contractorId: string) {
  const response = await fetch(`${supabaseUrl}/rest/v1/contractors?id=eq.${contractorId}&select=*`, {
    headers: supabaseHeaders(serviceRoleKey),
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : [];
  if (!response.ok) throw new Error(`Failed to load contractor: ${text}`);
  if (!Array.isArray(data) || !data.length) throw new Error('Contractor record not found.');
  return data[0];
}

async function patchContractor(serviceRoleKey: string, supabaseUrl: string, contractorId: string, payload: JsonMap) {
  const response = await fetch(`${supabaseUrl}/rest/v1/contractors?id=eq.${contractorId}`, {
    method: 'PATCH',
    headers: supabaseHeaders(serviceRoleKey),
    body: JSON.stringify(payload),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Failed to update contractor billing profile: ${text}`);
}

async function createCustomerIfNeeded(contractor: JsonMap, contractorId: string) {
  if (contractor?.stripe_customer_id) return String(contractor.stripe_customer_id);
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ ok: false, error: 'Method not allowed.' }, 405);

  try {
    const supabaseUrl = requiredEnv('SUPABASE_URL');
    const supabaseAnonKey = requiredEnv('SUPABASE_ANON_KEY');
    const serviceRoleKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');
    const user = await getAuthenticatedUser(req, supabaseUrl, supabaseAnonKey);
    const contractor = await getContractor(serviceRoleKey, supabaseUrl, user.id);
    const body = await req.json();
    const action = String(body?.action || '');

    if (action === 'createCheckoutSession') {
      const customerId = await createCustomerIfNeeded(contractor, user.id);
      if (!contractor?.stripe_customer_id) {
        await patchContractor(serviceRoleKey, supabaseUrl, user.id, { stripe_customer_id: customerId });
      }
      const session = await stripeRequest('checkout/sessions', {
        method: 'POST',
        body: formEncode(buildCheckoutSessionForm({
          customerId,
          contractorId: user.id,
          origin: body?.origin || req.headers.get('origin'),
        })),
      });
      return json({ ok: true, checkoutUrl: session.url, customerId });
    }

    if (action === 'finalizeCheckout') {
      const sessionId = String(body?.checkoutSessionId || '').trim();
      if (!sessionId) throw new Error('checkoutSessionId is required.');
      const session = await stripeRequest(`checkout/sessions/${sessionId}?expand[]=setup_intent.payment_method`);
      const contractorUpdate = buildContractorBillingAuthorizationUpdate(session, user.id);
      await stripeRequest(`customers/${contractorUpdate.stripe_customer_id}`, {
        method: 'POST',
        body: formEncode({ 'invoice_settings[default_payment_method]': contractorUpdate.stripe_payment_method_id }),
      });
      await patchContractor(serviceRoleKey, supabaseUrl, user.id, contractorUpdate);
      return json({
        ok: true,
        contractorId: user.id,
        stripeCustomerId: contractorUpdate.stripe_customer_id,
        stripePaymentMethodId: contractorUpdate.stripe_payment_method_id,
        paymentAuthorized: true,
      });
    }

    return json({ ok: false, error: 'Unsupported action.' }, 400);
  } catch (error) {
    return json({ ok: false, error: error instanceof Error ? error.message : String(error) }, 400);
  }
});
