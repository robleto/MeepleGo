import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabaseServer'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const sort = searchParams.get('sort') || 'rank'
    const orderBy = searchParams.get('orderBy') || 'asc'
    const q = (searchParams.get('q') || '').trim()

    const supabase = await getSupabaseServerClient()
    let query = supabase.from('games').select('*')

    // Name search (case-insensitive substring match)
    if (q) {
      // If searching, prefer ordering by name for UX
      query = query.ilike('name', `%${q}%`).order('name', { ascending: true })
    } else {
      // Apply sorting only when not searching
      const ascending = orderBy === 'asc'
      query = query.order(sort, { ascending })
    }

    // Apply limit
    query = query.limit(limit)

    const { data: games, error } = await query

    if (error) {
      console.error('Error fetching games:', error)
      return NextResponse.json(
        { error: 'Failed to fetch games' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      games: games || [],
      total: games?.length || 0,
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
