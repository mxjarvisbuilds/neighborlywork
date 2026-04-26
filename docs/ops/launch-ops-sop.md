# NeighborlyWork Launch Ops SOP

## Daily launch rhythm
1. Check production availability for apex, www, `/app/`, homeowner intake, contractor auth, quotes, messages, lead inbox, and founder dashboard.
2. Run local reconciliation: `node scripts/run-launch-reconciliation.mjs`.
3. Review lead inbox for new, urgent, pending verification, change-order open, install complete, disputed, and ready-for-cycle leads.
4. Review contractor queue: pending accounts, payment authorization state, service ZIPs, license/insurance evidence, pricing-profile completeness.
5. Review notifications: pending, failed, retryable, and manual-review events.
6. Review billing cycles in test mode only until live Stripe approval exists.

## Homeowner request handling
- New request: confirm ZIP/service, obvious spam, duplicate submissions, and urgency.
- Matching: route to no more than 3 approved contractors with matching service area and service category.
- Quotes: if at least one quote exists after the quote window, move to quote-ready flow; if none, manually follow up with contractors or reroute.
- Selection: homeowner selection starts verification window.
- Change order: homeowner can accept, request more info, or switch to an eligible original bidder.
- Install complete: keep dispute window open before clearing for billing.

## Contractor handling
- Pending signup: review legal consents, business name, phone/email, service ZIPs, service categories, license field, and abuse signals.
- Soft launch path: approve after manual plausibility review and direct outreach confirmation.
- Verified path: require CSLB license + insurance proof before approval.
- Suspended contractor: do not route new leads; preserve billing and dispute records.

## Support escalation
- Billing dispute, safety concern, suspected fraud, homeowner complaint, contractor fee dispute, or identity mismatch → manual founder review.
- Do not run live Stripe charges without explicit approval.
- Do not send marketing/cold outreach email until business mailing address is configured.
