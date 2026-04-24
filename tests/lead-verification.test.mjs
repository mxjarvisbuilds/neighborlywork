import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildPendingVerificationTransition,
  formatVerificationWindow,
} from '../app/lead-verification.mjs';

test('buildPendingVerificationTransition sets verification window to 72 hours after selection', () => {
  const selectionTimestamp = '2026-04-24T12:00:00.000Z';
  const result = buildPendingVerificationTransition({
    leadId: 'lead-1',
    selectedQuoteId: 'quote-1',
    selectedContractorId: 'contractor-1',
    selectionTimestamp,
  });

  assert.equal(result.newStatus, 'pending_verification');
  assert.equal(result.selectedQuoteId, 'quote-1');
  assert.equal(result.selectedContractorId, 'contractor-1');
  assert.equal(result.selectionTimestamp, selectionTimestamp);
  assert.equal(result.verificationWindowExpires, '2026-04-27T12:00:00.000Z');
  assert.equal(result.billingStatus, 'not_ready');
  assert.match(result.reason, /verification/i);
  assert.equal(result.metadata.selected_quote_id, 'quote-1');
});

test('formatVerificationWindow gives a homeowner-facing fallback when the timestamp is missing', () => {
  assert.equal(formatVerificationWindow('2026-04-27T12:00:00.000Z'), 'Apr 27, 2026');
  assert.equal(formatVerificationWindow(null), 'Pending confirmation');
});
