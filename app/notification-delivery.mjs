const MAX_NOTIFICATION_DELIVERY_ATTEMPTS = 3;
const RETRY_DELAYS_MINUTES = [5, 15, 60];

function addMinutes(iso, minutes) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) throw new Error('Invalid timestamp');
  return new Date(date.getTime() + minutes * 60 * 1000).toISOString();
}

function resolveDeliveryProviders(env = {}) {
  const sms = env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_FROM_NUMBER ? 'twilio' : null;
  const email = env.RESEND_API_KEY && env.RESEND_FROM_EMAIL ? 'resend' : null;
  return { sms, email };
}

function getDeliveryAttemptCount(notification) {
  return Number(notification?.payload?.delivery_attempts || 0);
}

function shouldAttemptNotificationDelivery({ notification, nowIso = new Date().toISOString() }) {
  const status = String(notification?.status || '').toLowerCase();
  if (!['pending', 'failed'].includes(status)) return false;
  const attempts = getDeliveryAttemptCount(notification);
  if (status === 'failed' && attempts >= MAX_NOTIFICATION_DELIVERY_ATTEMPTS) return false;
  if (!notification?.scheduled_for) return true;
  return new Date(notification.scheduled_for).getTime() <= new Date(nowIso).getTime();
}

function buildSmsDeliveryRequest({ notification, user, env }) {
  if (!user?.phone) throw new Error('Recipient phone is required for SMS delivery.');
  if (!env?.TWILIO_ACCOUNT_SID || !env?.TWILIO_AUTH_TOKEN || !env?.TWILIO_FROM_NUMBER) {
    throw new Error('Missing Twilio configuration.');
  }
  return {
    provider: 'twilio',
    url: `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`,
    method: 'POST',
    auth: {
      username: env.TWILIO_ACCOUNT_SID,
      password: env.TWILIO_AUTH_TOKEN,
    },
    form: {
      To: user.phone,
      From: env.TWILIO_FROM_NUMBER,
      Body: notification.body,
    },
  };
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildEmailDeliveryRequest({ notification, user, env }) {
  if (!user?.email) throw new Error('Recipient email is required for email delivery.');
  if (!env?.RESEND_API_KEY || !env?.RESEND_FROM_EMAIL) {
    throw new Error('Missing Resend configuration.');
  }
  return {
    provider: 'resend',
    url: 'https://api.resend.com/emails',
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    json: {
      from: env.RESEND_FROM_EMAIL,
      to: user.email,
      subject: notification.subject || 'NeighborlyWork update',
      html: `<p>Hello ${escapeHtml(user.full_name || 'there')},</p><p>${escapeHtml(notification.body)}</p>`,
    },
  };
}

function buildNotificationDeliverySuccessUpdate({ notification, provider, providerMessageId = null, nowIso = new Date().toISOString() }) {
  return {
    status: 'sent',
    sent_at: nowIso,
    failed_at: null,
    failure_reason: null,
    scheduled_for: null,
    payload: {
      ...(notification?.payload || {}),
      delivery_attempts: Math.max(1, getDeliveryAttemptCount(notification)),
      delivery_provider: provider,
      provider_message_id: providerMessageId,
    },
  };
}

function buildNotificationDeliveryFailureUpdate({ notification, failureReason, nowIso = new Date().toISOString() }) {
  const nextAttempts = getDeliveryAttemptCount(notification) + 1;
  const finalFailure = nextAttempts >= MAX_NOTIFICATION_DELIVERY_ATTEMPTS;
  return {
    status: 'failed',
    failed_at: nowIso,
    failure_reason: failureReason,
    scheduled_for: finalFailure ? null : addMinutes(nowIso, RETRY_DELAYS_MINUTES[Math.min(nextAttempts - 1, RETRY_DELAYS_MINUTES.length - 1)]),
    payload: {
      ...(notification?.payload || {}),
      delivery_attempts: nextAttempts,
      last_failure_reason: failureReason,
    },
  };
}

const NotificationDelivery = {
  MAX_NOTIFICATION_DELIVERY_ATTEMPTS,
  buildEmailDeliveryRequest,
  escapeHtml,
  buildNotificationDeliveryFailureUpdate,
  buildNotificationDeliverySuccessUpdate,
  buildSmsDeliveryRequest,
  resolveDeliveryProviders,
  shouldAttemptNotificationDelivery,
};

if (typeof window !== 'undefined') {
  window.NotificationDelivery = NotificationDelivery;
}

export {
  MAX_NOTIFICATION_DELIVERY_ATTEMPTS,
  buildEmailDeliveryRequest,
  escapeHtml,
  buildNotificationDeliveryFailureUpdate,
  buildNotificationDeliverySuccessUpdate,
  buildSmsDeliveryRequest,
  resolveDeliveryProviders,
  shouldAttemptNotificationDelivery,
};
