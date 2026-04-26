import test from 'node:test';
import assert from 'node:assert/strict';

import {
  MAX_NOTIFICATION_DELIVERY_ATTEMPTS,
  buildEmailDeliveryRequest,
  escapeHtml,
  isAllowedSenderEmail,
  buildNotificationDeliveryFailureUpdate,
  buildNotificationDeliverySuccessUpdate,
  buildSmsDeliveryRequest,
  resolveDeliveryProviders,
  shouldAttemptNotificationDelivery,
} from '../app/notification-delivery.mjs';

test('resolveDeliveryProviders selects Twilio for SMS and Resend for email when credentials are present', () => {
  const providers = resolveDeliveryProviders({
    TWILIO_ACCOUNT_SID: 'sid',
    TWILIO_AUTH_TOKEN: 'token',
    TWILIO_FROM_NUMBER: '+155****0000',
    RESEND_API_KEY: 're_123',
    RESEND_FROM_EMAIL: 'NeighborlyWork <notifications@neighborlywork.com>',
  });

  assert.equal(providers.sms, 'twilio');
  assert.equal(providers.email, 'resend');
});

test('resolveDeliveryProviders refuses Resend when sender is not aligned to neighborlywork.com', () => {
  assert.equal(isAllowedSenderEmail('NeighborlyWork <notifications@neighborlywork.com>'), true);
  assert.equal(isAllowedSenderEmail('ops@neighborlywork.com'), true);
  assert.equal(isAllowedSenderEmail('neighborlywork@gmail.com'), false);

  const providers = resolveDeliveryProviders({
    RESEND_API_KEY: 're_123',
    RESEND_FROM_EMAIL: 'neighborlywork@gmail.com',
  });

  assert.equal(providers.email, null);
});

test('shouldAttemptNotificationDelivery only allows pending or retryable failed notifications scheduled for now or earlier', () => {
  assert.equal(shouldAttemptNotificationDelivery({
    notification: { status: 'pending', scheduled_for: null },
    nowIso: '2026-05-15T12:00:00.000Z',
  }), true);

  assert.equal(shouldAttemptNotificationDelivery({
    notification: { status: 'failed', scheduled_for: '2026-05-15T13:00:00.000Z', payload: { delivery_attempts: 1 } },
    nowIso: '2026-05-15T12:00:00.000Z',
  }), false);

  assert.equal(shouldAttemptNotificationDelivery({
    notification: { status: 'failed', scheduled_for: '2026-05-15T11:00:00.000Z', payload: { delivery_attempts: 1 } },
    nowIso: '2026-05-15T12:00:00.000Z',
  }), true);

  assert.equal(shouldAttemptNotificationDelivery({
    notification: { status: 'failed', scheduled_for: '2026-05-15T11:00:00.000Z', payload: { delivery_attempts: 3 } },
    nowIso: '2026-05-15T12:00:00.000Z',
  }), false);
});

test('buildSmsDeliveryRequest produces a Twilio messages API request for sms notifications', () => {
  const request = buildSmsDeliveryRequest({
    notification: { id: 'notif-1', body: 'Install scheduled tomorrow.' },
    user: { phone: '+15551235555' },
    env: {
      TWILIO_ACCOUNT_SID: 'AC123',
      TWILIO_AUTH_TOKEN: 'secret',
      TWILIO_FROM_NUMBER: '+15551230000',
    },
  });

  assert.match(request.url, /Messages\.json$/);
  assert.equal(request.method, 'POST');
  assert.equal(request.auth.username, 'AC123');
  assert.equal(request.form.To, '+15551235555');
  assert.equal(request.form.From, '+15551230000');
  assert.equal(request.form.Body, 'Install scheduled tomorrow.');
});

test('buildEmailDeliveryRequest produces a Resend send-email request for email notifications', () => {
  const request = buildEmailDeliveryRequest({
    notification: { id: 'notif-1', subject: 'Billing cycle pending', body: 'A new billing cycle is ready.' },
    user: { email: 'contractor@example.com', full_name: 'ACME HVAC' },
    env: {
      RESEND_API_KEY: 're_123',
      RESEND_FROM_EMAIL: 'NeighborlyWork <notifications@neighborlywork.com>',
      RESEND_REPLY_TO_EMAIL: 'support@neighborlywork.com',
      EMAIL_FOOTER_ADDRESS: 'Sacramento, CA',
    },
  });

  assert.equal(request.url, 'https://api.resend.com/emails');
  assert.equal(request.method, 'POST');
  assert.equal(request.headers.Authorization, 'Bearer re_123');
  assert.equal(request.json.to, 'contractor@example.com');
  assert.equal(request.json.from, 'NeighborlyWork <notifications@neighborlywork.com>');
  assert.equal(request.json.reply_to, 'support@neighborlywork.com');
  assert.equal(request.json.headers['List-Unsubscribe'], '<mailto:support%40neighborlywork.com?subject=unsubscribe>');
  assert.equal(request.json.subject, 'Billing cycle pending');
  assert.match(request.json.text, /A new billing cycle is ready\./);
  assert.match(request.json.text, /Reply unsubscribe/);
  assert.match(request.json.html, /ACME HVAC/);
});

