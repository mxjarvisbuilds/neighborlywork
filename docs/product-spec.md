# NeighborlyWork — Product Specification
*Version 1.0 | April 2026*

---

## Vision
One brand with two revenue engines. Small jobs use a community marketplace where homeowners name the price and workers accept it. Big HVAC installs use blind bidding with up to 3 vetted contractors. Start in Sacramento, then expand.

---

## Two Sides

### Homeowners
- Post a small job at their price
- Or submit one big HVAC request
- Get up to 3 vetted contractors for installs
- Compare blind bids side-by-side
- Rate the contractor after completion

### Workers / Contractors
- Get vetted first (license + insurance)
- Browse small jobs or receive blind HVAC quote requests
- Small jobs: accept posted price
- Big installs: submit equipment, warranty, timeline, and total price
- Never see competitor quotes on Pro Installs
- Pay worker-side fee on small jobs, or $75 / $350 on HVAC closes

---

## Core Flow

1. **Community Jobs flow**
   - Homeowner posts job
   - Sets their price
   - Worker accepts or passes
   - Payment held until completion
   - Platform takes worker-side fee

2. **Pro Installs flow**
   - Homeowner submits HVAC request
   - Address / zip, system type, unit age, home size, urgency
   - Match to 3 vetted contractors max
   - Contractors do not see each other
   - Homeowner compares side-by-side quotes
   - Contractor is billed on close: $75 repair or $350 install/replacement

---

## Extra Work Handling (Ernesto's question)
- Worker taps "Request extra work" mid-job
- Describes additional scope + price
- Poster approves or declines in app
- If approved → additional escrow charge added
- If declined → worker completes original scope only
- Prevents scope creep disputes, keeps everything on-platform

---

## Keeping Users On Platform
- All communication via in-app chat (no phone numbers shown until job accepted)
- Payment only via platform (no cash bypass incentive)
- Reputation system — ratings tied to platform account
- Repeat booking button — "Book [Worker Name] again" keeps relationship on-platform
- Worker incentive: faster payment, insurance of getting paid, dispute protection

---

## Categories (Phase 1)
- Community Jobs: handyman, cleaning, lawn care, painting, plumbing, electrical
- Pro Installs: HVAC

---

## Dispute System
- Poster disputes → funds freeze
- Both sides submit evidence (photos, chat log)
- Under $100 → auto-refund (not worth fighting)
- Over $100 → manual review by NeighborlyWork team (us)
- Over $500 → escalation path + refund policy

---

## Revenue Model

### Community Jobs
| Job Value | Fee |
|-----------|-----|
| Under $200 | 10% |
| $200 - $1,000 | 8% |
| Over $1,000 | 5% |

### Pro Installs
| Source | Rate |
|--------|------|
| Closed HVAC repair | $75 |
| Closed HVAC install / replacement | $350 |
| Priority placement | later, optional |

### Future priority placement
- Contractors can pay for visibility in their zip code
- Not part of launch MVP

### Example earnings
| Job | Value | Platform fee | Worker gets |
|-----|-------|-------------|-------------|
| HVAC repair | $900 | $75 | $825 |
| HVAC install | $3,500 | $350 | $3,150 |
| Replacement system | $7,500 | $350 | $7,150 |

---

## Tech Stack (MVP)
| Layer | Tool |
|-------|------|
| Frontend | Static site / Next.js later |
| Backend | Email + CRM first, app later |
| Payments | Stripe invoicing / payment links first |
| Hosting | GitHub Pages / Vercel later |

---

## MVP Feature List (Launch)
- [ ] User registration (poster + worker roles)
- [ ] Job posting form
- [ ] Job browse/search by category + zip
- [ ] Job acceptance
- [ ] In-app chat
- [ ] Stripe Connect escrow payment
- [ ] Job completion + photo upload
- [ ] 24h auto-release
- [ ] Dispute flag
- [ ] Star ratings (both sides)
- [ ] Worker profile page
- [ ] Poster dashboard
- [ ] Worker dashboard
- [ ] Email notifications (job posted, accepted, completed, paid)

---

## Phase 2 (post-launch)
- [ ] Bidding system (open bids vs fixed price)
- [ ] Extra work requests mid-job
- [ ] Background check integration
- [ ] Pro subscription tier
- [ ] Mobile app (React Native)
- [ ] Repeat booking
- [ ] Referral program

---

## Go-to-Market
1. **Start in Sacramento** — HVAC only
2. **Recruit contractors first** — 20-30 vetted HVAC contractors before launch
3. **Recruit homeowners** — Nextdoor, Craigslist, Facebook Groups
4. **Use NeighborlyWork.com** as the marketing front door
5. **Expand by city** — Roseville, Elk Grove, Folsom, then Bay Area

---

## Milestones
| Milestone | Target |
|-----------|--------|
| Product spec complete | ✅ Done |
| MVP wireframes | Week 1 |
| MVP build start | Week 1-2 |
| MVP launch (Sacramento) | Week 4-6 |
| First transaction | Week 6 |
| 10 active workers | Month 2 |
| $1,000 GMV | Month 2 |
| $10,000 GMV | Month 3-4 |
| Expand to 3 cities | Month 6 |
