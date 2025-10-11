import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabaseServer'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const raw = (body?.username || '').toString().trim()
    if (!raw) {
      return NextResponse.json(
        { error: 'username required' },
        { status: 400 }
      )
    }
    const username = raw
    const supabase = await getSupabaseServerClient()
    // Case-insensitive exact match using ILIKE without wildcards
    const { data, error } = await supabase
      .from('profiles')
      .select('email')
      .ilike('username', username)
      .limit(1)
      .maybeSingle()

    if (error) {
      // Do not leak details; respond as not found
      return NextResponse.json({ error: 'not found' }, { status: 404 })
    }
    if (!data || !data.email) {
      return NextResponse.json({ error: 'not found' }, { status: 404 })
    }
    return NextResponse.json({ email: data.email })
  } catch (e) {
    return NextResponse.json({ error: 'bad request' }, { status: 400 })
  }
}
