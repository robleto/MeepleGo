import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabaseServer'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

// PATCH /api/awards/:year/:category -> update winner or nominees
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ year: string; category: string }> }
) {
  const resolvedParams = await params
  const yearNum = Number(resolvedParams.year)
  if (!yearNum || Number.isNaN(yearNum))
    return NextResponse.json({ error: 'Invalid year' }, { status: 400 })
  const categoryId = resolvedParams.category

  let body: any = {}
  const contentType = req.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    body = await req.json().catch(() => ({}))
  } else if (contentType.includes('application/x-www-form-urlencoded')) {
    const text = await req.text()
    body = Object.fromEntries(new URLSearchParams(text).entries())
  }
  // Normalize ID fields (award game IDs are UUID strings)
  if (body.winner_id === '') body.winner_id = null
  if (body.winner_id != null) body.winner_id = String(body.winner_id)
  if (body.add_nominee != null) body.add_nominee = String(body.add_nominee)
  if (body.remove_nominee != null)
    body.remove_nominee = String(body.remove_nominee)

  let supabase = await getSupabaseServerClient()
  let {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    const authHeader = req.headers.get('authorization') || ''
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7)
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      const bearerClient = createClient<Database>(supabaseUrl, supabaseAnon, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      })
      const { data: userData } = await bearerClient.auth.getUser()
      if (userData.user) {
        supabase = bearerClient as any
        session = { user: userData.user } as any
      }
    }
  }
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Fetch existing row to ensure ownership (RLS also protects)
  const { data: existing, error: fetchErr } = await supabase
    .from('awards')
    .select('id, nominees, winner_id, manual_override')
    .eq('user_id', session.user.id)
    .eq('year', yearNum)
    .eq('category', categoryId)
    .maybeSingle()
  if (fetchErr)
    return NextResponse.json({ error: fetchErr.message }, { status: 500 })

  if (!existing) {
    const nominees: any[] = Array.isArray(body.nominees)
      ? body.nominees.map((n: any) => String(n))
      : []
    const winner_id = body.winner_id ? String(body.winner_id) : null
    if (winner_id && !nominees.includes(winner_id)) {
      nominees.push(winner_id)
    }
    const { error: insertErr } = await supabase
      .from('awards')
      .upsert(
        {
          user_id: session.user.id,
          year: yearNum,
          category: categoryId,
          nominees,
          winner_id,
          manual_override: true,
          refreshed_at: new Date().toISOString(),
          stale: false,
        },
        { onConflict: 'user_id,year,category' }
      )
    if (insertErr) {
      return NextResponse.json(
        { error: insertErr.message },
        { status: 500 }
      )
    }
    return NextResponse.json({ ok: true, created: true })
  }

  if (body.unlock) {
    const { error: unlockErr } = await supabase
      .from('awards')
      .update({ manual_override: false })
      .eq('id', existing.id)
    if (unlockErr)
      return NextResponse.json({ error: unlockErr.message }, { status: 500 })
    return NextResponse.json({ ok: true, unlocked: true })
  }
  // Start from existing nominees
  let nominees: any[] = existing.nominees || []
  let winner_id: any = existing.winner_id
  let manual_override = true // any edit implies manual override

  if (Array.isArray(body.nominees)) {
    nominees = body.nominees.map((n: any) => String(n))
  }
  if (body.add_nominee && !nominees.includes(String(body.add_nominee))) {
    nominees = [...nominees, String(body.add_nominee)]
  }
  if (body.remove_nominee) {
    nominees = nominees.filter((n) => n !== String(body.remove_nominee))
    if (winner_id === body.remove_nominee) winner_id = null
  }
  if ('winner_id' in body) {
    winner_id = body.winner_id ? String(body.winner_id) : null
    if (winner_id && !nominees.includes(winner_id))
      nominees = [...nominees, winner_id]
  }
  if (body.manual_override === false) manual_override = false

  const patch: any = {
    refreshed_at: new Date().toISOString(),
    stale: false,
    nominees,
    winner_id,
    manual_override,
  }

  const { error: updErr } = await supabase
    .from('awards')
    .update(patch)
    .eq('id', existing.id)

  if (updErr)
    return NextResponse.json({ error: updErr.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
