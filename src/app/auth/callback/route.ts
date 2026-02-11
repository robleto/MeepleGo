// Minimal GET handler to avoid 405s and immediately hand off to a client page
// that can access the URL hash (Supabase tokens). We cannot read the hash on
// the server, so we emit a tiny HTML document that preserves the full URL and
// client-redirects to /auth/callback/handle for processing.

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
	// Prefer server-side code exchange (PKCE flow). This is the most reliable for
	// email confirmations, magic links, and password recovery in modern Supabase.
	try {
		const url = new URL(req.url)
		const code = url.searchParams.get('code')
		if (code) {
			const supabase = await getSupabaseServerClient()
			const { error } = await supabase.auth.exchangeCodeForSession(code)
			if (error) {
				const redirectUrl = new URL('/login', url.origin)
				redirectUrl.searchParams.set('error', error.message)
				return NextResponse.redirect(redirectUrl)
			}

			const type = url.searchParams.get('type')
			const next = url.searchParams.get('next')
			const destination = type === 'recovery' ? '/update-password' : next || '/'
			return NextResponse.redirect(new URL(destination, url.origin))
		}
	} catch {
		// Fall through to client-side handler
	}

  const html = `<!doctype html>
		<html>
			<head>
				<meta charset="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<title>Redirecting…</title>
				<script>
					(function() {
						try {
							var search = window.location.search || '';
							var hash = window.location.hash || '';
							// Route to a client page so it can read hash tokens
							var target = '/auth/callback/handle' + search + hash;
							window.location.replace(target);
						} catch (e) {
							// As a fallback, go to the handle page without params
							window.location.replace('/auth/callback/handle');
						}
					})();
				</script>
			</head>
			<body>
				Redirecting…
			</body>
		</html>`
  return new Response(html, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  })
}
