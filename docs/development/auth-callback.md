# Auth Callback Pattern (Supabase + Next.js App Router)

This app uses a client-first callback handling pattern that plays nicely with Supabase auth tokens provided in the URL hash.

Key points:

- Supabase recovery/magic links place access tokens in the URL hash. Servers cannot read the hash, so server routes must not attempt to process the callback.
- We serve `/auth/callback` via a minimal server GET handler that immediately client-redirects to `/auth/callback/handle`, preserving `search` and `hash`.
- The client page at `/auth/callback/handle` reads the hash, lets the Supabase client hydrate the session (`getSession()` retry loop), then routes to `/update-password` for recovery or to `next`/`/` for regular login.
- The Supabase redirect allowlist must include the full callback URL (e.g., `http://localhost:3001/auth/callback` and production). Using a plain path for `redirectTo` often improves allowlist matching.

Files:

- `src/app/auth/callback/route.ts` – Emits a small HTML page with a script that redirects to `/auth/callback/handle` while preserving hash.
- `src/app/auth/callback/handle/page.tsx` – Client component that performs token parsing, session hydration, and redirects.
- `src/app/api/auth/generate-recovery/route.ts` – Dev-only helper to generate a recovery link with `redirect_to` targeting the callback; guarded by `NODE_ENV !== 'development'`.

Why not a server route for `/auth/callback`?

Route handlers cannot pass through to pages, and they can’t access the hash. If a server handler exists and tries to “own” `/auth/callback`, you risk intercepting the request and breaking client-side session hydration, resulting in 405s or lost tokens.

Troubleshooting:

- Seeing `#error=access_denied&error_code=otp_expired`? Ensure you used the newest email link, your redirect is allowlisted, and the environment (dev/prod) matches the project.
- If the callback renders but you don’t get a session, clear cookies/localStorage for this site and try again.
- Confirm Supabase templates use `{{ .ConfirmationURL }}` for verification flows.
