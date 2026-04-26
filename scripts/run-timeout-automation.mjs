import { loadLocalSecrets } from './load-local-secrets.mjs';
import { buildTimeoutAutomationPlan } from '../app/timeout-automation.mjs';

async function main() {
  loadLocalSecrets();
  const dryRun = process.argv.includes('--dry-run') || process.env.TIMEOUT_AUTOMATION_DRY_RUN !== 'false';
  const nowIso = new Date().toISOString();

  // This runner intentionally avoids direct DB writes until Supabase deployment/auth is ready.
  // It gives operators a deterministic plan to review, then can be wired to service-role Supabase execution.
  const plan = buildTimeoutAutomationPlan({ leads: [], changeOrders: [], quotes: [], nowIso });
  console.log(JSON.stringify({ ok: true, dryRun, nowIso, plan }, null, 2));
}

main().catch(error => {
  console.error(error?.message || error);
  process.exit(1);
});
