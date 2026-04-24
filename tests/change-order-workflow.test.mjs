import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CHANGE_ORDER_RESPONSE_WINDOW_HOURS,
  buildChangeOrderSubmission,
  buildCompetingBidderResponse,
  buildHomeownerChangeOrderResolution,
  getEligibleCompetingQuotes,
} from '../app/change-order-workflow.mjs';

test('buildChangeOrderSubmission prepares a valid selected-contractor change order submission and supersedes the selected quote', () => {
  const lead = {
    id: 'lead-1',
    status: 'pending_verification',
    selected_contractor_id: 'contractor-selected',
  };
  const quote = {
    id: 'quote-selected',
    lead_id: 'lead-1',
    contractor_id: 'contractor-selected',
    status: 'selected',
    price_total: 12000,
  };

  const result = buildChangeOrderSubmission({
    lead,
    quote,
    contractorId: 'contractor-selected',
    revisedPrice: 13850,
    reasonCategory: 'unforeseen_issue',
    reasonDescription: 'Ductwork and breaker upgrades are required after onsite inspection.',
    needType: 'necessary',
    submittedAt: '2026-05-01T16:00:00.000Z',
    createdBy: 'user-contractor-selected',
  });

  assert.equal(CHANGE_ORDER_RESPONSE_WINDOW_HOURS, 48);
  assert.equal(result.changeOrder.lead_id, 'lead-1');
  assert.equal(result.changeOrder.quote_id, 'quote-selected');
  assert.equal(result.changeOrder.contractor_id, 'contractor-selected');
  assert.equal(result.changeOrder.original_price, 12000);
  assert.equal(result.changeOrder.revised_price, 13850);
  assert.equal(result.changeOrder.price_difference, 1850);
  assert.equal(result.changeOrder.response_window_expires, '2026-05-03T16:00:00.000Z');
  assert.equal(result.quoteUpdates[0].status, 'superseded');
  assert.equal(result.quoteUpdates[0].superseded_by_change_order_id_placeholder, '__CHANGE_ORDER_ID__');
  assert.equal(result.leadTransition.newStatus, 'change_order_open');
  assert.equal(result.leadTransition.metadata.selected_quote_id, 'quote-selected');
});

test('getEligibleCompetingQuotes returns original non-selected bidders still eligible to respond', () => {
  const quotes = [
    { id: 'quote-selected', contractor_id: 'contractor-selected', status: 'superseded' },
    { id: 'quote-a', contractor_id: 'contractor-a', status: 'rejected' },
    { id: 'quote-b', contractor_id: 'contractor-b', status: 'submitted' },
    { id: 'quote-c', contractor_id: 'contractor-c', status: 'draft' },
  ];

  const eligible = getEligibleCompetingQuotes({
    quotes,
    selectedContractorId: 'contractor-selected',
  });

  assert.deepEqual(eligible.map(item => item.contractor_id), ['contractor-a', 'contractor-b']);
});

test('buildCompetingBidderResponse accepts an eligible bidder inside the open response window', () => {
  const changeOrder = {
    id: 'change-order-1',
    contractor_id: 'contractor-selected',
    response_window_expires: '2026-05-03T16:00:00.000Z',
    resolved_at: null,
    visible_to_other_contractors: true,
  };
  const responderQuote = {
    id: 'quote-b',
    contractor_id: 'contractor-b',
    status: 'rejected',
  };

  const response = buildCompetingBidderResponse({
    changeOrder,
    responderQuote,
    responseType: 'can_do_lower_price',
    alternativePrice: 12950,
    responseNotes: 'We can complete the added scope without delaying install.',
    submittedAt: '2026-05-02T12:00:00.000Z',
  });

  assert.equal(response.change_order_id, 'change-order-1');
  assert.equal(response.responding_contractor_id, 'contractor-b');
  assert.equal(response.response_type, 'can_do_lower_price');
  assert.equal(response.alternative_price, 12950);
});

test('buildHomeownerChangeOrderResolution resolves acceptance into confirmed status without switching contractor', () => {
  const lead = {
    id: 'lead-1',
    status: 'change_order_open',
    selected_contractor_id: 'contractor-selected',
  };
  const changeOrder = {
    id: 'change-order-1',
    quote_id: 'quote-selected',
    contractor_id: 'contractor-selected',
    revised_price: 13850,
  };

  const result = buildHomeownerChangeOrderResolution({
    lead,
    changeOrder,
    action: 'accepted',
    actedAt: '2026-05-02T17:30:00.000Z',
  });

  assert.equal(result.changeOrderUpdate.homeowner_response, 'accepted');
  assert.equal(result.changeOrderUpdate.resolved_at, '2026-05-02T17:30:00.000Z');
  assert.equal(result.leadTransition.newStatus, 'confirmed');
  assert.equal(result.leadTransition.selectedContractorId, 'contractor-selected');
  assert.equal(result.quoteUpdates.length, 0);
});

test('buildHomeownerChangeOrderResolution resolves reject-and-switch into a fresh pending verification window and replacement quote selection', () => {
  const lead = {
    id: 'lead-1',
    status: 'change_order_open',
    selected_contractor_id: 'contractor-selected',
  };
  const changeOrder = {
    id: 'change-order-1',
    quote_id: 'quote-selected',
    contractor_id: 'contractor-selected',
  };
  const replacementQuote = {
    id: 'quote-b',
    lead_id: 'lead-1',
    contractor_id: 'contractor-b',
    status: 'rejected',
  };
  const response = {
    id: 'response-b',
    change_order_id: 'change-order-1',
    responding_contractor_id: 'contractor-b',
    response_type: 'can_do_same_scope',
  };

  const result = buildHomeownerChangeOrderResolution({
    lead,
    changeOrder,
    action: 'rejected_switched_contractor',
    actedAt: '2026-05-02T18:00:00.000Z',
    replacementQuote,
    selectedResponse: response,
  });

  assert.equal(result.changeOrderUpdate.homeowner_response, 'rejected_switched_contractor');
  assert.equal(result.changeOrderUpdate.resolved_at, '2026-05-02T18:00:00.000Z');
  assert.equal(result.leadTransition.newStatus, 'pending_verification');
  assert.equal(result.leadTransition.selectedContractorId, 'contractor-b');
  assert.equal(result.leadTransition.selectionTimestamp, '2026-05-02T18:00:00.000Z');
  assert.equal(result.leadTransition.verificationWindowExpires, '2026-05-05T18:00:00.000Z');
  assert.deepEqual(result.quoteUpdates, [
    { quoteId: 'quote-b', status: 'selected' },
  ]);
});

test('buildHomeownerChangeOrderResolution records request-more-info without resolving the change order or changing lead status', () => {
  const lead = {
    id: 'lead-1',
    status: 'change_order_open',
    selected_contractor_id: 'contractor-selected',
  };
  const changeOrder = {
    id: 'change-order-1',
    quote_id: 'quote-selected',
    contractor_id: 'contractor-selected',
  };

  const result = buildHomeownerChangeOrderResolution({
    lead,
    changeOrder,
    action: 'requested_more_info',
    actedAt: '2026-05-02T18:30:00.000Z',
  });

  assert.equal(result.changeOrderUpdate.homeowner_response, 'requested_more_info');
  assert.equal(result.changeOrderUpdate.requested_more_info_at, '2026-05-02T18:30:00.000Z');
  assert.equal(result.changeOrderUpdate.resolved_at, null);
  assert.equal(result.leadTransition, null);
});
