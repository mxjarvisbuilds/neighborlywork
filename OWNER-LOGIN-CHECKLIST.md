# Owner Login Checklist for NeighborlyWork

Do these in order when you are at your computer.

## 1. Supabase RLS fix
URL:
- https://supabase.com/dashboard/project/uuaofdponevqwbfzwxtp/sql/new

Steps:
1. Log into Supabase.
2. Open the SQL editor for project `uuaofdponevqwbfzwxtp`.
3. Open this local file and copy all SQL:
   - `/Users/jarvis/.openclaw/workspace/neighborlywork/SUPABASE-RLS-FIX.sql`
4. Paste it into the SQL editor.
5. Run it.
6. Confirm no errors.

## 2. GitHub login / repo verification
URL:
- https://github.com/mxjarvisbuilds

Steps:
1. Log into GitHub in the browser.
2. Confirm access to the target account `mxjarvisbuilds`.
3. Confirm whether the desired repo should be:
   - `mxjarvisbuilds/neighborlywork`
   - or remain inside the current workspace repo flow
4. If you want a dedicated repo, be ready for Jarvis to create a clean NeighborlyWork-only commit scope next.

## 3. Netlify login
URL:
- https://app.netlify.com/

Steps:
1. Log into Netlify.
2. Stay logged in.
3. Do not create the site manually unless asked, Rocky can do it once the browser session is available.

## 4. GoDaddy login
URL:
- https://dcc.godaddy.com/manage/neighborlywork.com/dns

If that direct URL fails, use:
- https://dcc.godaddy.com/

Steps:
1. Log into GoDaddy.
2. Open DNS management for `neighborlywork.com`.
3. Stay logged in so Rocky can complete DNS setup after Netlify gives the final records.

## 5. Optional test accounts for browser validation
Have these ready if needed:
1. homeowner test account
2. contractor test account
3. admin/founder test account

If they do not exist yet, we can create fresh ones after the Supabase RLS fix is applied.

## 6. After you finish the logins
Send me one message:
- `done, all logged in`

Then Rocky can immediately re-run:
1. signup validation
2. GitHub/browser deployment checks
3. Netlify site creation
4. domain connection
5. DNS update
6. final live-site verification
