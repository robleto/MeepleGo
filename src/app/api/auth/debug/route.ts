import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const supabase = await getSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return NextResponse.json({
    env: {
      supabaseUrlHost: (() => {
        try {
          return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || '').host
        } catch {
          return null
        }
      })(),
      anonKeyPrefix: (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').slice(
        0,
        16
      ),
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL || null,
      nodeEnv: process.env.NODE_ENV,
    },
    sessionPresent: !!session,
    user: session?.user
      ? { id: session.user.id, email: session.user.email }
      : null,
    accessTokenLen: session?.access_token?.length || 0,
    cookieNames: ((): string[] => {
      try {
        return Array.from({ length: 0 })
      } catch {
        return []
      }
    })(),
    hint: 'If sessionPresent=false while client shows logged in, server cookies not propagating. Ensure same domain & not blocking third-party cookies.',
  })
}

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Disabled in production' },
      { status: 403 }
    )
  }
  const contentType = req.headers.get('content-type') || ''
  let body: any = {}
  if (contentType.includes('application/json')) {
    body = await req.json().catch(() => ({}))
  } else if (contentType.includes('application/x-www-form-urlencoded')) {
    const txt = await req.text()
    body = Object.fromEntries(new URLSearchParams(txt).entries())
  } else {
    body = await req.text().catch(() => '')
    if (typeof body === 'string' && body.startsWith('{')) {
      try {
        body = JSON.parse(body)
      } catch {}
    } else if (typeof body === 'string') {
      try {
        body = Object.fromEntries(new URLSearchParams(body).entries())
      } catch {}
    }
  }
  const email = body.email?.trim()
  const password = body.password
  if (!email || !password)
    return NextResponse.json(
      { error: 'Email & password required', receivedKeys: Object.keys(body) },
      { status: 400 }
    )
  const supabase = await getSupabaseServerClient()
  const start = Date.now()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  const dur = Date.now() - start
  return NextResponse.json({
    ok: !error,
    error: error?.message || null,
    status: (error as any)?.status || null,
    hasSession: !!data.session,
    durationMs: dur,
    troubleshooting: !error
      ? undefined
      : [
          'Confirm email exactly matches registered (case-insensitive).',
          'If recently reset password, ensure same Supabase project (URL host matches).',
          'Clear cookies/localStorage if migrating between envs.',
          'Check Network tab for auth/v1/token request & CORS / 4xx.',
        ],
  })
}
