import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabaseServer'

// Simple in-memory rate limiter (per IP) for POST: limit N per window
const RL_WINDOW_MS = 60 * 60 * 1000 // 1 hour
const RL_MAX = 5
type RLRecord = { count: number; windowStart: number }
const rateMap: Record<string, RLRecord> = {}
function checkRate(ip: string): { ok: boolean; remaining: number; reset: number } {
  const now = Date.now()
  const rec = rateMap[ip]
  if (!rec || now - rec.windowStart > RL_WINDOW_MS) {
    rateMap[ip] = { count: 1, windowStart: now }
    return { ok: true, remaining: RL_MAX - 1, reset: now + RL_WINDOW_MS }
  }
  if (rec.count >= RL_MAX) {
    return { ok: false, remaining: 0, reset: rec.windowStart + RL_WINDOW_MS }
  }
  rec.count++
  return { ok: true, remaining: RL_MAX - rec.count, reset: rec.windowStart + RL_WINDOW_MS }
}

// POST only: create missing game request
export async function POST(req: NextRequest) {
  try {
    const { name, year, publisher } = await req.json()
    // Rate limit
    const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown'
    const rl = checkRate(ip)
    if (!rl.ok) {
      return NextResponse.json({ error: 'Rate limit exceeded. Try later.' }, { status: 429, headers: { 'Retry-After': Math.ceil((rl.reset - Date.now())/1000).toString() } })
    }
    if (!name || typeof name !== 'string') return NextResponse.json({ error: 'name required' }, { status: 400 })
    const supabase = await getSupabaseServerClient()
    const { data: { session } } = await supabase.auth.getSession()
    const insert = {
      user_id: session?.user.id || null,
      name: name.trim(),
      year_published: year ? Number(year) : null,
      publisher: publisher ? String(publisher).trim() : null,
    }
    const { data, error } = await supabase.from('missing_game_requests').insert(insert).select().single()
    if (error) throw error
  return NextResponse.json({ request: data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// Admin listing (GET) with optional status filter
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const status = url.searchParams.get('status')
    const supabase = await getSupabaseServerClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Auth required' }, { status: 401 })
    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', session.user.id).maybeSingle()
    if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    let q = supabase.from('missing_game_requests').select('*').order('created_at', { ascending: false }).limit(200)
    if (status) q = q.eq('status', status)
    const { data, error } = await q
    if (error) throw error
    return NextResponse.json({ requests: data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// PATCH: update status (admin only)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const supabase = await getSupabaseServerClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Auth required' }, { status: 401 })
    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', session.user.id).maybeSingle()
    if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const patch: any = {}
    if (body.status) patch.status = body.status
    if (body.status === 'imported' || body.status === 'rejected') patch.processed_at = new Date().toISOString()
    const { data, error } = await supabase
      .from('missing_game_requests')
      .update(patch)
      .eq('id', body.id)
      .select()
      .maybeSingle()
    if (error) throw error
    return NextResponse.json({ request: data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
