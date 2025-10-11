import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabaseServer'

// POST /api/rankings/reorder
// Body: { gameIds: string[], enableCustomOrder?: boolean }
export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const gameIds: string[] = Array.isArray(body?.gameIds) ? body.gameIds : []
  const enableCustomOrder: boolean | undefined = body?.enableCustomOrder
  if (!gameIds.length)
    return NextResponse.json({ error: 'gameIds required' }, { status: 400 })

  const userId = session.user.id

  // Ensure preferences row exists (idempotent upsert)
  await supabase
    .from('user_preferences')
    .upsert({ user_id: userId }, { onConflict: 'user_id' })

  // Optionally set custom order flag
  if (typeof enableCustomOrder === 'boolean') {
    await supabase
      .from('user_preferences')
      .update({ rankings_custom_order_enabled: enableCustomOrder })
      .eq('user_id', userId)
  }

  const { error } = await supabase.rpc('reorder_rankings', {
    p_user_id: userId,
    p_ordered_game_ids: gameIds,
  })
  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ ok: true })
}

// PUT /api/rankings/reorder -> reset
export async function PUT() {
  const supabase = await getSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id
  const { error } = await supabase.rpc('reset_rankings_order', {
    p_user_id: userId,
  })
  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ ok: true })
}
