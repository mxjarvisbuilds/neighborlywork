import { existsSync, readFileSync } from 'node:fs';

const requiredFiles = [
  '_headers',
  '_redirects',
  'robots.txt',
  'sitemap.xml',
  'terms.html',
  'privacy.html',
  'contractor-agreement.html',
  'docs/launch/production-marketplace-audit.md',
  'docs/ops/launch-ops-sop.md',
  'docs/ops/monitoring-reconciliation.md',
  'docs/ops/contractor-vetting-options.md',
];

const requiredEnvNames = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_TEST_SECRET_KEY',
  'RESEND_API_KEY',
  'RESEND_FROM_EMAIL',
];

function loadEnvNames(path = `${process.env.HOME}/.jarvis/secrets.env`) {
  if (!existsSync(path)) return new Set();
  const names = new Set();
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)=/);
    if (match) names.add(match[1]);
  }
  return names;
}

function buildLaunchReconciliation({ envNames = loadEnvNames() } = {}) {
  return {
    files: requiredFiles.map(path => ({ path, present: existsSync(path) })),
    env: requiredEnvNames.map(name => ({ name, present: envNames.has(name) })),
    zayithOnly: [
      'Netlify billing/usage restore',
      'Resend DNS verification',
      'Twilio login/sender setup if SMS is required',
      'Explicit live Stripe approval before live charges',
      'Business mailing address before marketing/cold outreach',
    ],
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = buildLaunchReconciliation();
  const ok = report.files.every(item => item.present) && report.env.every(item => item.present);
  console.log(JSON.stringify({ ok, ...report }, null, 2));
  process.exit(ok ? 0 : 1);
}

export { buildLaunchReconciliation };
