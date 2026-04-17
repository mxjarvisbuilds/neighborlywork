# EnergySage Competitive Analysis for Neighborly Work

## What I observed

### Homeowner experience
- Homepage is heavily category-driven, with clear tiles for major product lines and repeated CTA buttons (`Get started`).
- The ZIP gate is front-and-center and repeated in multiple places, usually with a simple field and a `Shop local offers` button.
- The heat-pumps page positions heat pumps as "the clean technology changing home comfort" and uses strong educational framing before the quote ask.
- The article layout for heat pumps includes:
  - headline, author, editor, updated date, read time
  - social share buttons
  - trust module (`Why trust EnergySage?`)
  - table of contents
  - embedded media
  - inline educational sections
  - repeated ZIP/quote CTA near the bottom
- Visible trust signals include editorial bylines, update date, DOE success badge language, privacy policy links, and marketplace wording like `shop local offers`.
- The site makes homeowner intent feel guided, not transactional: learn first, then get quotes.
- Publicly visible public route guesses like `/heat-pumps/get-started/` and `/marketplace/heat-pumps/` 404ed in-browser, so the actual quote flow is probably app-generated or gated.

### Contractor / installer experience
- Installer landing page copy is very direct:
  - `EnergySage connects trusted installers with shoppers ready to go solar`
  - promise of more sales, less time, and market insight
  - `Apply to join` CTA
- The pitch emphasizes educated, highly motivated homeowners, exclusive industry insights, dedicated partner success managers, and tools that help installers close more deals.
- Public case-study/article links on the installer page appear to show customer proof, but several guessed slugs were dead in browser.
- Strong recurring promise themes on the installer page:
  - higher-intent leads
  - less time wasted
  - support from partner success managers
  - differentiated shopper quality

### Education / content
- News feed and heat-pump content are strongly editorial.
- Visible titles / intent patterns included:
  - `How much does a heat pump cost in 2026?`
  - `5 levels of home backup power—and how to find yours`
  - `Home batteries for renters: What you need to know`
  - `Best home energy monitors in 2026: Which one is right for you?`
  - `Pre-paid solar leases and PPAs: Are they worth it in 2026?`
  - `Massachusetts' plan to cut Mass Save funding looks like electric bill savings. It isn't.`
  - `The Iran war may spike your energy bill—here’s what to do about it`
  - `What historic policy upheaval revealed about the home energy market in 2025`
- Their article strategy mixes evergreen how-to, market timing, and policy/news framing.
- Newsletter CTA is prominent in the news section.

## What to steal
- Repeated, low-friction ZIP gate with a simple `Shop local offers` CTA.
- Education-first quote flow: teach before asking for contact info.
- Strong trust rail on content pages: byline, update date, read time, privacy link, evidence of marketplace scale.
- Big category tiles on homepage with one clear CTA each.
- Installer pitch language around higher-intent shoppers and less wasted time.
- Dedicated installer success stories as proof.
- Article TOC + inline CTA structure.
- Reusable market/news content tied to homeowner urgency.
- A clean, icon-based value prop section for both homeowners and contractors.
- Bottom-of-article repeated CTA, not just top-of-page ask.

## What to skip
- Solar-specific messaging and non-HVAC categories.
- Any vague nationwide marketplace positioning, since we are Sacramento-only.
- Human advisor / partner success manager framing if we’re staying homeowner-privacy-first and low-touch.
- Anything that implies the homeowner must surrender contact info early.
- Overly broad clean-energy editorial that dilutes HVAC focus.
- Publicly visible route assumptions that are brittle or 404-prone.

## Where we beat them
- Homeowner-controlled contact info is a stronger trust angle than their generic quote gate.
- Sacramento-only positioning can feel more local and more relevant than a national marketplace.
- HVAC-only focus lets us be more specific, faster, and less noisy.
- We can frame privacy as a product feature, not a disclaimer.
- We can promise fewer, better matched contractors instead of a marketplace swarm.
- We can make the homeowner feel like they are in control of who sees them and when.

## Prioritized build list
1. Add a clear homeowner privacy promise above the fold.
2. Build a ZIP-first entry point with a simple local-offers CTA.
3. Add a 3-step how-it-works section with icons.
4. Add trust blocks: vetted, local, licensed, review-backed.
5. Add contractor comparison / quote explanation copy.
6. Add a homeowner education section for HVAC basics and cost drivers.
7. Build a contractor-facing installer landing page with explicit value prop.
8. Add case-study/testimonial blocks for contractors.
9. Add content hub pages targeting HVAC buyer intent in Sacramento.
10. Add repeated CTAs through articles and landing pages.
