# Contractor Onboarding Email Sequence

## Sequence goal
Help newly signed-up Sacramento-area HVAC contractors understand how NeighborlyWork works, finish payment authorization, and know what to expect when their first matched lead arrives.

## Audience
Qualified HVAC contractors who created a NeighborlyWork contractor account and are moving through launch onboarding.

## Sequence principles
- Keep the model clear: no monthly fee, no pay-per-lead fee, launch referral fee only on a closed install.
- Reduce friction around payment authorization by explaining why it is required before first-lead delivery.
- Set expectations for quote quality, response speed, and the blind quote process before the first matched request.
- Keep every email focused on one action.

## Email 1 — Welcome on signup

### Timing
Immediately after contractor signup.

### Objective
Confirm the contractor is in the onboarding flow and explain the next steps required before receiving matched homeowner requests.

### Subject line options
1. Welcome to NeighborlyWork — here is what happens next
2. Your NeighborlyWork contractor account is started
3. You are one step closer to receiving matched HVAC requests

### Preview text
Finish your contractor profile and billing authorization so we can prepare you for matched Sacramento-area HVAC leads.

### Body
Hi {{contractor_first_name}},

Welcome to NeighborlyWork. We built this for HVAC contractors who want qualified install opportunities without buying junk leads or paying a monthly listing fee.

Here is how the launch flow works:

1. You complete your contractor profile.
2. You authorize billing for closed-install referral fees.
3. NeighborlyWork matches eligible homeowner HVAC requests to up to 3 vetted contractors.
4. You review each request and decide whether to submit a blind quote.
5. If the homeowner selects you and the job becomes a completed install, the launch referral fee is billed under the contractor terms.

You do not pay for lost bids, unselected quotes, homeowner cancellations before completion, or requests that never become completed installs.

Your next step is to make sure your profile is ready for matching. A strong profile helps us route the right requests to you and helps homeowners compare quotes with confidence.

### Primary CTA
Complete My Contractor Profile

### Secondary note
If you signed up by mistake or your company is not currently taking Sacramento-area HVAC install work, reply to this email and we will update your status.

### Internal implementation notes
- Send only after account creation succeeds.
- Personalize with contractor first name and company name when available.
- Link CTA to contractor profile or contractor portal onboarding checklist.

## Email 2 — Payment authorization walkthrough

### Timing
Send after signup if payment authorization is incomplete, or as the next onboarding step after profile completion.

### Objective
Explain why payment authorization is required, reassure contractors that it is not an upfront charge, and drive completion of the billing setup step.

### Subject line options
1. Finish payment authorization before your first matched request
2. One setup step before NeighborlyWork can send leads
3. How NeighborlyWork billing works for contractors

### Preview text
Authorization lets us bill only after a NeighborlyWork lead becomes a completed HVAC install.

### Body
Hi {{contractor_first_name}},

Before we can send matched homeowner requests, NeighborlyWork needs your payment authorization on file.

This is not a monthly subscription. It is not a charge for every lead. It is the billing setup that allows NeighborlyWork to collect the launch referral fee only when all of these are true:

- The homeowner request came through NeighborlyWork.
- The homeowner selected your company.
- The project became a completed HVAC install or replacement.

The current launch referral fee is $800 per closed HVAC install or replacement job.

Here is what to do:

1. Open your contractor portal.
2. Go to the billing or payment authorization step.
3. Review the launch referral terms.
4. Add and authorize your payment method.
5. Return to your onboarding checklist and confirm the step shows complete.

Once authorization is complete, we can keep your account eligible for matched requests. If a request is not a fit, you can pass. If you quote and are not selected, no referral fee is owed. If the homeowner cancels before completion, no referral fee is owed.

### Primary CTA
Authorize Payment Method

### Secondary CTA
Review Contractor Terms

### Troubleshooting block
If the authorization page does not load or your payment method is declined, reply with your company name and the best callback number. We will help you finish setup before matching starts.

### Internal implementation notes
- Send only to contractors with incomplete payment authorization.
- Suppress once billing authorization is confirmed.
- Avoid saying a card will be charged immediately.
- If product copy changes from $800 launch referral fee, update this email before launch.

## Email 3 — First-lead expectations

### Timing
Send when contractor onboarding is complete, or immediately before/after the first matched homeowner request is delivered.

### Objective
Prepare contractors to respond quickly, quote clearly, and understand how the blind quote and closed-install billing flow works.

### Subject line options
1. What to expect with your first NeighborlyWork lead
2. How to handle your first matched HVAC request
3. Your first NeighborlyWork quote: response tips and next steps

### Preview text
Matched requests work best when you respond quickly and quote the details homeowners compare side by side.

### Body
Hi {{contractor_first_name}},

Your NeighborlyWork contractor setup is ready. Here is what to expect when your first matched homeowner request arrives.

NeighborlyWork may match a homeowner request with up to 3 vetted contractors. The quote process is blind, so you will not see competitor pricing before you submit your own quote.

When a matched request comes in, review:

- Project type: install, replacement, repair-to-replace, or related HVAC need.
- Location and service area fit.
- Home details and current system information.
- Urgency and preferred timing.
- Any homeowner notes, photos, or constraints.

If the request is a fit, submit a quote that is easy for the homeowner to compare. Strong quotes usually include:

- Total price.
- Equipment brand, model, size, and efficiency details when known.
- Labor and included scope.
- Warranty information.
- Estimated installation timeline.
- Assumptions, exclusions, or site-visit requirements.

Speed matters, but clarity matters more. A fast quote that omits equipment, warranty, or timeline can lose to a slightly slower quote that answers the homeowner's real questions.

If the homeowner selects you, coordinate the install details directly with them and keep the project status updated. The NeighborlyWork referral fee is owed only after the matched job becomes a completed HVAC install or replacement under the launch terms.

### Primary CTA
View Matched Requests

### Secondary CTA
Update My Availability

### Internal implementation notes
- Send after profile and payment authorization are complete.
- If triggered by a real first lead, include a dynamic link to that request.
- Consider adding a response-time benchmark once operational data exists.
- Keep the email focused on expectations, not pressure or guaranteed lead volume.

## Suggested automation rules

| Trigger | Email | Suppression |
| --- | --- | --- |
| Contractor account created | Email 1 — Welcome on signup | Suppress if account was created by admin for an inactive contractor |
| Payment authorization incomplete after signup/profile step | Email 2 — Payment authorization walkthrough | Suppress when authorization status is complete |
| Onboarding complete or first matched request created | Email 3 — First-lead expectations | Suppress if contractor is inactive, suspended, or outside current service coverage |

## QA checklist before launch
- Confirm all CTA URLs point to the current contractor portal routes.
- Confirm the launch referral fee amount matches active contractor terms.
- Confirm suppression logic prevents payment-auth reminders after authorization is complete.
- Confirm first-lead email does not promise lead volume or exclusivity.
- Confirm unsubscribe/compliance footer is added by the sending platform.
