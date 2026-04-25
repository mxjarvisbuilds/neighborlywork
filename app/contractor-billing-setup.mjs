function normalizeBillingSetupOrigin(rawOrigin) {
  const candidate = String(rawOrigin || '').trim();
  if (!candidate) return 'http://127.0.0.1:8000';
  return candidate.replace(/\/$/, '');
}

function buildCheckoutSessionRequest({ customerId, contractorId, origin }) {
  if (!customerId) throw new Error('customerId is required.');
  if (!contractorId) throw new Error('contractorId is required.');
  const normalizedOrigin = normalizeBillingSetupOrigin(origin);
  return {
    path: 'checkout/sessions',
    form: {
      mode: 'setup',
      customer: customerId,
      currency: 'usd',
      'payment_method_types[0]': 'card',
      success_url: `${normalizedOrigin}/app/contractor-billing-setup-complete.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${normalizedOrigin}/app/contractor-portal.html?billing_setup=cancelled`,
      'metadata[contractor_id]': contractorId,
      'setup_intent_data[metadata][contractor_id]': contractorId,
    },
  };
}

function validateStripeSetupSession({ session, contractorId }) {
  if (!contractorId) throw new Error('contractorId is required.');
  if (String(session?.status || '').toLowerCase() !== 'complete') {
    throw new Error('Stripe setup session is not complete yet.');
  }
  const metadataContractorId = session?.metadata?.contractor_id || session?.setup_intent?.metadata?.contractor_id || '';
  if (!metadataContractorId) {
    throw new Error('Stripe setup session missing contractor metadata.');
  }
  if (metadataContractorId !== contractorId) {
    throw new Error('Stripe setup session belongs to a different contractor.');
  }
}

function extractStripeCustomerId(session) {
  return typeof session?.customer === 'string' ? session.customer : session?.customer?.id;
}

function extractStripePaymentMethodId(session) {
  const paymentMethod = typeof session?.setup_intent?.payment_method === 'string'
    ? { id: session.setup_intent.payment_method }
    : session?.setup_intent?.payment_method;
  return paymentMethod?.id || '';
}

function buildContractorBillingAuthorizationUpdate({ session, contractorId }) {
  validateStripeSetupSession({ session, contractorId });
  const customerId = extractStripeCustomerId(session);
  const paymentMethodId = extractStripePaymentMethodId(session);
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

const ContractorBillingSetup = {
  buildCheckoutSessionRequest,
  buildContractorBillingAuthorizationUpdate,
  normalizeBillingSetupOrigin,
  validateStripeSetupSession,
};

if (typeof window !== 'undefined') {
  window.ContractorBillingSetup = ContractorBillingSetup;
}

export {
  buildCheckoutSessionRequest,
  buildContractorBillingAuthorizationUpdate,
  normalizeBillingSetupOrigin,
  validateStripeSetupSession,
};
