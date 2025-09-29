import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  // Safety: dev-only endpoint
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Disabled in production' },
      { status: 403 }
    )
  }

  let email = ''
  try {
    const body = await req.json()
    email = String(body?.email || '').trim()
  } catch {}

  if (!email) {
    return NextResponse.json({ error: 'Missing email' }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { error: 'Missing Supabase env (URL or SERVICE_ROLE_KEY)' },
      { status: 500 }
    )
  }

  const redirectBase =
    process.env.NEXT_PUBLIC_AUTH_REDIRECT_BASE || 'http://localhost:3001'
  // Use plain callback path (no query) to ease allowlist matching
  const redirectTo = `${redirectBase}/auth/callback`

  const admin = createClient(supabaseUrl, serviceKey)
  try {
    const { data, error } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo },
    } as any)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Supabase returns action_link or properties containing the full verify URL
    const link =
      (data as any)?.properties?.action_link ||
      (data as any)?.action_link ||
      null
    return NextResponse.json({ link, redirectTo })
  } catch (e: any) {
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    )
  }
}
