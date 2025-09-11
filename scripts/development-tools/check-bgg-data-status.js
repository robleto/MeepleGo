#!/usr/bin/env node

// Load environment variables
const dotenv = require('dotenv')
dotenv.config({ path: '.env' })

const { createClient } = require('@supabase/supabase-js')

async function checkBggDataStatus() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  try {
    // Get total count
    const { count: totalGames, error: totalError } = await supabase
      .from('games')
      .select('id', { count: 'exact', head: true })

    // Get count with ratings
    const { count: gamesWithRating, error: ratingError } = await supabase
      .from('games')
      .select('id', { count: 'exact', head: true })
      .not('rating', 'is', null)

    // Get count with ranks
    const { count: gamesWithRank, error: rankError } = await supabase
      .from('games')
      .select('id', { count: 'exact', head: true })
      .not('rank', 'is', null)

    // Get count with both
    const { count: gamesWithBoth, error: bothError } = await supabase
      .from('games')
      .select('id', { count: 'exact', head: true })
      .not('rating', 'is', null)
      .not('rank', 'is', null)

    // Get sample games with BGG data
    const { data: sampleWithBgg, error: sampleError } = await supabase
      .from('games')
      .select('id, name, rating, rank, num_ratings')
      .not('rating', 'is', null)
      .order('rating', { ascending: false })
      .limit(5)

    // Get sample games without BGG data
    const { data: sampleWithoutBgg, error: sampleWithoutError } = await supabase
      .from('games')
      .select('id, name, rating, rank, num_ratings')
      .is('rating', null)
      .is('rank', null)
      .limit(5)

    if (totalError || ratingError || rankError || bothError || sampleError || sampleWithoutError) {
      console.error('Error querying database:', { totalError, ratingError, rankError, bothError, sampleError, sampleWithoutError })
      return
    }

    console.log('📊 BGG Data Status Report')
    console.log('========================')
    console.log(`📚 Total games in database: ${totalGames?.toLocaleString() || 'Unknown'}`)
    console.log(`⭐ Games with BGG ratings: ${gamesWithRating?.toLocaleString() || 0} (${totalGames ? ((gamesWithRating / totalGames) * 100).toFixed(1) : 0}%)`)
    console.log(`🏆 Games with BGG ranks: ${gamesWithRank?.toLocaleString() || 0} (${totalGames ? ((gamesWithRank / totalGames) * 100).toFixed(1) : 0}%)`)
    console.log(`✅ Games with both rating & rank: ${gamesWithBoth?.toLocaleString() || 0} (${totalGames ? ((gamesWithBoth / totalGames) * 100).toFixed(1) : 0}%)`)
    
    const missingRatings = totalGames - (gamesWithRating || 0)
    const missingRanks = totalGames - (gamesWithRank || 0)
    console.log(`\n❌ Missing BGG ratings: ${missingRatings?.toLocaleString() || 'Unknown'}`)
    console.log(`❌ Missing BGG ranks: ${missingRanks?.toLocaleString() || 'Unknown'}`)

    if (sampleWithBgg?.length > 0) {
      console.log(`\n🏆 Sample games WITH BGG data:`)
      sampleWithBgg.forEach((game, i) => {
        console.log(`  ${i + 1}. ${game.name} - Rating: ${game.rating?.toFixed(2) || 'N/A'}, Rank: ${game.rank ? '#' + game.rank : 'N/A'}${game.num_ratings ? `, Users: ${game.num_ratings}` : ''}`)
      })
    }

    if (sampleWithoutBgg?.length > 0) {
      console.log(`\n❌ Sample games WITHOUT BGG data:`)
      sampleWithoutBgg.forEach((game, i) => {
        console.log(`  ${i + 1}. ${game.name} - No BGG rating or rank data`)
      })
    }

    if (missingRatings > 0) {
      console.log(`\n💡 To populate missing BGG data, run:`)
      console.log(`   node scripts/data-migration/backfill_bgg_ratings.js`)
      console.log(`   (Use --test flag for a small batch first)`)
    } else {
      console.log(`\n✅ All games have BGG rating data!`)
    }

  } catch (error) {
    console.error('💥 Error:', error.message)
  }
}

checkBggDataStatus()
