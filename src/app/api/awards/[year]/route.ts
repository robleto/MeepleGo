import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabaseServer'

// GET /api/awards/:year -> returns stored awards rows for that user & year
export async function GET(req: NextRequest, { params }: { params: { year: string } }) {
  const yearNum = Number(params.year)
  if (!yearNum || Number.isNaN(yearNum)) return NextResponse.json({ error: 'Invalid year' }, { status: 400 })

  const supabase = await getSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('awards')
    .select('id, year, category, nominees, winner_id, updated_at, created_at, threshold_used, manual_override, refreshed_at, stale')
    .eq('profile_id', session.user.id)
    .eq('year', yearNum)
    .order('category')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ year: yearNum, awards: data || [] })
}
