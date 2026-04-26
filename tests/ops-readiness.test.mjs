import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { buildLaunchReconciliation } from '../scripts/run-launch-reconciliation.mjs';

test('transition_lead_status includes actor authorization gates', () => {
  const sql = readFileSync('supabase/004_lead_transitions_v1.sql', 'utf8');
  assert.match(sql, /Authentication is required to transition lead status/);
  assert.match(sql, /Admin authorization required for lead transition/);
  assert.match(sql, /Only a matched contractor or admin can mark quotes submitted/);
  assert.match(sql, /Only the selected contractor or admin can open a change order/);
});

test('admin RLS overlay covers core marketplace tables', () => {
  const sql = readFileSync('supabase/007_admin_rls_policies.sql', 'utf8');
  for (const table of ['users', 'contractors', 'leads', 'quotes', 'messages', 'reviews']) {
    assert.match(sql, new RegExp(`public\\.${table}`));
    assert.match(sql, new RegExp(`${table}_admin`));
  }
});

test('ops docs include SOP, monitoring, and both contractor vetting choices', () => {
  const sop = readFileSync('docs/ops/launch-ops-sop.md', 'utf8');
  const monitoring = readFileSync('docs/ops/monitoring-reconciliation.md', 'utf8');
  const vetting = readFileSync('docs/ops/contractor-vetting-options.md', 'utf8');
  assert.match(sop, /Daily launch rhythm/);
  assert.match(monitoring, /Reconciliation checks/);
  assert.match(vetting, /Option A — Soft launch checkbox path/);
  assert.match(vetting, /Option B — Verified CSLB \+ insurance path/);
});

test('launch reconciliation reports required local launch artifacts', () => {
  const report = buildLaunchReconciliation({ envNames: new Set(['SUPABASE_SERVICE_ROLE_KEY', 'STRIPE_TEST_SECRET_KEY', 'RESEND_API_KEY', 'RESEND_FROM_EMAIL']) });
  assert.equal(report.files.every(item => item.present), true);
  assert.equal(report.env.every(item => item.present), true);
});
