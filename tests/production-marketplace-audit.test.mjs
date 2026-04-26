import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('production marketplace audit covers required launch layers', () => {
  const doc = readFileSync('docs/launch/production-marketplace-audit.md', 'utf8');
  const requiredSections = [
    'Business operations',
    'Homeowner flow',
    'Contractor flow',
    'Admin tooling',
    'Data integrity and lifecycle',
    'Notifications and customer support',
    'Growth and retention',
    'Monitoring and launch operations',
    'Abuse prevention and trust/safety',
    'Edge cases and fallback posture',
    'Zayith-only gaps',
  ];
  for (const section of requiredSections) {
    assert.match(doc, new RegExp(`#{2,3} ${section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
  }
});

test('key dynamic HTML pages define escaping before template rendering', () => {
  const pages = [
    'app/founder-dashboard.html',
    'app/lead-inbox.html',
    'app/homeowner-dashboard.html',
    'app/contractor-portal.html',
    'app/messages.html',
    'app/change-order-review.html',
    'app/quotes.html',
  ];
  for (const page of pages) {
    const html = readFileSync(page, 'utf8');
    assert.match(html, /function escapeHtml\(value/);
  }
});

test('highest-risk message and change-order render paths escape user text', () => {
  const messages = readFileSync('app/messages.html', 'utf8');
  assert.match(messages, /escapeHtml\(msg\.message_text\)/);
  assert.match(messages, /escapeHtml\(conv\.last \? conv\.last\.message_text\.slice\(0, 72\) : 'No messages yet'\)/);

  const changeOrder = readFileSync('app/change-order-review.html', 'utf8');
  assert.match(changeOrder, /escapeHtml\(response\.response_notes \|\| 'No additional notes provided\.'\)/);
  assert.match(changeOrder, /escapeHtml\(changeOrder\.reason_description \|\| '—'\)/);
});
