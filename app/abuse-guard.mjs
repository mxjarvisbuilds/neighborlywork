const DEFAULT_WINDOW_MS = 60 * 60 * 1000;

function nowMs() {
  return Date.now();
}

function storageKey(scope, identity = 'anonymous') {
  return `neighborlywork:abuse:${scope}:${String(identity || 'anonymous').toLowerCase()}`;
}

function readAttempts(storage, key, currentTimeMs = nowMs()) {
  if (!storage) return [];
  try {
    const parsed = JSON.parse(storage.getItem(key) || '[]');
    return Array.isArray(parsed) ? parsed.filter(ts => Number.isFinite(ts) && ts <= currentTimeMs) : [];
  } catch {
    return [];
  }
}

function pruneAttempts(attempts, currentTimeMs = nowMs(), windowMs = DEFAULT_WINDOW_MS) {
  return attempts.filter(ts => currentTimeMs - ts < windowMs);
}

function checkSubmissionRateLimit({ storage, scope, identity = 'anonymous', limit = 3, windowMs = DEFAULT_WINDOW_MS, currentTimeMs = nowMs() }) {
  const key = storageKey(scope, identity);
  const recent = pruneAttempts(readAttempts(storage, key, currentTimeMs), currentTimeMs, windowMs);
  return {
    allowed: recent.length < limit,
    remaining: Math.max(0, limit - recent.length),
    retryAfterMs: recent.length >= limit ? Math.max(0, windowMs - (currentTimeMs - recent[0])) : 0,
    key,
    attempts: recent,
  };
}

function recordSubmissionAttempt({ storage, scope, identity = 'anonymous', windowMs = DEFAULT_WINDOW_MS, currentTimeMs = nowMs() }) {
  if (!storage) return [];
  const key = storageKey(scope, identity);
  const attempts = pruneAttempts(readAttempts(storage, key, currentTimeMs), currentTimeMs, windowMs);
  attempts.push(currentTimeMs);
  storage.setItem(key, JSON.stringify(attempts));
  return attempts;
}

function assertHumanSubmission({ form, storage, scope, identity = 'anonymous', minFillMs = 2500, limit = 3, windowMs = DEFAULT_WINDOW_MS, currentTimeMs = nowMs() }) {
  const botField = form?.querySelector?.('[name="website_url"]');
  if (botField?.value) throw new Error('Submission rejected. Please reload and try again.');

  const startedAtRaw = form?.dataset?.startedAt || form?.querySelector?.('[name="form_started_at"]')?.value;
  const startedAt = Number(startedAtRaw || 0);
  if (startedAt && currentTimeMs - startedAt < minFillMs) {
    throw new Error('That was submitted too quickly. Please review the form and try again.');
  }

  const rate = checkSubmissionRateLimit({ storage, scope, identity, limit, windowMs, currentTimeMs });
  if (!rate.allowed) {
    const minutes = Math.max(1, Math.ceil(rate.retryAfterMs / 60000));
    throw new Error(`Too many attempts. Please wait ${minutes} minute${minutes === 1 ? '' : 's'} and try again.`);
  }
  return rate;
}

function markFormStarted(form, currentTimeMs = nowMs()) {
  if (!form) return;
  form.dataset.startedAt = String(currentTimeMs);
  const hidden = form.querySelector('[name="form_started_at"]');
  if (hidden) hidden.value = String(currentTimeMs);
}

const AbuseGuard = {
  assertHumanSubmission,
  checkSubmissionRateLimit,
  markFormStarted,
  recordSubmissionAttempt,
  storageKey,
};

if (typeof window !== 'undefined') {
  window.AbuseGuard = AbuseGuard;
}

export {
  assertHumanSubmission,
  checkSubmissionRateLimit,
  markFormStarted,
  recordSubmissionAttempt,
  storageKey,
};
