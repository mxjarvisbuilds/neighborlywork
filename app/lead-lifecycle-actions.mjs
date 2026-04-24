function addDays(iso, days) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) throw new Error('Invalid timestamp');
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}

const ACTIONS = {
  confirm_verification: {
    label: 'Confirm Verification',
    newStatus: 'confirmed',
    reason: 'Founder confirmed verification completed without change order',
  },
  open_change_order: {
    label: 'Open Change Order',
    newStatus: 'change_order_open',
    reason: 'Founder marked lead as change-order review in progress',
  },
  cancel_verification: {
    label: 'Cancel Lead',
    newStatus: 'cancelled',
    reason: 'Founder cancelled lead during verification',
  },
  confirm_change_order: {
    label: 'Confirm Change Order',
    newStatus: 'confirmed',
    reason: 'Founder confirmed accepted change-order outcome',
  },
  schedule_install: {
    label: 'Schedule Install',
    newStatus: 'install_scheduled',
    reason: 'Founder recorded install scheduling confirmation',
  },
  mark_install_complete: {
    label: 'Mark Install Complete',
    newStatus: 'install_complete',
    reason: 'Founder recorded completed install evidence path',
  },
  mark_disputed: {
    label: 'Mark Disputed',
    newStatus: 'disputed',
    reason: 'Founder recorded homeowner dispute during dispute window',
  },
  clear_install: {
    label: 'Clear Lead',
    newStatus: 'cleared',
    reason: 'Founder cleared completed install for billing cycle eligibility',
  },
  resolve_dispute_clear: {
    label: 'Resolve Dispute + Clear',
    newStatus: 'cleared',
    reason: 'Founder resolved dispute in favor of a chargeable cleared outcome',
  },
  cancel_dispute: {
    label: 'Cancel After Dispute',
    newStatus: 'cancelled',
    reason: 'Founder voided chargeable outcome after dispute review',
  },
};

const ACTIONS_BY_STATUS = {
  pending_verification: ['confirm_verification', 'open_change_order', 'cancel_verification'],
  change_order_open: ['confirm_change_order'],
  confirmed: ['schedule_install'],
  install_scheduled: ['mark_install_complete'],
  install_complete: ['mark_disputed', 'clear_install'],
  disputed: ['resolve_dispute_clear', 'cancel_dispute'],
};

function getLeadLifecycleActions(lead) {
  const status = String(lead?.status || '').toLowerCase();
  return (ACTIONS_BY_STATUS[status] || []).map(id => ({ id, ...ACTIONS[id] }));
}

function buildLeadLifecycleTransition({ actionId, lead, nowIso = new Date().toISOString() }) {
  const action = ACTIONS[actionId];
  if (!action) throw new Error(`Unknown lifecycle action: ${actionId}`);

  const base = {
    leadId: lead?.id,
    newStatus: action.newStatus,
    reason: action.reason,
    metadata: {
      source: 'founder-lead-inbox',
      action_id: actionId,
      previous_status: lead?.status || null,
    },
    selectionTimestamp: null,
    verificationWindowExpires: null,
    installCompleteTimestamp: null,
    disputeWindowExpires: null,
    billingStatus: null,
  };

  if (actionId === 'mark_install_complete') {
    base.installCompleteTimestamp = nowIso;
    base.disputeWindowExpires = addDays(nowIso, 7);
    base.billingStatus = 'not_ready';
  }

  if (actionId === 'clear_install' || actionId === 'resolve_dispute_clear') {
    base.billingStatus = 'ready_for_cycle';
  }

  if (actionId === 'cancel_dispute') {
    base.billingStatus = 'waived';
  }

  return base;
}

const LeadLifecycleActions = {
  addDays,
  buildLeadLifecycleTransition,
  getLeadLifecycleActions,
};

if (typeof window !== 'undefined') {
  window.LeadLifecycleActions = LeadLifecycleActions;
}

export {
  addDays,
  buildLeadLifecycleTransition,
  getLeadLifecycleActions,
};
