import { addHours } from './lead-verification.mjs';

const CHANGE_ORDER_RESPONSE_WINDOW_HOURS = 48;
const OPEN_RESPONSE_QUOTE_STATUSES = new Set(['submitted', 'rejected']);

function normalizePrice(value, fieldName) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) {
    throw new Error(`${fieldName} must be a non-negative number.`);
  }
  return Number(numeric.toFixed(2));
}

function requireValue(value, fieldName) {
  if (value === undefined || value === null || value === '') {
    throw new Error(`${fieldName} is required.`);
  }
  return value;
}

function computeResponseWindowExpires(submittedAt) {
  return addHours(requireValue(submittedAt, 'submittedAt'), CHANGE_ORDER_RESPONSE_WINDOW_HOURS);
}

function getOriginalQuotePrice(quote) {
  if (quote?.price_total !== undefined && quote?.price_total !== null) return quote.price_total;
  if (quote?.total_price !== undefined && quote?.total_price !== null) return quote.total_price;
  throw new Error('Selected quote must include an original price.');
}

function buildChangeOrderSubmission({
  lead,
  quote,
  contractorId,
  revisedPrice,
  reasonCategory,
  reasonDescription,
  needType,
  submittedAt = new Date().toISOString(),
  createdBy = null,
  visibleToOtherContractors = true,
}) {
  if (!lead?.id) throw new Error('lead.id is required.');
  if (!quote?.id) throw new Error('quote.id is required.');
  if (lead.status !== 'pending_verification' && lead.status !== 'change_order_open') {
    throw new Error('Change orders may only be submitted while a lead is pending verification or already in change-order review.');
  }
  if (lead.selected_contractor_id !== contractorId) {
    throw new Error('Only the selected contractor may submit a change order.');
  }
  if (quote.lead_id !== lead.id) {
    throw new Error('Selected quote must belong to the same lead.');
  }
  if (quote.contractor_id !== contractorId) {
    throw new Error('Selected quote must belong to the selected contractor.');
  }

  const originalPrice = normalizePrice(getOriginalQuotePrice(quote), 'originalPrice');
  const normalizedRevisedPrice = normalizePrice(revisedPrice, 'revisedPrice');
  if (normalizedRevisedPrice <= originalPrice) {
    throw new Error('revisedPrice must be greater than the original selected quote price.');
  }

  const responseWindowExpires = computeResponseWindowExpires(submittedAt);
  return {
    changeOrder: {
      quote_id: quote.id,
      lead_id: lead.id,
      contractor_id: contractorId,
      original_price: originalPrice,
      revised_price: normalizedRevisedPrice,
      price_difference: Number((normalizedRevisedPrice - originalPrice).toFixed(2)),
      reason_category: requireValue(reasonCategory, 'reasonCategory'),
      reason_description: requireValue(reasonDescription, 'reasonDescription'),
      is_upsell_or_necessary: requireValue(needType, 'needType'),
      submitted_at: submittedAt,
      response_window_expires: responseWindowExpires,
      visible_to_other_contractors: Boolean(visibleToOtherContractors),
      created_by: createdBy,
      homeowner_response: 'pending',
      requested_more_info_at: null,
      resolved_at: null,
    },
    quoteUpdates: [{
      quoteId: quote.id,
      status: 'superseded',
      superseded_by_change_order_id_placeholder: '__CHANGE_ORDER_ID__',
    }],
    leadTransition: {
      leadId: lead.id,
      newStatus: 'change_order_open',
      reason: 'Selected contractor submitted a change order for homeowner review',
      metadata: {
        source: 'contractor-change-order',
        selected_quote_id: quote.id,
        selected_contractor_id: contractorId,
        response_window_expires: responseWindowExpires,
      },
    },
  };
}

function getEligibleCompetingQuotes({ quotes = [], selectedContractorId }) {
  return (quotes || []).filter(quote => (
    quote
    && quote.contractor_id
    && quote.contractor_id !== selectedContractorId
    && OPEN_RESPONSE_QUOTE_STATUSES.has(String(quote.status || '').toLowerCase())
  ));
}

function ensureChangeOrderStillOpen(changeOrder, submittedAt) {
  if (!changeOrder?.id) throw new Error('changeOrder.id is required.');
  if (!changeOrder.visible_to_other_contractors) {
    throw new Error('This change order is not visible to competing contractors.');
  }
  if (changeOrder.resolved_at) {
    throw new Error('This change order is already resolved.');
  }
  const submitted = new Date(requireValue(submittedAt, 'submittedAt'));
  const expires = new Date(requireValue(changeOrder.response_window_expires, 'changeOrder.response_window_expires'));
  if (Number.isNaN(submitted.getTime()) || Number.isNaN(expires.getTime())) {
    throw new Error('Invalid change-order response timing.');
  }
  if (submitted.getTime() > expires.getTime()) {
    throw new Error('The change-order response window has expired.');
  }
}

