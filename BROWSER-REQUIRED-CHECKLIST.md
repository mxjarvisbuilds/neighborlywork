# NeighborlyWork Browser-Required Checklist

## 1. Supabase dashboard tasks
1. Open the Supabase project dashboard for `uuaofdponevqwbfzwxtp`.
2. Confirm Email auth is enabled under Authentication.
3. If you want Google login later, open Authentication → Providers → Google.
4. Add Google OAuth client ID and secret.
5. Add the correct redirect URLs for local and production domains.
6. Save and test Google login.
7. Review RLS policies on:
   - `users`
   - `contractors`
   - `leads`
   - `quotes`
   - `messages`
   - `reviews`
8. Confirm homeowner, contractor, and admin test accounts can only see what they should.

## 2. Netlify deployment
1. Open Netlify.
2. Create a new site from the NeighborlyWork Git repo.
3. Set the publish directory to the NeighborlyWork project root.
4. No build command is needed.
5. Deploy the site.
6. Open the deployed URL and test:
   - homepage
   - homeowner auth
   - contractor auth
   - homeowner intake
   - homeowner dashboard
   - contractor portal
   - quotes page
   - messages page
   - founder dashboard
   - lead inbox

## 3. Domain / DNS setup
1. In Netlify, open Domain settings.
2. Add `neighborlywork.com` as the primary domain.
3. Add `www.neighborlywork.com` if desired.
4. Update DNS at the domain registrar to point to Netlify.
5. Wait for SSL to provision.
6. Verify both HTTP and HTTPS redirect correctly.

## 4. Browser-only validation tasks
1. Sign up a fresh homeowner account.
2. Submit a full intake form.
3. Confirm the lead appears in homeowner dashboard.
4. Sign up a contractor account.
5. Approve that contractor from founder dashboard.
6. Confirm the contractor sees matched leads in contractor portal.
7. Submit a quote.
8. Confirm the homeowner can open quotes and select a contractor.
9. Confirm messages work after contractor selection.
10. Confirm the lead appears correctly in lead inbox.

## 5. Accounts / external services that may still need browser action later
1. Google OAuth in Supabase, if enabled later.
2. Netlify account / site creation.
3. Domain registrar DNS changes for `neighborlywork.com`.
4. Any future email provider dashboard setup if transactional email gets added.
