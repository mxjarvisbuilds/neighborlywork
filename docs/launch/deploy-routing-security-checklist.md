# NeighborlyWork Deploy Routing + Security Checklist

Agent-owned deploy hardening added before production restore:

- `_redirects` keeps stale public URLs from serving old standalone pages.
- `_headers` adds baseline Netlify security headers:
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- `robots.txt` allows public pages but blocks founder/admin/internal app surfaces from crawling.
- `sitemap.xml` lists launch-relevant public routes.
- Root `404.html` and `500.html` exist.

Production validation after Netlify restore:

1. `curl -I https://neighborlywork.com/` confirms the security headers are served.
2. `curl -I https://neighborlywork.com/homeowner-intake.html` returns a 301 to `/app/homeowner-intake.html`.
3. `curl https://neighborlywork.com/robots.txt` and `/sitemap.xml` return expected content.
4. A random missing URL renders the 404 page.
5. Browser smoke on mobile widths confirms redirects do not break core flows.
