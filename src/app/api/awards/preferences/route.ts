import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabaseServer'

export async function GET() {
  const supabase = await getSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data } = await supabase
    .from('user_preferences')
    .select('awards_custom_order_enabled')
    .eq('user_id', session.user.id)
    .maybeSingle()
  return NextResponse.json({ awards_custom_order_enabled: !!data?.awards_custom_order_enabled })
}

export async function POST(req: Request) {
  const supabase = await getSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const enabled = !!body?.awards_custom_order_enabled
  // Ensure row exists
  await supabase
    .from('user_preferences')
    .upsert({ user_id: session.user.id }, { onConflict: 'user_id' })
  const { error } = await supabase
    .from('user_preferences')
    .update({ awards_custom_order_enabled: enabled })
    .eq('user_id', session.user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
