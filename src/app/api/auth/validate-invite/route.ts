import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabaseServer'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const code = (body?.code || '').toString().trim().toUpperCase()
    
    if (!code) {
      return NextResponse.json(
        { error: 'Invite code is required', valid: false },
        { status: 400 }
      )
    }

    const supabase = await getSupabaseServerClient()
    
    // Check if code exists and is valid
    const { data: inviteCode, error } = await supabase
      .from('invite_codes')
      .select('id, code, max_uses, current_uses, expires_at')
      .eq('code', code)
      .maybeSingle()

    if (error || !inviteCode) {
      return NextResponse.json(
        { error: 'Invalid invite code', valid: false },
        { status: 404 }
      )
    }

    // Check if code has expired
    if (inviteCode.expires_at && new Date(inviteCode.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'This invite code has expired', valid: false },
        { status: 400 }
      )
    }

    // Check if code has reached max uses
    if (inviteCode.current_uses >= inviteCode.max_uses) {
      return NextResponse.json(
        { error: 'This invite code has reached its usage limit', valid: false },
        { status: 400 }
      )
    }

    return NextResponse.json({ 
      valid: true, 
      code: inviteCode.code 
    })
  } catch (e) {
    console.error('Invite validation error:', e)
    return NextResponse.json(
      { error: 'Failed to validate invite code', valid: false },
      { status: 500 }
    )
  }
}

// Increment invite code usage when signup is successful
export async function PUT(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const code = (body?.code || '').toString().trim().toUpperCase()
    
    if (!code) {
      return NextResponse.json(
        { error: 'Invite code is required' },
        { status: 400 }
      )
    }

    const supabase = await getSupabaseServerClient()
    
    // Increment usage counter
    const { error } = await supabase
      .from('invite_codes')
      .update({ current_uses: supabase.raw('current_uses + 1') as any })
      .eq('code', code)

    if (error) {
      console.error('Error incrementing invite code usage:', error)
      return NextResponse.json(
        { error: 'Failed to update invite code' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Invite increment error:', e)
    return NextResponse.json(
      { error: 'Failed to update invite code' },
      { status: 500 }
    )
  }
}
