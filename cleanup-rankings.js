const { createClient } = require('@supabase/supabase-js')

// Cleanup script to remove ranking entries without actual rankings
async function cleanupRankings() {
  console.log('Starting rankings cleanup...')
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  
  try {
    // First, check what we have
    const { data: allRankings, error: countError } = await supabase
      .from('rankings')
      .select('id, ranking, played_it, game_id')
    
    if (countError) {
      console.error('Error fetching rankings:', countError)
      return
    }
    
    console.log(`Total rankings entries: ${allRankings.length}`)
    
    const withRankings = allRankings.filter(r => typeof r.ranking === 'number')
    const withoutRankings = allRankings.filter(r => r.ranking === null)
    
    console.log(`- With actual rankings (1-10): ${withRankings.length}`)
    console.log(`- Without rankings (null): ${withoutRankings.length}`)
    
    if (withoutRankings.length === 0) {
      console.log('No cleanup needed!')
      return
    }
    
    console.log('\nEntries to delete (sample):')
    withoutRankings.slice(0, 5).forEach(r => {
      console.log(`- ID: ${r.id}, played_it: ${r.played_it}, game_id: ${r.game_id}`)
    })
    
    // Delete entries without rankings
    console.log(`\nDeleting ${withoutRankings.length} entries without rankings...`)
    
    const { error: deleteError } = await supabase
      .from('rankings')
      .delete()
      .is('ranking', null)
    
    if (deleteError) {
      console.error('Error deleting entries:', deleteError)
      return
    }
    
    console.log('✅ Cleanup completed!')
    console.log(`Deleted ${withoutRankings.length} entries without rankings`)
    console.log(`Kept ${withRankings.length} entries with actual rankings`)
    
    // Verify cleanup
    const { data: afterCleanup, error: verifyError } = await supabase
      .from('rankings')
      .select('id, ranking')
    
    if (!verifyError && afterCleanup) {
      console.log(`\nVerification: ${afterCleanup.length} total entries remaining`)
      const nullCount = afterCleanup.filter(r => r.ranking === null).length
      console.log(`- Entries with null rankings: ${nullCount}`)
    }
    
  } catch (error) {
    console.error('Cleanup failed:', error)
  }
}

cleanupRankings()
