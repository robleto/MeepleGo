# Supabase Auth Email Templates (MeepleGo)

These are copy/paste-ready, inline-styled HTML templates for Supabase Auth emails. They use a bulletproof CTA button (works in Outlook) and include a plain-link fallback for clients that strip styles.

Templates included:
- Confirm Signup: `confirm-signup.html`
- Magic Link Sign-in: `magic-link.html`
- Reset Password: `reset-password.html`
- Invite User: `invite-user.html`
- Change Email: `change-email.html`
- Reauthenticate: `reauthenticate.html`

Primary brand color used: Tailwind sky-600 (#0284C7). Feel free to tweak the HEX color to match your brand.

## How to use

1. Open Supabase Dashboard → Authentication → Email Templates.
2. For each template (Confirm signup, Magic Link, Reset Password, Invite, etc.):
   - Switch editor to HTML mode.
   - Paste the corresponding HTML from this folder.
   - Save.
3. Variables used:
   - Link: `{{ .ConfirmationURL }}` (default for most Supabase/Gotrue templates, including magic link, reset password, and confirmation). If your template uses `{{ .ActionURL }}` in your project, replace the href accordingly.
   - Email: `{{ .Email }}`
   - App/site: we reference `MeepleGo` in text; adjust if needed.

Special notes:
- Change Email: Supabase may send two emails when changing email (to old and new address) depending on your project settings. You can use this same template for both, as the link and message are generic enough.
- Reauthentication: Triggered for sensitive actions (e.g., changing email). Uses the same `{{ .ConfirmationURL }}` link style.

Note: If your Supabase project uses different placeholders (rare), replace `{{ .ConfirmationURL }}` with the provided link variable in that specific template. The rest of the HTML can remain the same.

## Tips

- Always include the raw link fallback so users can still complete the action if buttons are blocked.
- Keep a high-contrast button color (#0284C7 on white) for accessibility.
- Avoid external CSS or web fonts—many email clients strip them.
