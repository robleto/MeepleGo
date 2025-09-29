# MeepleGo Launch Checklist

Purpose: Ensure a smooth launch to production with working auth, correct configuration, and basic telemetry. Use this to prep a private beta and then a public launch.

## 1) Supabase Configuration

📚 **See comprehensive documentation**:

- [**Complete Supabase Launch Checklist**](../deployment/supabase-launch-checklist.md) - Step-by-step guide
- [Supabase Production Configuration](../deployment/supabase-production-config.md) - Detailed setup instructions
- [DNS Setup Guide](../deployment/dns-setup.md) - Email deliverability configuration
- [Environment Variables](../deployment/environment-variables.md) - Production environment setup

**Quick testing**: Run `npm run test:email` to validate email deliverability across providers.

- Allowlist Redirect URLs:
  - `https://meeplego.com/auth/callback`
  - Staging: e.g., `https://staging.meeplego.com/auth/callback`
  - Local (dev): `http://localhost:3001/auth/callback` and/or `http://localhost:3000/auth/callback`
- Email Templates:
  - Use `{{ .ConfirmationURL }}` in magic link and password recovery templates.
  - Include short copy setting expectations (link expires, opens in default browser).
- SMTP & Deliverability:
  - Set SPF/DKIM on your sending domain.
  - Send a test to Gmail/Outlook/Apple Mail; check spam placement.
- Security (RLS):
  - Re-validate Row Level Security policies for all user-facing tables.
  - Create a non-owner test user and ensure they cannot read/write others’ data.

## 2) Hosting & Environment

Set these env vars on your hosting provider (do NOT expose service role to client):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL=https://meeplego.com`
- `NODE_ENV=production`
- `SUPABASE_SERVICE_ROLE` (server-only functions; not required for general runtime)

Sanity checks:

- Dev-only endpoints are guarded (e.g., `api/auth/generate-recovery`).
- No `console.log` noise in production (we already gate on `NODE_ENV`).
- Use the `/auth/callback` handoff → `/auth/callback/handle` pattern in prod.

## 3) Observability

- Analytics (choose one: Plausible, Umami, or similar):
  - Track: `signup_start`, `magic_link_sent`, `callback_success`, `reset_requested`, `password_updated`, `list_created`.
- Error Tracking (Sentry recommended):
  - Capture errors in both client and server (Next.js). Confirm DSN in prod.
  - Verify source maps are uploaded if using Sentry.

## 4) Performance, Accessibility, SEO

- Run Lighthouse on top public pages (Home, Games, Lists, Awards, Profile):
  - Address image sizes, preloads, and obvious layout shifts (CLS).
- Accessibility:
  - Keyboard navigation on nav, modals, and forms.
  - ARIA roles on alerts and interactive controls (already present in `Alert`).
- SEO:
  - Confirm `<title>`, `<meta name="description">`, OG tags on public pages.
  - Add sitemap.xml and robots.txt (disallow staging).

## 5) Legal & Trust

- Add pages: Privacy Policy, Terms of Service; link in footer.
- Export: Offer a basic user data export (optional post-launch).

## 6) Private Beta Plan

- Access Control: Start with invite-only (email allowlist) or simple invite code.
- Feedback Loop: Add "Send feedback" link (mailto or form) visible post-login.
- Success Criteria (example):
  - 10–20 initial users
  - ≥ 80% first-try auth callback success
  - ≥ 2 saved lists per user on average
  - < 1% error rate on pages; 0 auth-related 500s

## 7) Manual QA Scenarios (Auth)

Use 2–3 test emails (see the Faux Users section). Verify on both desktop and mobile:

1. Sign up with email + magic link
   - Receive email, click magic link, land on `/auth/callback` and then to `/`.
   - Session persists on refresh; nav shows authenticated state.
2. Login with email/password
   - Invalid creds → friendly error
   - Valid creds → redirect to `/` or `next` param
3. Password recovery
   - Request reset; click email link; land on `/auth/callback` → `/update-password`
   - Set new password; confirm success and ability to log in
4. Expired/invalid link
   - Use an old recovery link; expect redirect to `/login?error=otp_expired` (or friendly equivalent)
5. Sign out / Sign in
   - Sign out from nav; ensure protected pages redirect to login if implemented
6. Mobile deep link behavior
   - On iOS/Android, tapping email link should open the browser and complete the flow

## 8) Faux Users (Testing Strategy)

- Create 2–3 real email addresses you control (e.g., `yourname+test1@gmail.com`, `yourname+test2@gmail.com`) or use separate provider accounts for deliverability variance.
- Optional: Create a dedicated test domain (e.g., `qa@yourdomain.com`) with inbox access.
- Use them to simulate:
  - New user signup with magic link
  - Reset password flows for each account
  - One account with an unconfirmed email, test resend confirmation
  - Cross-browser behavior: Chrome, Safari, Firefox; mobile Safari/Chrome

Tips:

- Keep one account with a known bad password to quickly test invalid login messaging.
- Log in with User A in one browser and User B in another to validate RLS boundaries (e.g., lists, rankings).
- Save screenshots of emails and flows for later docs and debugging.

## 9) Public Share (Optional for Beta)

- Public list pages with share links (read-only) and OG cards for social.
- Public profile basics (avatar, bio, top games, recent lists).

---

Once these items are complete and QA passes, you’re ready to invite your first users. Keep an eye on analytics and errors in the first 48 hours and iterate quickly.
