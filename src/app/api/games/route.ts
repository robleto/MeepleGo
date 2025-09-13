import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const sort = searchParams.get('sort') || 'rank'
    const orderBy = searchParams.get('orderBy') || 'asc'

    let query = supabase
      .from('games')
      .select('*')

    // Apply sorting
    const ascending = orderBy === 'asc'
    query = query.order(sort, { ascending })

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
      total: games?.length || 0
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}