function buildCompetingBidderResponse({
  changeOrder,
  responderQuote,
  responseType,
  alternativePrice = null,
  responseNotes = null,
  submittedAt = new Date().toISOString(),
}) {
  ensureChangeOrderStillOpen(changeOrder, submittedAt);
  if (!responderQuote?.contractor_id) throw new Error('responderQuote.contractor_id is required.');
  if (responderQuote.contractor_id === changeOrder.contractor_id) {
    throw new Error('The selected contractor cannot respond as a competing bidder.');
  }
  if (!OPEN_RESPONSE_QUOTE_STATUSES.has(String(responderQuote.status || '').toLowerCase())) {
    throw new Error('Only original competing quotes in submitted or rejected status may respond.');
  }

  return {
    change_order_id: changeOrder.id,
    responding_contractor_id: responderQuote.contractor_id,
    response_type: requireValue(responseType, 'responseType'),
    alternative_price: alternativePrice === null || alternativePrice === undefined || alternativePrice === ''
      ? null
      : normalizePrice(alternativePrice, 'alternativePrice'),
    response_notes: responseNotes,
    submitted_at: submittedAt,
  };
}

function buildHomeownerChangeOrderResolution({
  lead,
  changeOrder,
  action,
  actedAt = new Date().toISOString(),
  replacementQuote = null,
  selectedResponse = null,
}) {
  if (lead?.status !== 'change_order_open') {
    throw new Error('Homeowner change-order resolution requires a lead in change_order_open status.');
  }
  if (!changeOrder?.id) throw new Error('changeOrder.id is required.');

  const changeOrderUpdate = {
    homeowner_response: action,
    homeowner_responded_at: actedAt,
    requested_more_info_at: null,
    resolved_at: null,
  };

  if (action === 'accepted') {
    changeOrderUpdate.resolved_at = actedAt;
    return {
      changeOrderUpdate,
      leadTransition: {
        leadId: lead.id,
        newStatus: 'confirmed',
        selectedContractorId: lead.selected_contractor_id,
        reason: 'Homeowner accepted the submitted change order',
        metadata: {
          source: 'homeowner-change-order-resolution',
          action,
          change_order_id: changeOrder.id,
          revised_price: changeOrder.revised_price ?? null,
        },
      },
      quoteUpdates: [],
    };
  }

  if (action === 'rejected_switched_contractor') {
    if (!replacementQuote?.id) throw new Error('replacementQuote is required when switching contractors.');
    if (!selectedResponse?.id) throw new Error('selectedResponse is required when switching contractors.');
    if (replacementQuote.lead_id !== lead.id) {
      throw new Error('replacementQuote must belong to the same lead.');
    }
    if (replacementQuote.contractor_id !== selectedResponse.responding_contractor_id) {
      throw new Error('replacementQuote contractor must match the selected competing response.');
    }
    changeOrderUpdate.resolved_at = actedAt;
    const verificationWindowExpires = addHours(actedAt, 72);
    return {
      changeOrderUpdate,
      leadTransition: {
        leadId: lead.id,
        newStatus: 'pending_verification',
        selectedContractorId: replacementQuote.contractor_id,
        selectedQuoteId: replacementQuote.id,
        selectionTimestamp: actedAt,
        verificationWindowExpires,
        billingStatus: 'not_ready',
        reason: 'Homeowner rejected the change order and switched to a competing bidder',
        metadata: {
          source: 'homeowner-change-order-resolution',
          action,
          change_order_id: changeOrder.id,
          replacement_quote_id: replacementQuote.id,
          replacement_contractor_id: replacementQuote.contractor_id,
          selected_response_id: selectedResponse.id,
        },
      },
      quoteUpdates: [{ quoteId: replacementQuote.id, status: 'selected' }],
    };
  }

  if (action === 'requested_more_info') {
    changeOrderUpdate.requested_more_info_at = actedAt;
    return {
      changeOrderUpdate,
      leadTransition: null,
      quoteUpdates: [],
    };
  }

  throw new Error(`Unsupported homeowner action: ${action}`);
}

const ChangeOrderWorkflow = {
  CHANGE_ORDER_RESPONSE_WINDOW_HOURS,
  buildChangeOrderSubmission,
  buildCompetingBidderResponse,
  buildHomeownerChangeOrderResolution,
  computeResponseWindowExpires,
  getEligibleCompetingQuotes,
};

if (typeof window !== 'undefined') {
  window.ChangeOrderWorkflow = ChangeOrderWorkflow;
}

export {
  CHANGE_ORDER_RESPONSE_WINDOW_HOURS,
  buildChangeOrderSubmission,
  buildCompetingBidderResponse,
  buildHomeownerChangeOrderResolution,
  computeResponseWindowExpires,
  getEligibleCompetingQuotes,
};
