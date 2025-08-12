import { supabase } from '@/lib/supabase'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 })
    }

    console.log('Checking data for user:', user.id)

    // Check user's lists
    const { data: lists, error: listsError } = await supabase
      .from('game_lists')
      .select('*')
      .eq('user_id', user.id)

    if (listsError) {
      console.error('Error fetching lists:', listsError)
      return Response.json({ error: listsError.message }, { status: 500 })
    }

    console.log('User lists:', lists)

    // Check library items
    let libraryItems = []
    if (lists && lists.length > 0) {
      const libraryList = lists.find(l => l.name === 'Library')
      if (libraryList) {
        const { data: items, error: itemsError } = await supabase
          .from('game_list_items')
          .select(`
            *,
            games (id, name, year_published)
          `)
          .eq('list_id', libraryList.id)

        if (itemsError) {
          console.error('Error fetching library items:', itemsError)
        } else {
          libraryItems = items || []
        }
      }
    }

    // Check rankings
    const { data: rankings, error: rankingsError } = await supabase
      .from('rankings')
      .select(`
        *,
        games (id, name, year_published)
      `)
      .eq('user_id', user.id)

    if (rankingsError) {
      console.error('Error fetching rankings:', rankingsError)
    }

    return Response.json({
      user_id: user.id,
      lists: lists || [],
      library_items: libraryItems,
      library_count: libraryItems.length,
      rankings: rankings || [],
      rankings_count: (rankings || []).length,
      rankings_with_actual_ratings: (rankings || []).filter(r => typeof r.ranking === 'number').length,
      rankings_played_only: (rankings || []).filter(r => r.ranking === null && r.played_it === true).length
    })

  } catch (error) {
    console.error('Debug failed:', error)
    return Response.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
