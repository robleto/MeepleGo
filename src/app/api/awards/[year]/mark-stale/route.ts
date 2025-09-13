import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabaseServer'

// POST /api/awards/:year/mark-stale -> marks non-manual awards as stale (for when rankings change)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ year: string }> }
) {
  const resolvedParams = await params
  const yearNum = Number(resolvedParams.year)
  if (!yearNum || Number.isNaN(yearNum))
    return NextResponse.json({ error: 'Invalid year' }, { status: 400 })
  const supabase = await getSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('awards')
    .update({ stale: true })
    .eq('user_id', session.user.id)
    .eq('year', yearNum)
    .eq('manual_override', false)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