test('buildEmailDeliveryRequest rejects off-domain sender addresses before Resend send', () => {
  assert.throws(() => buildEmailDeliveryRequest({
    notification: { id: 'notif-1', subject: 'Bad sender', body: 'Body' },
    user: { email: 'contractor@example.com', full_name: 'ACME HVAC' },
    env: {
      RESEND_API_KEY: 're_123',
      RESEND_FROM_EMAIL: 'neighborlywork@gmail.com',
    },
  }), /RESEND_FROM_EMAIL must use neighborlywork\.com/);
});

test('buildEmailDeliveryRequest rejects off-domain reply-to addresses before Resend send', () => {
  assert.throws(() => buildEmailDeliveryRequest({
    notification: { id: 'notif-1', subject: 'Bad reply-to', body: 'Body' },
    user: { email: 'contractor@example.com', full_name: 'ACME HVAC' },
    env: {
      RESEND_API_KEY: 're_123',
      RESEND_FROM_EMAIL: 'NeighborlyWork <notifications@neighborlywork.com>',
      RESEND_REPLY_TO_EMAIL: 'support@gmail.com',
    },
  }), /RESEND_REPLY_TO_EMAIL must use neighborlywork\.com/);
});

test('buildEmailDeliveryRequest escapes user-controlled HTML fields', () => {
  const request = buildEmailDeliveryRequest({
    notification: { id: 'notif-1', subject: 'Unsafe input', body: '<img src=x onerror=alert(1)>' },
    user: { email: 'contractor@example.com', full_name: '<b>Bad Name</b>' },
    env: {
      RESEND_API_KEY: 're_123',
      RESEND_FROM_EMAIL: 'NeighborlyWork <notifications@neighborlywork.com>',
    },
  });

  assert.equal(escapeHtml('<b>Bad Name</b>'), '&lt;b&gt;Bad Name&lt;/b&gt;');
  assert.doesNotMatch(request.json.html, /<img/);
  assert.doesNotMatch(request.json.html, /<b>Bad Name<\/b>/);
  assert.match(request.json.html, /&lt;img src=x onerror=alert\(1\)&gt;/);
});

test('buildNotificationDeliverySuccessUpdate marks notifications sent with provider metadata', () => {
  const update = buildNotificationDeliverySuccessUpdate({
    notification: { id: 'notif-1', payload: { delivery_attempts: 1 } },
    provider: 'twilio',
    providerMessageId: 'SM123',
    nowIso: '2026-05-15T12:00:00.000Z',
  });

  assert.equal(update.status, 'sent');
  assert.equal(update.sent_at, '2026-05-15T12:00:00.000Z');
  assert.equal(update.failed_at, null);
  assert.equal(update.payload.delivery_provider, 'twilio');
  assert.equal(update.payload.provider_message_id, 'SM123');
});

test('buildNotificationDeliveryFailureUpdate schedules retry before max attempts and leaves final failures unscheduled', () => {
  const retry = buildNotificationDeliveryFailureUpdate({
    notification: { id: 'notif-1', payload: { delivery_attempts: 1 } },
    failureReason: 'provider timeout',
    nowIso: '2026-05-15T12:00:00.000Z',
  });

  assert.equal(MAX_NOTIFICATION_DELIVERY_ATTEMPTS, 3);
  assert.equal(retry.status, 'failed');
  assert.equal(retry.failed_at, '2026-05-15T12:00:00.000Z');
  assert.equal(retry.scheduled_for, '2026-05-15T12:15:00.000Z');
  assert.equal(retry.payload.delivery_attempts, 2);

  const finalFailure = buildNotificationDeliveryFailureUpdate({
    notification: { id: 'notif-1', payload: { delivery_attempts: 2 } },
    failureReason: 'invalid recipient',
    nowIso: '2026-05-15T12:00:00.000Z',
  });

  assert.equal(finalFailure.payload.delivery_attempts, 3);
  assert.equal(finalFailure.scheduled_for, null);
});
