import assert from 'node:assert/strict';
import test from 'node:test';
import { assertHumanSubmission, checkSubmissionRateLimit, recordSubmissionAttempt } from '../app/abuse-guard.mjs';

function memoryStorage() {
  const map = new Map();
  return {
    getItem: key => map.has(key) ? map.get(key) : null,
    setItem: (key, value) => map.set(key, String(value)),
  };
}

function form({ bot = '', startedAt = '1000' } = {}) {
  return {
    dataset: { startedAt },
    querySelector(selector) {
      if (selector === '[name="website_url"]') return { value: bot };
      if (selector === '[name="form_started_at"]') return { value: startedAt };
      return null;
    },
  };
}

test('abuse guard rejects honeypot submissions', () => {
  assert.throws(() => assertHumanSubmission({ form: form({ bot: 'https://spam.test' }), storage: memoryStorage(), scope: 'intake', currentTimeMs: 5000 }), /rejected/);
});

test('abuse guard rejects forms submitted too quickly', () => {
  assert.throws(() => assertHumanSubmission({ form: form({ startedAt: '4000' }), storage: memoryStorage(), scope: 'intake', currentTimeMs: 5000 }), /too quickly/);
});

test('rate limiter blocks after configured attempts in window', () => {
  const storage = memoryStorage();
  for (let i = 0; i < 3; i++) recordSubmissionAttempt({ storage, scope: 'contractor', identity: 'a@example.com', currentTimeMs: 1000 + i });
  const rate = checkSubmissionRateLimit({ storage, scope: 'contractor', identity: 'a@example.com', limit: 3, currentTimeMs: 2000 });
  assert.equal(rate.allowed, false);
});
