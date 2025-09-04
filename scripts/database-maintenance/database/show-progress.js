#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function showProgress() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  try {
    // Get total count
    const { count } = await supabase
      .from('games')
      .select('*', { count: 'exact', head: true })

    console.log(`📊 Current games in database: ${count}`)

    // Get recent games (last 10)
    const { data: recentGames } = await supabase
      .from('games')
      .select('name, year_published, rating, summary, created_at')
      .order('created_at', { ascending: false })
      .limit(10)

    if (recentGames?.length > 0) {
      console.log('\n🆕 Most recently added games:')
      recentGames.forEach((game, index) => {
        const timeAgo = new Date(
          Date.now() - new Date(game.created_at).getTime()
        ).getMinutes()
        console.log(
          `  ${index + 1}. ${game.name} (${game.year_published || 'Unknown'}) - Added ${timeAgo}min ago`
        )
        console.log(
          `     Rating: ${game.rating || 'N/A'} - "${game.summary || 'No summary'}"`
        )
      })
    }

    // Get some stats
    const { data: stats } = await supabase
      .from('games')
      .select('rating, year_published, summary')
      .not('rating', 'is', null)

    if (stats?.length > 0) {
      const avgRating =
        stats.reduce((sum, game) => sum + game.rating, 0) / stats.length
      const withSummaries = stats.filter((game) => game.summary).length
      const avgYear = Math.round(
        stats
          .filter((g) => g.year_published)
          .reduce((sum, game) => sum + game.year_published, 0) /
          stats.filter((g) => g.year_published).length
      )

      console.log('\n📈 Database Statistics:')
      console.log(`  • Average rating: ${avgRating.toFixed(2)}`)
      console.log(
        `  • Games with summaries: ${withSummaries}/${count} (${Math.round((withSummaries / count) * 100)}%)`
      )
      console.log(`  • Average year: ${avgYear}`)
    }
  } catch (error) {
    console.error('❌ Error getting progress:', error.message)
  }
}

showProgress()
