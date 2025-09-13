import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabaseServer'

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const supabase = await getSupabaseServerClient()
    const { data, error } = await supabase
      .from('list_slug_cache')
      .select('slug,updated_at')
      .eq('list_id', params.id)
      .maybeSingle()
    if (error) throw error
    if (!data) return NextResponse.json({ cache: null }, { status: 200 })
    return NextResponse.json({ cache: data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const { slug } = await req.json()
    if (!slug)
      return NextResponse.json({ error: 'slug required' }, { status: 400 })
    const supabase = await getSupabaseServerClient()
    // Upsert slug
    const { error } = await supabase.from('list_slug_cache').upsert({
      list_id: params.id,
      slug,
      updated_at: new Date().toISOString(),
    })
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
