import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildCheckoutSessionRequest,
  buildContractorBillingAuthorizationUpdate,
  normalizeBillingSetupOrigin,
  validateStripeSetupSession,
} from '../app/contractor-billing-setup.mjs';

test('normalizeBillingSetupOrigin trims trailing slashes and falls back to localhost', () => {
  assert.equal(normalizeBillingSetupOrigin('https://neighborlywork.com/'), 'https://neighborlywork.com');
  assert.equal(normalizeBillingSetupOrigin(''), 'http://127.0.0.1:8000');
  assert.equal(normalizeBillingSetupOrigin(null), 'http://127.0.0.1:8000');
});

test('buildCheckoutSessionRequest creates setup-mode Stripe checkout request with contractor metadata', () => {
  const request = buildCheckoutSessionRequest({
    customerId: 'cus_test_123',
    contractorId: 'contractor-1',
    origin: 'https://neighborlywork.com/',
  });

  assert.equal(request.path, 'checkout/sessions');
  assert.equal(request.form.mode, 'setup');
  assert.equal(request.form.customer, 'cus_test_123');
  assert.equal(request.form.currency, 'usd');
  assert.equal(request.form['payment_method_types[0]'], 'card');
  assert.equal(request.form.success_url, 'https://neighborlywork.com/app/contractor-billing-setup-complete.html?session_id={CHECKOUT_SESSION_ID}');
  assert.equal(request.form.cancel_url, 'https://neighborlywork.com/app/contractor-portal.html?billing_setup=cancelled');
  assert.equal(request.form['metadata[contractor_id]'], 'contractor-1');
  assert.equal(request.form['setup_intent_data[metadata][contractor_id]'], 'contractor-1');
});

test('validateStripeSetupSession rejects incomplete, metadata-missing, or cross-contractor sessions', () => {
  assert.throws(() => validateStripeSetupSession({ session: { status: 'open' }, contractorId: 'contractor-1' }), /not complete/i);
  assert.throws(() => validateStripeSetupSession({
    contractorId: 'contractor-1',
    session: {
      status: 'complete',
      customer: 'cus_test_123',
      setup_intent: { payment_method: 'pm_test_123' },
    },
  }), /missing contractor metadata/i);
  assert.throws(() => validateStripeSetupSession({
    contractorId: 'contractor-1',
    session: {
      status: 'complete',
      customer: 'cus_test_123',
      metadata: { contractor_id: 'contractor-2' },
      setup_intent: { payment_method: 'pm_test_123', metadata: { contractor_id: 'contractor-2' } },
    },
  }), /different contractor/i);
});

test('buildContractorBillingAuthorizationUpdate extracts customer and payment method and clears freeze state', () => {
  const update = buildContractorBillingAuthorizationUpdate({
    contractorId: 'contractor-1',
    session: {
      status: 'complete',
      customer: { id: 'cus_test_123' },
      metadata: { contractor_id: 'contractor-1' },
      setup_intent: {
        metadata: { contractor_id: 'contractor-1' },
        payment_method: { id: 'pm_test_123' },
      },
    },
  });

  assert.deepEqual(update, {
    stripe_customer_id: 'cus_test_123',
    stripe_payment_method_id: 'pm_test_123',
    payment_authorized: true,
    frozen_at: null,
    frozen_reason: null,
  });
});
