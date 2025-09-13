import { NextRequest, NextResponse } from 'next/server'
import {
  getSupabaseServerClient,
  getSupabaseServerClientWithAccessToken,
} from '@/lib/supabaseServer'

// Simple CRUD style handler for play logs
// GET: /api/play-logs?gameId=... returns current user's logs (or public if user not owner)
// POST: create new log { game_id, played_at?, rating?, notes?, player_count?, duration_minutes?, location?, tags?, is_public? }
// PATCH: update existing log { id, ...fields }
// DELETE: { id }

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const gameId = url.searchParams.get('gameId')
    const targetUserId = url.searchParams.get('userId') || null
    const limit = Math.min(
      100,
      Math.max(1, Number(url.searchParams.get('limit') || '25'))
    )
    const cursor = url.searchParams.get('cursor') // ISO timestamp of last seen played_at
    let supabase = await getSupabaseServerClient()
    let {
      data: { session },
    } = await supabase.auth.getSession()
    const authHeader = req.headers.get('authorization')
    if ((!session || !session.user) && authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7)
      supabase = await getSupabaseServerClientWithAccessToken(token)
      const { data: userData } = await supabase.auth.getUser(token)
      if (userData.user) session = { user: userData.user } as any
    }

    let query = supabase
      .from('play_logs')
      .select('*')
      .order('played_at', { ascending: false })
      .limit(limit + 1) // fetch one extra to know if there is more

    if (gameId) query = query.eq('game_id', gameId)

    // Target user precedence: if provided, show that user's public logs (or all if it's self)
    if (targetUserId) {
      if (session && session.user.id === targetUserId) {
        query = query.eq('user_id', targetUserId)
      } else {
        query = query.eq('user_id', targetUserId).eq('is_public', true)
      }
    } else if (session) {
      if (gameId) {
        // For a game page show current user's logs & public logs from others
        query = query.or(
          `user_id.eq.${session.user.id},is_public.eq.true` as any
        )
      } else {
        query = query.eq('user_id', session.user.id)
      }
    } else {
      query = query.eq('is_public', true)
    }

    if (cursor) {
      // Only logs before (strictly less than) the cursor timestamp
      query = query.lt('played_at', cursor)
    }

    const { data, error } = await query
    if (error) throw error
    let nextCursor: string | null = null
    let logs = data || []
    if (logs.length === limit + 1) {
      const last = logs.pop()!
      nextCursor = last.played_at
    }
    return NextResponse.json({ logs, nextCursor })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const authHeader = req.headers.get('authorization')
    let supabase = await getSupabaseServerClient()
    let {
      data: { session },
    } = await supabase.auth.getSession()
    if ((!session || !session.user) && authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7)
      supabase = await getSupabaseServerClientWithAccessToken(token)
      const { data: userData } = await supabase.auth.getUser(token)
      if (userData.user) session = { user: userData.user } as any
    }
    let userId = session?.user.id
    let bearerToken: string | null = null
    if (!userId && authHeader?.startsWith('Bearer ')) {
      bearerToken = authHeader.slice(7)
      // Recreate client with token so RLS sees auth.uid()
      supabase = await getSupabaseServerClientWithAccessToken(bearerToken)
      const { data: userData } = await supabase.auth.getUser(bearerToken)
      userId = userData.user?.id
    }
    if (!userId)
      return NextResponse.json({ error: 'Auth required' }, { status: 401 })

    const insert = {
      user_id: userId,
      game_id: body.game_id,
      played_at: body.played_at ?? new Date().toISOString(),
      rating: body.rating ?? null,
      player_count: body.player_count ?? null,
      duration_minutes: body.duration_minutes ?? null,
      location: body.location ?? null,
      notes: body.notes ?? null,
      tags: body.tags ?? null,
      is_public: body.is_public ?? true,
    }

    const { data, error } = await supabase
      .from('play_logs')
      .insert(insert)
      .select()
      .single()
    if (error) throw error
    return NextResponse.json({ log: data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 })
    }
    let supabase = await getSupabaseServerClient()
    let {
      data: { session },
    } = await supabase.auth.getSession()
    const authHeader = req.headers.get('authorization')
    let userId = session?.user.id
    if (!userId && authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7)
      supabase = await getSupabaseServerClientWithAccessToken(token)
      const { data: userData } = await supabase.auth.getUser(token)
      userId = userData.user?.id
    }
    if (!userId)
      return NextResponse.json({ error: 'Auth required' }, { status: 401 })

    // Ensure ownership by selecting first (policy also enforces)
    const { data: existing, error: existingErr } = await supabase
      .from('play_logs')
      .select('user_id')
      .eq('id', body.id)
      .maybeSingle()
    if (existingErr) throw existingErr
    if (!existing)
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (existing.user_id !== userId)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const patch: any = { ...body }
    delete patch.id

    const { data, error } = await supabase
      .from('play_logs')
      .update(patch)
      .eq('id', body.id)
      .select()
      .single()
    if (error) throw error
    return NextResponse.json({ log: data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 })
    }
    const authHeader = req.headers.get('authorization')
    let supabase = await getSupabaseServerClient()
    let {
      data: { session },
    } = await supabase.auth.getSession()
    let userId = session?.user.id
    if (!userId && authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7)
      supabase = await getSupabaseServerClientWithAccessToken(token)
      const { data: userData } = await supabase.auth.getUser(token)
      userId = userData.user?.id
    }
    if (!userId)
      return NextResponse.json({ error: 'Auth required' }, { status: 401 })

    const { error } = await supabase
      .from('play_logs')
      .delete()
      .eq('id', body.id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
