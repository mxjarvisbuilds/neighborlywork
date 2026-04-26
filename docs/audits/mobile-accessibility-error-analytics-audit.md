# NeighborlyWork Mobile / Accessibility / Error / Analytics Audit

Date: 2026-04-25

## Mobile responsiveness

Static inspection shows all public/app HTML pages include viewport meta tags and most app pages have mobile media queries. Key pages inspected:

- `/index.html`
- `/app/homeowner-intake.html`
- `/app/homeowner-auth.html`
- `/app/homeowner-dashboard.html`
- `/app/quotes.html`
- `/app/messages.html`
- `/app/contractor-auth.html`
- `/app/contractor-portal.html`
- `/app/founder-dashboard.html`
- `/app/lead-inbox.html`
- `/app/change-order-review.html`

Live device/browser validation remains blocked until Netlify production is restored.

## Accessibility basics

Covered:
- `lang="en"` present on inspected HTML.
- Viewport meta present.
- Main flows use real `button`, `input`, `label`, and link elements.
- Auth tabs expose `role="tablist"` labels.

Gaps to continue hardening:
- Not every dynamic status message has explicit `aria-live`.
- Icon-only/visual decorative elements need consistent `aria-hidden` where applicable.
- No automated Lighthouse/axe report yet because production is blocked.

## Error handling

Fixed in this pass:
- Added root `/404.html` for missing routes.
- Added root `/500.html` for generic server/runtime failure fallback.

Remaining:
- Netlify `_redirects`/function-level error routing has not been validated because production is paused.

## Analytics

No GA, Plausible, Segment, Meta Pixel, or other tracking snippet was found in static repo inspection.

Recommendation before public launch:
- If Zayith wants analytics without cookies/heavy privacy implications, use Plausible or a similar privacy-first tracker.
- Do not add tracking silently because it changes privacy posture and may require updating privacy disclosures and DNS/billing/vendor decisions.
