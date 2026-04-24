import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildLeadLifecycleTransition,
  getLeadLifecycleActions,
} from '../app/lead-lifecycle-actions.mjs';

test('getLeadLifecycleActions exposes the consecutive 3.5 to 3.7 founder actions by status', () => {
  assert.deepEqual(
    getLeadLifecycleActions({ status: 'pending_verification' }).map(action => action.id),
    ['confirm_verification', 'open_change_order', 'cancel_verification']
  );
  assert.deepEqual(
    getLeadLifecycleActions({ status: 'change_order_open' }).map(action => action.id),
    ['confirm_change_order']
  );
  assert.deepEqual(
    getLeadLifecycleActions({ status: 'confirmed' }).map(action => action.id),
    ['schedule_install']
  );
  assert.deepEqual(
    getLeadLifecycleActions({ status: 'install_scheduled' }).map(action => action.id),
    ['mark_install_complete']
  );
  assert.deepEqual(
    getLeadLifecycleActions({ status: 'install_complete' }).map(action => action.id),
    ['mark_disputed', 'clear_install']
  );
  assert.deepEqual(
    getLeadLifecycleActions({ status: 'disputed' }).map(action => action.id),
    ['resolve_dispute_clear', 'cancel_dispute']
  );
});

test('buildLeadLifecycleTransition applies billing and timestamp side effects for 3.5 to 3.7', () => {
  const installComplete = buildLeadLifecycleTransition({
    actionId: 'mark_install_complete',
    lead: { id: 'lead-1', status: 'install_scheduled' },
    nowIso: '2026-04-24T12:00:00.000Z',
  });
  assert.equal(installComplete.newStatus, 'install_complete');
  assert.equal(installComplete.installCompleteTimestamp, '2026-04-24T12:00:00.000Z');
  assert.equal(installComplete.disputeWindowExpires, '2026-05-01T12:00:00.000Z');
  assert.equal(installComplete.billingStatus, 'not_ready');

  const clearInstall = buildLeadLifecycleTransition({
    actionId: 'clear_install',
    lead: { id: 'lead-1', status: 'install_complete' },
    nowIso: '2026-05-02T12:00:00.000Z',
  });
  assert.equal(clearInstall.newStatus, 'cleared');
  assert.equal(clearInstall.billingStatus, 'ready_for_cycle');

  const cancelDispute = buildLeadLifecycleTransition({
    actionId: 'cancel_dispute',
    lead: { id: 'lead-1', status: 'disputed' },
    nowIso: '2026-05-02T12:00:00.000Z',
  });
  assert.equal(cancelDispute.newStatus, 'cancelled');
  assert.equal(cancelDispute.billingStatus, 'waived');
});
