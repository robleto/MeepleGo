import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
const listNameCache: Record<string, { slug: string; ts: number }> = {}

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

function createMiddlewareSupabaseClient(req: NextRequest, res: NextResponse) {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          res.cookies.set(name, value, options)
        })
      },
    },
  })
}

// Redirect legacy /lists/:uuid to /lists/:slugified-name-:uuid
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  // Match /lists/<uuid>
  const listUuidMatch = pathname.match(/^\/lists\/([0-9a-fA-F-]{36})$/)
  if (listUuidMatch) {
    const uuid = listUuidMatch[1]
    // fetch list name from API route (edge-friendly: call Postgrest) - keep lightweight
    try {
      const now = Date.now()
      const cached = listNameCache[uuid]
      if (cached && now - cached.ts < 1000 * 60 * 5) {
        // 5 min
        const url = req.nextUrl.clone()
        url.pathname = `/lists/${cached.slug}-${uuid}`
        return NextResponse.redirect(url, 308)
      }
      const origin = req.nextUrl.origin
      // Try persistent cache API first
      try {
        const cacheRes = await fetch(`${origin}/api/list-slug-cache/${uuid}`)
        if (cacheRes.ok) {
          const cacheJson = await cacheRes.json()
          if (cacheJson?.cache?.slug) {
            listNameCache[uuid] = { slug: cacheJson.cache.slug, ts: now }
            const url = req.nextUrl.clone()
            url.pathname = `/lists/${cacheJson.cache.slug}-${uuid}`
            return NextResponse.redirect(url, 308)
          }
        }
      } catch (_) {
        /* ignore */
      }
      const res = await fetch(`${origin}/api/lists/${uuid}`, {
        headers: { 'x-mg-mw': '1' },
      })
      if (res.ok) {
        const json = await res.json()
        const name: string = json?.list?.name || 'list'
        const slug = name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .slice(0, 60)
        listNameCache[uuid] = { slug, ts: now }
        // Fire and forget persist
        fetch(`${origin}/api/list-slug-cache/${uuid}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug }),
        }).catch(() => {})
        const url = req.nextUrl.clone()
        url.pathname = `/lists/${slug}-${uuid}`
        return NextResponse.redirect(url, 308)
      }
    } catch (_) {
      /* ignore */
    }
  }

  // Supabase SSR: refresh session cookies on every request.
  // This prevents "logged out" behavior in server components and after redirects.
  const res = NextResponse.next()
  try {
    const supabase = createMiddlewareSupabaseClient(req, res)
    const { data: { user } } = await supabase.auth.getUser()

    // Protected routes: redirect unauthenticated users to login
    const protectedPrefixes = ['/profile', '/settings', '/import']
    const isProtected = protectedPrefixes.some((prefix) => pathname.startsWith(prefix))

    if (isProtected && !user) {
      const loginUrl = req.nextUrl.clone()
      loginUrl.pathname = '/login'
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Auth pages: redirect authenticated users away from login/signup
    const authPrefixes = ['/login', '/signup']
    const isAuthPage = authPrefixes.some((prefix) => pathname.startsWith(prefix))

    if (isAuthPage && user) {
      const homeUrl = req.nextUrl.clone()
      homeUrl.pathname = '/profile'
      return NextResponse.redirect(homeUrl)
    }
  } catch {
    // Non-fatal: middleware should not block requests if Supabase is unavailable.
  }
  return res
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
}
