# NeighborlyWork Deployment Guide

## 1. Complete file list with status

### Root
- `index.html` - marketing homepage, active homepage shell, incomplete backend actions
- `supabase-config.js` - Supabase client config, done
- `start.html` - legacy landing page, deprecated
- `homepage-draft.html` - legacy draft, deprecated
- `apps-script.gs` - deprecated backend, unused
- `homeowner-intake.html` - legacy standalone intake, deprecated in favor of `/app`
- `contractor-portal.html` - legacy standalone contractor portal, deprecated in favor of `/app`
- `lead-inbox.html` - legacy standalone internal page, incomplete
- `founder-dashboard.html` - legacy standalone internal page, incomplete
- `founder-dashboard-data.json` - legacy sample data
- `google-ads-plan.md` - planning doc
- `contractor-signup-email.md` - outreach draft
- `compliance-copy.md` - legal/compliance copy
- `energysage-analysis.md` - research doc
- `DEPLOYMENT.md` - this file

### /app
- `app/index.html` - older app homepage shell, incomplete
- `app/supabase-config.js` - Supabase client config, done
- `app/homeowner-auth.html` - wired to Supabase auth, done
- `app/contractor-auth.html` - wired to Supabase auth + contractor insert, done
- `app/homeowner-intake.html` - wired to Supabase leads insert + contractor matching, done
- `app/homeowner-dashboard.html` - homeowner request dashboard, done
- `app/contractor-portal.html` - contractor portal with real data + quote submission, done
- `app/quotes.html` - quote comparison page, pending Rocky
- `app/messages.html` - realtime messaging page, done
- `app/founder-dashboard.html` - Supabase-driven admin dashboard, done
- `app/lead-inbox.html` - older internal page, incomplete
- `app/pricing.html` - static marketing page, incomplete
- `app/contractors.html` - static contractor marketing page, incomplete
- `app/test-community.html` - test page, not production
- `app/test-pro.html` - test page, not production

## 2. Environment variables needed
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

Current project values are stored in:
- `supabase-config.js`
- `app/supabase-config.js`

## 3. How to deploy to Netlify
1. Push the NeighborlyWork project to GitHub.
2. In Netlify, create a new site from Git.
3. Connect the GitHub repo.
4. Set publish directory to the project root.
5. No build command is needed.
6. Add environment variables in the Netlify dashboard if you later switch from hardcoded config files to env-based injection.
7. Deploy.

## 4. DNS setup
1. In Netlify site settings, add the custom domain `neighborlywork.com`.
2. Update DNS to point `neighborlywork.com` to Netlify.
3. Add `www` if desired and redirect to the primary domain.
4. Wait for SSL provisioning to complete.

## 5. Post-deploy checklist
- Test homeowner signup and login
- Test homeowner intake submission
- Test homeowner dashboard loads leads correctly
- Test contractor signup and pending approval state
- Test contractor approval from founder dashboard
- Test contractor portal loads leads after approval
- Test quote submission
- Test quote comparison and contractor selection
- Test messaging after contractor selection
- Test founder dashboard stats and contractor actions
- Test logout flows
- Test mobile layouts on auth, intake, dashboard, quotes, messages

## 6. Known issues and limitations
- `index.html` homepage flows are still mostly UI-only and not fully wired into the `/app` flow
- `app/quotes.html` is pending Rocky completion
- `app/messages.html` assumes selected contractor exists on a lead before messaging is allowed
- `additionalServices` from intake is currently stored inside `additional_notes`, not a dedicated structured column
- Google auth is not enabled yet
- Some older root files and older `/app` pages are deprecated but still present in the repo

## 7. Next features for v2
- Enable Google auth
- Add structured column for additional homeowner service add-ons
- Add richer contractor approval workflow
- Add homeowner notifications/email triggers
- Add contractor rating aggregation from reviews
- Add founder dashboard charts and export tools
- Add file/photo uploads for leads
- Add quote edit/revision flow
- Add message typing indicators and richer realtime UX
