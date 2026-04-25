#!/usr/bin/env node

import {
  buildEmailDeliveryRequest,
  buildNotificationDeliveryFailureUpdate,
  buildNotificationDeliverySuccessUpdate,
  buildSmsDeliveryRequest,
  resolveDeliveryProviders,
  shouldAttemptNotificationDelivery,
} from '../app/notification-delivery.mjs';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://uuaofdponevqwbfzwxtp.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const DRY_RUN = process.argv.includes('--dry-run');
const LIMIT_ARG = process.argv.find(arg => arg.startsWith('--limit='));
const LIMIT = LIMIT_ARG ? Number(LIMIT_ARG.split('=')[1]) : null;

function ensureEnv() {
  const missing = [];
  if (!SUPABASE_URL) missing.push('SUPABASE_URL');
  if (!SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (missing.length) throw new Error(`Missing required environment variable(s): ${missing.join(', ')}`);
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
  if (!response.ok) throw new Error(`Supabase GET failed (${response.status}): ${text}`);
  return text ? JSON.parse(text) : [];
}

async function supabasePatch(table, query, payload) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    method: 'PATCH',
    headers: supabaseHeaders(),
    body: JSON.stringify(payload),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Supabase PATCH ${table} failed (${response.status}): ${text}`);
  return text ? JSON.parse(text) : [];
}

async function fetchNotifications() {
  const limitClause = LIMIT ? `&limit=${LIMIT}` : '';
  return supabaseGet(`notifications?channel=in.(sms,email)&status=in.(pending,failed)&order=created_at.asc${limitClause}`);
}

async function fetchUsers(userIds) {
  if (!userIds.length) return new Map();
  const rows = await supabaseGet(`users?id=in.(${userIds.join(',')})&select=id,full_name,email,phone`);
  return new Map((rows || []).map(user => [user.id, user]));
}

function formEncode(data) {
  const params = new URLSearchParams();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== null && value !== undefined) params.append(key, String(value));
  });
  return params;
}

async function sendTwilio(request) {
  const auth = Buffer.from(`${request.auth.username}:${request.auth.password}`).toString('base64');
  const response = await fetch(request.url, {
    method: request.method,
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formEncode(request.form),
  });
  const text = await response.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  if (!response.ok) {
    throw new Error(data?.message || data?.code || `twilio_http_${response.status}`);
  }
  return { providerMessageId: data.sid || null };
}

async function sendResend(request) {
  const response = await fetch(request.url, {
    method: request.method,
    headers: request.headers,
    body: JSON.stringify(request.json),
  });
  const text = await response.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  if (!response.ok) {
    throw new Error(data?.message || data?.error || `resend_http_${response.status}`);
  }
  return { providerMessageId: data.id || null };
}

async function processNotification(notification, user, providers) {
  const nowIso = new Date().toISOString();
  if (!shouldAttemptNotificationDelivery({ notification, nowIso })) {
    return { notificationId: notification.id, status: 'skipped', reason: 'not_due' };
  }

  const channel = String(notification.channel || '').toLowerCase();
  const provider = providers[channel];
  if (!provider) {
    const update = buildNotificationDeliveryFailureUpdate({
      notification,
      failureReason: `No configured provider for ${channel}`,
      nowIso,
    });
    if (!DRY_RUN) await supabasePatch('notifications', `id=eq.${notification.id}`, update);
    return { notificationId: notification.id, status: 'failed', reason: 'provider_missing' };
  }

  if (DRY_RUN) {
    return { notificationId: notification.id, status: 'dry_run', provider, channel, userId: notification.user_id };
  }

  try {
    let result;
    if (channel === 'sms') {
      result = await sendTwilio(buildSmsDeliveryRequest({ notification, user, env: process.env }));
    } else {
      result = await sendResend(buildEmailDeliveryRequest({ notification, user, env: process.env }));
    }
    const update = buildNotificationDeliverySuccessUpdate({
      notification,
      provider,
      providerMessageId: result.providerMessageId,
      nowIso,
    });
    await supabasePatch('notifications', `id=eq.${notification.id}`, update);
    return { notificationId: notification.id, status: 'sent', provider, channel };
  } catch (error) {
    const update = buildNotificationDeliveryFailureUpdate({
      notification,
      failureReason: error.message || 'delivery_failed',
      nowIso,
    });
    await supabasePatch('notifications', `id=eq.${notification.id}`, update);
    return { notificationId: notification.id, status: 'failed', provider, channel, reason: error.message || 'delivery_failed' };
  }
}

async function main() {
  ensureEnv();
  const providers = resolveDeliveryProviders(process.env);
  const notifications = await fetchNotifications();
  const userIds = [...new Set(notifications.map(item => item.user_id).filter(Boolean))];
  const users = await fetchUsers(userIds);
  const results = [];
  for (const notification of notifications) {
    results.push(await processNotification(notification, users.get(notification.user_id), providers));
  }
  console.log(JSON.stringify({ dryRun: DRY_RUN, notificationCount: notifications.length, providers, results }, null, 2));
}

main().catch(error => {
  console.error(error.message || error);
  process.exit(1);
});
