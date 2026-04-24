const INSTALL_FEE = 800;

function collectBillableLeads(leads = []) {
  return (leads || []).filter(lead => lead?.status === 'cleared' && lead?.billing_status === 'ready_for_cycle' && lead?.selected_contractor_id);
}

function cycleStartFromEnd(cycleEndDate) {
  const end = new Date(`${cycleEndDate}T00:00:00Z`);
  if (Number.isNaN(end.getTime())) throw new Error('Invalid cycle end date');
  const start = new Date(end.getTime() - 13 * 24 * 60 * 60 * 1000);
  return start.toISOString().slice(0, 10);
}

function buildBillingCycles({ leads = [], cycleEndDate }) {
  const eligible = collectBillableLeads(leads);
  const grouped = new Map();
  for (const lead of eligible) {
    const contractorId = lead.selected_contractor_id;
    if (!grouped.has(contractorId)) grouped.set(contractorId, []);
    grouped.get(contractorId).push(lead);
  }

  const cycle_start_date = cycleStartFromEnd(cycleEndDate);
  const cycles = [];
  const assignments = [];
  for (const [contractorId, contractorLeads] of [...grouped.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const total_cleared_jobs = contractorLeads.length;
    const total_amount_due = total_cleared_jobs * INSTALL_FEE;
    cycles.push({
      contractor_id: contractorId,
      cycle_start_date,
      cycle_end_date: cycleEndDate,
      total_cleared_jobs,
      total_amount_due,
      status: 'pending',
      retry_count: 0,
    });
    assignments.push({
      contractor_id: contractorId,
      lead_ids: contractorLeads.map(lead => lead.id),
      total_amount_due,
      billing_status: 'in_cycle',
    });
  }
  return { cycles, assignments };
}

const BillingCyclePrep = { INSTALL_FEE, collectBillableLeads, buildBillingCycles };
if (typeof window !== 'undefined') window.BillingCyclePrep = BillingCyclePrep;
export { INSTALL_FEE, collectBillableLeads, buildBillingCycles };
