import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('Starting rankings cleanup...')
    
    // Use service role for admin access
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // First, check what we have
    const { data: allRankings, error: countError } = await supabaseAdmin
      .from('rankings')
      .select('id, ranking, played_it, game_id, user_id')
    
    if (countError) {
      console.error('Error fetching rankings:', countError)
      return Response.json({ error: countError.message }, { status: 500 })
    }
    
    console.log(`Total rankings entries: ${allRankings.length}`)
    
    const withRankings = allRankings.filter(r => typeof r.ranking === 'number' && r.ranking >= 1 && r.ranking <= 10)
    const withoutRankings = allRankings.filter(r => r.ranking === null)
    
    console.log(`- With actual rankings (1-10): ${withRankings.length}`)
    console.log(`- Without rankings (null): ${withoutRankings.length}`)
    
    if (withoutRankings.length === 0) {
      return Response.json({ 
        message: 'No cleanup needed!',
        total: allRankings.length,
        withRankings: withRankings.length,
        withoutRankings: 0
      })
    }
    
    // Delete entries without rankings
    console.log(`Deleting ${withoutRankings.length} entries without rankings...`)
    
    const { error: deleteError } = await supabaseAdmin
      .from('rankings')
      .delete()
      .is('ranking', null)
    
    if (deleteError) {
      console.error('Error deleting entries:', deleteError)
      return Response.json({ error: deleteError.message }, { status: 500 })
    }
    
    console.log('✅ Cleanup completed!')
    
    // Verify cleanup
    const { data: afterCleanup, error: verifyError } = await supabaseAdmin
      .from('rankings')
      .select('id, ranking')
    
    if (verifyError) {
      console.error('Error verifying cleanup:', verifyError)
    }
    
    return Response.json({
      message: 'Cleanup completed successfully!',
      deletedCount: withoutRankings.length,
      remainingCount: afterCleanup?.length || 0,
      beforeCleanup: {
        total: allRankings.length,
        withRankings: withRankings.length,
        withoutRankings: withoutRankings.length
      }
    })
    
  } catch (error) {
    console.error('Cleanup failed:', error)
    return Response.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
