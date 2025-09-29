import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Get all lists to see what's in the database
    const { data: allLists, error: allError } = await supabase
      .from('game_lists')
      .select('id, name, is_public, list_type, user_id')
      .limit(20)

    console.log('All lists:', allLists)

    // Get specifically public lists
    const { data: publicLists, error: publicError } = await supabase
      .from('game_lists')
      .select('id, name, is_public, list_type, user_id')
      .eq('is_public', true)

    console.log('Public lists:', publicLists)

    return NextResponse.json({
      allLists: allLists || [],
      allListsError: allError,
      publicLists: publicLists || [],
      publicListsError: publicError,
      summary: {
        totalLists: allLists?.length || 0,
        publicLists: publicLists?.length || 0,
      },
    })
  } catch (error) {
    console.error('Debug lists error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lists' },
      { status: 500 }
    )
  }
}
