import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabaseServer'

// PATCH /api/awards/:year/:category -> update winner or nominees
export async function PATCH(req: NextRequest, { params }: { params: { year: string; category: string } }) {
  const yearNum = Number(params.year)
  if (!yearNum || Number.isNaN(yearNum)) return NextResponse.json({ error: 'Invalid year' }, { status: 400 })
  const categoryId = params.category

  let body: any = {}
  const contentType = req.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    body = await req.json().catch(()=> ({}))
  } else if (contentType.includes('application/x-www-form-urlencoded')) {
    const text = await req.text()
    body = Object.fromEntries(new URLSearchParams(text).entries())
  }
  // Coerce numeric fields
  if (body.winner_id === '') body.winner_id = null
  if (body.winner_id != null) body.winner_id = Number(body.winner_id)
  if (body.add_nominee != null) body.add_nominee = Number(body.add_nominee)
  if (body.remove_nominee != null) body.remove_nominee = Number(body.remove_nominee)

  const supabase = await getSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Fetch existing row to ensure ownership (RLS also protects)
  const { data: existing, error: fetchErr } = await supabase
    .from('awards')
    .select('id, nominees, winner_id')
    .eq('profile_id', session.user.id)
    .eq('year', yearNum)
    .eq('category', categoryId)
    .maybeSingle()
  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 })

  if (!existing) {
    return NextResponse.json({ error: 'Award row not found. Rebuild first.' }, { status: 404 })
  }

  if (body.unlock) {
    const { error: unlockErr } = await supabase.from('awards').update({ manual_override: false }).eq('id', existing.id)
    if (unlockErr) return NextResponse.json({ error: unlockErr.message }, { status: 500 })
    return NextResponse.json({ ok: true, unlocked: true })
  }
  // Start from existing nominees
  let nominees: number[] = existing.nominees || []
  let winner_id = existing.winner_id
  let manual_override = true // any edit implies manual override

  if (Array.isArray(body.nominees)) {
    nominees = body.nominees.map((n: any)=>Number(n)).filter((n: any)=>!Number.isNaN(n))
  }
  if (body.add_nominee && !nominees.includes(body.add_nominee)) {
    nominees = [...nominees, body.add_nominee]
  }
  if (body.remove_nominee) {
    nominees = nominees.filter(n=>n!==body.remove_nominee)
    if (winner_id === body.remove_nominee) winner_id = null
  }
  if ('winner_id' in body) {
    winner_id = body.winner_id
    if (winner_id && !nominees.includes(winner_id)) nominees = [...nominees, winner_id]
  }
  if (body.manual_override === false) manual_override = false

  const patch: any = { refreshed_at: new Date().toISOString(), stale: false, nominees, winner_id, manual_override }

  const { error: updErr } = await supabase.from('awards').update(patch).eq('id', existing.id)

  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
