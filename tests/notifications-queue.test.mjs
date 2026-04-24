import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildChangeOrderResponseNotifications,
  buildChangeOrderSubmissionNotifications,
  buildLifecycleNotifications,
  buildNotificationRecord,
} from '../app/notifications-queue.mjs';

test('buildNotificationRecord creates a pending notification payload tied to a lead target', () => {
  const record = buildNotificationRecord({
    userId: 'user-1',
    leadId: 'lead-1',
    channel: 'portal',
    eventType: 'verification_window_started',
    subject: 'Lead confirmed',
    body: 'Your install has been confirmed.',
    payload: { lead_status: 'confirmed' },
  });

  assert.equal(record.user_id, 'user-1');
  assert.equal(record.lead_id, 'lead-1');
  assert.equal(record.channel, 'portal');
  assert.equal(record.event_type, 'verification_window_started');
  assert.equal(record.status, 'pending');
  assert.equal(record.payload.lead_status, 'confirmed');
});

test('buildLifecycleNotifications queues homeowner and contractor notifications for a cleared lead', () => {
  const lead = {
    id: 'lead-1',
    homeowner_id: 'homeowner-1',
    selected_contractor_id: 'contractor-1',
    billing_status: 'ready_for_cycle',
  };

  const notifications = buildLifecycleNotifications({
    lead,
    newStatus: 'cleared',
    actorUserId: 'admin-1',
  });

  assert.equal(notifications.length, 2);
  assert.equal(notifications[0].status, 'pending');
  assert.equal(notifications[0].lead_id, 'lead-1');
  assert.equal(notifications.some(item => item.user_id === 'homeowner-1'), true);
  assert.equal(notifications.some(item => item.user_id === 'contractor-1'), true);
  assert.equal(notifications.every(item => item.event_type === 'lead_cleared'), true);
});

test('buildChangeOrderSubmissionNotifications queues homeowner review plus competing bidder window-open notifications', () => {
  const notifications = buildChangeOrderSubmissionNotifications({
    lead: { id: 'lead-1', homeowner_id: 'homeowner-1' },
    changeOrder: { id: 'change-order-1', revised_price: 13850, response_window_expires: '2026-05-03T16:00:00.000Z' },
    competingContractorIds: ['contractor-a', 'contractor-b'],
  });

  assert.equal(notifications.length, 3);
  assert.equal(notifications[0].event_type, 'change_order_submitted');
  assert.equal(notifications.filter(item => item.event_type === 'change_order_response_window_open').length, 2);
  assert.equal(notifications.some(item => item.user_id === 'homeowner-1'), true);
});

test('buildChangeOrderResponseNotifications alerts the homeowner when a competing bidder responds', () => {
  const notifications = buildChangeOrderResponseNotifications({
    lead: { id: 'lead-1', homeowner_id: 'homeowner-1' },
    changeOrder: { id: 'change-order-1' },
    response: { id: 'response-1', responding_contractor_id: 'contractor-b', response_type: 'can_do_lower_price', alternative_price: 12950 },
  });

  assert.equal(notifications.length, 1);
  assert.equal(notifications[0].user_id, 'homeowner-1');
  assert.equal(notifications[0].event_type, 'change_order_response_received');
  assert.equal(notifications[0].change_order_id, 'change-order-1');
  assert.equal(notifications[0].payload.response_id, 'response-1');
});
