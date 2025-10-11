import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabaseServer'

// POST /api/lists/:id/reorder
// Body: { itemIds: string[] }
export async function POST(req: Request) {
  try {
    const url = new URL(req.url)
    const parts = url.pathname.split('/').filter(Boolean)
    const idx = parts.indexOf('lists')
    const listId = idx >= 0 && parts[idx + 1] ? parts[idx + 1] : ''
    if (!listId)
      return NextResponse.json({ error: 'Invalid list id' }, { status: 400 })
    const { itemIds } = await req.json()
    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json({ error: 'itemIds required' }, { status: 400 })
    }
    const supabase = await getSupabaseServerClient()
    // Ensure caller owns the list (RLS on rpc may not be enough in some setups)
    const { data: list, error: listErr } = await supabase
      .from('game_lists')
      .select('id,user_id')
      .eq('id', listId)
      .maybeSingle()
    if (listErr || !list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 })
    }
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user || user.id !== list.user_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const { error } = await supabase.rpc('reorder_list_items', {
      p_list_id: listId,
      p_ordered_item_ids: itemIds,
    })
    if (error) {
      console.error('reorder rpc failed', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}

// POST /api/lists/:id/reset-order
export async function PUT(req: Request) {
  try {
    const url = new URL(req.url)
    const parts = url.pathname.split('/').filter(Boolean)
    const idx = parts.indexOf('lists')
    const listId = idx >= 0 && parts[idx + 1] ? parts[idx + 1] : ''
    if (!listId)
      return NextResponse.json({ error: 'Invalid list id' }, { status: 400 })
    const supabase = await getSupabaseServerClient()
    const { data: list, error: listErr } = await supabase
      .from('game_lists')
      .select('id,user_id')
      .eq('id', listId)
      .maybeSingle()
    if (listErr || !list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 })
    }
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user || user.id !== list.user_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const { error } = await supabase.rpc('reset_list_order', { p_list_id: listId })
    if (error) {
      console.error('reset rpc failed', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}