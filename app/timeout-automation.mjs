function parseTime(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isPast(value, nowIso) {
  const date = parseTime(value);
  const now = parseTime(nowIso);
  return Boolean(date && now && date.getTime() <= now.getTime());
}

function buildTimeoutAutomationPlan({ leads = [], changeOrders = [], quotes = [], nowIso = new Date().toISOString() }) {
  const leadUpdates = [];
  const changeOrderUpdates = [];
  const notificationEvents = [];

  for (const lead of leads) {
    const status = String(lead.status || '').toLowerCase();
    const leadQuotes = quotes.filter(q => q.lead_id === lead.id);

    if (status === 'matched_to_contractors' && lead.created_at && isPast(addHours(lead.created_at, 48), nowIso) && leadQuotes.some(q => q.status === 'submitted')) {
      leadUpdates.push({
        leadId: lead.id,
        newStatus: 'quotes_submitted',
        reason: 'Quote response window expired with at least one submitted quote',
        metadata: { source: 'timeout-automation', timeout_type: 'quote_window_48h' },
      });
      notificationEvents.push({ leadId: lead.id, eventType: 'quotes_ready' });
    }

    if (status === 'pending_verification' && isPast(lead.verification_window_expires, nowIso)) {
      leadUpdates.push({
        leadId: lead.id,
        newStatus: 'confirmed',
        reason: 'Verification window expired without dispute or change order',
        metadata: { source: 'timeout-automation', timeout_type: 'verification_window_72h' },
      });
      notificationEvents.push({ leadId: lead.id, eventType: 'manual_review_required' });
    }

    if (status === 'install_complete' && isPast(lead.dispute_window_expires, nowIso)) {
      leadUpdates.push({
        leadId: lead.id,
        newStatus: 'cleared',
        billingStatus: 'ready_for_cycle',
        reason: 'Dispute window expired after completed install',
        metadata: { source: 'timeout-automation', timeout_type: 'dispute_window_7d' },
      });
      notificationEvents.push({ leadId: lead.id, eventType: 'lead_cleared' });
    }
  }

  for (const changeOrder of changeOrders) {
    if (!changeOrder.resolved_at && isPast(changeOrder.response_window_expires, nowIso)) {
      changeOrderUpdates.push({
        changeOrderId: changeOrder.id,
        visibleToOtherContractors: false,
        reason: 'Competing response window expired',
      });
      notificationEvents.push({ leadId: changeOrder.lead_id, changeOrderId: changeOrder.id, eventType: 'manual_review_required' });
    }
  }

  return { leadUpdates, changeOrderUpdates, notificationEvents };
}

function addHours(iso, hours) {
  const date = parseTime(iso);
  if (!date) return null;
  return new Date(date.getTime() + hours * 60 * 60 * 1000).toISOString();
}

const TimeoutAutomation = { addHours, buildTimeoutAutomationPlan, isPast };
if (typeof window !== 'undefined') window.TimeoutAutomation = TimeoutAutomation;

export { addHours, buildTimeoutAutomationPlan, isPast };
