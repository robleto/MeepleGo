#!/usr/bin/env node

require('dotenv').config({ path: '.env' })
const { createClient } = require('@supabase/supabase-js')

class BGGRankBackfiller {
  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    this.processedCount = 0
    this.updatedCount = 0
    this.skippedCount = 0
    this.errorCount = 0
    this.consecutiveErrors = 0
    this.startTime = Date.now()
  }

  async fetchGameRank(bggId) {
    const url = `https://boardgamegeek.com/xmlapi2/thing?id=${bggId}&type=boardgame&stats=1`

    try {
      const response = await fetch(url)

      if (response.status === 429) {
        // Rate limited - progressive backoff
        const waitTime = Math.min(30000, 5000 + (this.consecutiveErrors * 2000))
        console.log(`⏳ Rate limited on game ${bggId}, waiting ${waitTime/1000}s...`)
        await new Promise((resolve) => setTimeout(resolve, waitTime))
        this.consecutiveErrors++
        
        if (this.consecutiveErrors < 5) {
          return await this.fetchGameRank(bggId)
        } else {
          throw new Error('Rate limit retry exhausted')
        }
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const xmlText = await response.text()

      // Check if response is valid
      if (!xmlText || xmlText.includes('Item not found') || !xmlText.includes('<item')) {
        return 'NOT_FOUND'
      }

      // Parse rank from XML
      const rankMatch = xmlText.match(
        /<rank[^>]+name="boardgame"[^>]+value="(\d+)"/
      )

      // Reset consecutive errors on success
      this.consecutiveErrors = 0

      return rankMatch ? parseInt(rankMatch[1]) : 'UNRANKED'
    } catch (error) {
      this.consecutiveErrors++
      throw error
    }
  }

  async updateGameRank(gameId, rank) {
    try {
      const { error } = await this.supabase
        .from('games')
        .update({ rank: rank === 'UNRANKED' || rank === 'NOT_FOUND' ? null : rank })
        .eq('id', gameId)

      if (error) {
        throw new Error(`Database update error: ${error.message}`)
      }

      return true
    } catch (error) {
      console.error(`❌ Database update failed: ${error.message}`)
      return false
    }
  }

  logProgress() {
    const elapsed = (Date.now() - this.startTime) / 1000
    const rate = this.processedCount / elapsed
    
    console.log(`\n📊 Progress Update:`)
    console.log(`  • Processed: ${this.processedCount} games`)
    console.log(`  • Updated with ranks: ${this.updatedCount}`)
    console.log(`  • Skipped (unranked/not found): ${this.skippedCount}`)
    console.log(`  • Errors: ${this.errorCount}`)
    console.log(`  • Rate: ${rate.toFixed(2)} games/sec`)
    console.log(`  • Runtime: ${Math.round(elapsed / 60)} minutes`)
  }

  async backfillRanks(limit = null, testMode = false) {
    console.log('🏆 Starting BGG rank backfill...')
    if (testMode) {
      console.log('🧪 TEST MODE: Limited to small batch')
    }

    try {
      // Get games that don't have rank data yet
      let query = this.supabase
        .from('games')
        .select('id, bgg_id, name, rank')
        .is('rank', null)
        .order('name')

      if (limit) {
        query = query.limit(limit)
      }

      const { data: games, error } = await query

      if (error) {
        throw new Error(`Failed to fetch games: ${error.message}`)
      }

      if (!games || games.length === 0) {
        console.log('✅ No games found that need rank updates!')
        return
      }

      console.log(`📊 Found ${games.length} games without rank data`)
      console.log('🚀 Starting processing...\n')

      for (const game of games) {
        this.processedCount++

        try {
          console.log(`🔍 [${this.processedCount}/${games.length}] ${game.name} (BGG ID: ${game.bgg_id})`)

          const rank = await this.fetchGameRank(game.bgg_id)

          if (rank === 'NOT_FOUND') {
            console.log(`⚠️ Game not found on BGG`)
            this.skippedCount++
          } else if (rank === 'UNRANKED') {
            console.log(`⚠️ Game exists but is unranked`)
            this.skippedCount++
          } else {
            const updateSuccess = await this.updateGameRank(game.id, rank)
            if (updateSuccess) {
              console.log(`✅ Updated - BGG Rank: #${rank}`)
              this.updatedCount++
            } else {
              this.errorCount++
            }
          }

          // Progress update every 10 games
          if (this.processedCount % 10 === 0) {
            this.logProgress()
          }

        } catch (error) {
          console.error(`❌ Error processing ${game.name}: ${error.message}`)
          this.errorCount++

          // If too many consecutive errors, take a longer break
          if (this.consecutiveErrors >= 3) {
            const breakTime = Math.min(60000, 15000 + (this.consecutiveErrors * 5000))
            console.log(`⚠️ Taking ${breakTime/1000}s break due to errors...`)
            await new Promise((resolve) => setTimeout(resolve, breakTime))
          }
        }

        // Rate limiting - be respectful to BGG (2-4 second delay)
        const delay = testMode ? 1000 : (2000 + Math.random() * 2000)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }

      // Final results
      const totalTime = (Date.now() - this.startTime) / 1000
      console.log(`\n🏆 BGG rank backfill completed!`)
      console.log(`📊 Final Results:`)
      console.log(`  • Total processed: ${this.processedCount} games`)
      console.log(`  • Successfully updated: ${this.updatedCount} games`)
      console.log(`  • Skipped (unranked/not found): ${this.skippedCount} games`)
      console.log(`  • Errors: ${this.errorCount} games`)
      console.log(`  • Success rate: ${((this.updatedCount / this.processedCount) * 100).toFixed(1)}%`)
      console.log(`  • Total time: ${Math.round(totalTime / 60)} minutes`)
      console.log(`  • Average rate: ${(this.processedCount / totalTime).toFixed(2)} games/sec`)

      // Show some of the top ranked games we now have
      if (this.updatedCount > 0) {
        const { data: topRankedGames } = await this.supabase
          .from('games')
          .select('name, year_published, rank, rating')
          .not('rank', 'is', null)
          .order('rank', { ascending: true })
          .limit(Math.min(10, this.updatedCount))

        if (topRankedGames?.length > 0) {
          console.log(`\n🥇 Top BGG ranked games in your collection:`)
          topRankedGames.forEach((game) => {
            console.log(`  #${game.rank} - ${game.name} (${game.year_published || 'Unknown'}) - Rating: ${game.rating || 'N/A'}`)
          })
        }
      }

      console.log(`\n🚀 Your games can now be sorted by actual BGG rankings!`)

    } catch (error) {
      console.error(`💥 Fatal error in backfill process: ${error.message}`)
      process.exit(1)
    }
  }
}

// Parse command line arguments
const args = process.argv.slice(2)
const testMode = args.includes('--test')
const limit = testMode ? 10 : (args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1]) : null)

// Create and run the backfiller
const backfiller = new BGGRankBackfiller()

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⚠️ Received interrupt signal. Gracefully shutting down...')
  backfiller.logProgress()
  console.log('👋 Backfill stopped. Progress has been saved.')
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\n⚠️ Received termination signal. Gracefully shutting down...')
  backfiller.logProgress()
  console.log('👋 Backfill stopped. Progress has been saved.')
  process.exit(0)
})

console.log('🎮 BGG Rank Backfiller')
console.log('=====================')
if (testMode) {
  console.log('🧪 Running in TEST MODE (10 games only)')
}
if (limit && !testMode) {
  console.log(`📊 Limited to ${limit} games`)
}
console.log('Press Ctrl+C to stop gracefully\n')

backfiller.backfillRanks(limit, testMode).catch((error) => {
  console.error(`💥 Unhandled error: ${error.message}`)
  process.exit(1)
})
