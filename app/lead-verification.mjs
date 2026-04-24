function addHours(iso, hours) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) throw new Error('Invalid selection timestamp');
  return new Date(date.getTime() + hours * 60 * 60 * 1000).toISOString();
}

function buildPendingVerificationTransition({ leadId, selectedQuoteId, selectedContractorId, selectionTimestamp = new Date().toISOString() }) {
  return {
    leadId,
    newStatus: 'pending_verification',
    selectedQuoteId,
    selectedContractorId,
    selectionTimestamp,
    verificationWindowExpires: addHours(selectionTimestamp, 72),
    billingStatus: 'not_ready',
    reason: 'Homeowner selection moved to verification window',
    metadata: {
      source: 'homeowner-selection-verification',
      selected_quote_id: selectedQuoteId,
      selected_contractor_id: selectedContractorId,
    },
  };
}

function formatVerificationWindow(value) {
  if (!value) return 'Pending confirmation';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Pending confirmation';
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const LeadVerification = {
  addHours,
  buildPendingVerificationTransition,
  formatVerificationWindow,
};

if (typeof window !== 'undefined') {
  window.LeadVerification = LeadVerification;
}

export {
  addHours,
  buildPendingVerificationTransition,
  formatVerificationWindow,
};
