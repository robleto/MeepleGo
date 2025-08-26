import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabaseServer'

// POST /api/awards/:year/mark-stale  -> mark non-manual awards stale after ranking changes
export async function POST(_req: NextRequest, { params }: { params: { year: string } }) {
  const yearNum = Number(params.year)
  if (!yearNum || Number.isNaN(yearNum)) return NextResponse.json({ error: 'Invalid year' }, { status: 400 })
  const supabase = await getSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('awards')
    .update({ stale: true })
    .eq('profile_id', session.user.id)
    .eq('year', yearNum)
    .eq('manual_override', false)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
