function buildNotificationRecord({ userId = null, leadId = null, quoteId = null, changeOrderId = null, billingCycleId = null, channel = 'portal', eventType, subject = null, body, payload = {}, scheduledFor = null }) {
  return {
    user_id: userId,
    lead_id: leadId,
    quote_id: quoteId,
    change_order_id: changeOrderId,
    billing_cycle_id: billingCycleId,
    channel,
    event_type: eventType,
    status: 'pending',
    subject,
    body,
    payload,
    scheduled_for: scheduledFor,
  };
}

function mapLifecycleEventType(newStatus) {
  const status = String(newStatus || '').toLowerCase();
  if (status === 'pending_verification') return 'verification_window_started';
  if (status === 'install_scheduled') return 'install_scheduled';
  if (status === 'install_complete') return 'install_complete';
  if (status === 'cleared') return 'lead_cleared';
  if (status === 'disputed' || status === 'cancelled' || status === 'change_order_open') return 'manual_review_required';
  return 'contractor_selected';
}

function buildLifecycleNotifications({ lead, newStatus, actorUserId = null }) {
  const notifications = [];
  const statusLabel = String(newStatus || '').replace(/_/g, ' ');
  const eventType = mapLifecycleEventType(newStatus);
  if (lead?.homeowner_id) {
    notifications.push(buildNotificationRecord({
      userId: lead.homeowner_id,
      leadId: lead.id,
      channel: 'portal',
      eventType,
      subject: `Your request is now ${statusLabel}`,
      body: `Your NeighborlyWork request moved to ${statusLabel}.`,
      payload: { lead_status: newStatus, actor_user_id: actorUserId },
    }));
  }
  if (lead?.selected_contractor_id) {
    notifications.push(buildNotificationRecord({
      userId: lead.selected_contractor_id,
      leadId: lead.id,
      channel: 'portal',
      eventType,
      subject: `Lead status updated to ${statusLabel}`,
      body: `A lead you are assigned to moved to ${statusLabel}.`,
      payload: { lead_status: newStatus, billing_status: lead.billing_status ?? null, actor_user_id: actorUserId },
    }));
  }
  return notifications;
}

function buildChangeOrderSubmissionNotifications({ lead, changeOrder, competingContractorIds = [] }) {
  const notifications = [];
  if (lead?.homeowner_id) {
    notifications.push(buildNotificationRecord({
      userId: lead.homeowner_id,
      leadId: lead.id,
      changeOrderId: changeOrder?.id || null,
      channel: 'portal',
      eventType: 'change_order_submitted',
      subject: 'Change order requires your review',
      body: 'Your selected contractor submitted a change order for this project.',
      payload: {
        revised_price: changeOrder?.revised_price ?? null,
        response_window_expires: changeOrder?.response_window_expires ?? null,
      },
    }));
  }
  for (const contractorId of competingContractorIds) {
    notifications.push(buildNotificationRecord({
      userId: contractorId,
      leadId: lead?.id || null,
      changeOrderId: changeOrder?.id || null,
      channel: 'portal',
      eventType: 'change_order_response_window_open',
      subject: 'Competing response window is open',
      body: 'A homeowner project is open for a competing change-order response.',
      payload: {
        response_window_expires: changeOrder?.response_window_expires ?? null,
      },
    }));
  }
  return notifications;
}

function buildChangeOrderResponseNotifications({ lead, changeOrder, response }) {
  const notifications = [];
  if (lead?.homeowner_id) {
    notifications.push(buildNotificationRecord({
      userId: lead.homeowner_id,
      leadId: lead.id,
      changeOrderId: changeOrder?.id || null,
      channel: 'portal',
      eventType: 'change_order_response_received',
      subject: 'A competing contractor responded',
      body: 'A competing bidder submitted an alternative response to your open change order.',
      payload: {
        response_id: response?.id || null,
        responding_contractor_id: response?.responding_contractor_id || null,
        response_type: response?.response_type || null,
        alternative_price: response?.alternative_price ?? null,
      },
    }));
  }
  return notifications;
}

const NotificationsQueue = {
  buildChangeOrderResponseNotifications,
  buildChangeOrderSubmissionNotifications,
  buildNotificationRecord,
  buildLifecycleNotifications,
  mapLifecycleEventType,
};
if (typeof window !== 'undefined') window.NotificationsQueue = NotificationsQueue;
export {
  buildChangeOrderResponseNotifications,
  buildChangeOrderSubmissionNotifications,
  buildNotificationRecord,
  buildLifecycleNotifications,
  mapLifecycleEventType,
};
