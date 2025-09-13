#!/usr/bin/env node

// Load environment variables (.env only per project convention)
const dotenv = require('dotenv')
dotenv.config({ path: '.env' })
if (
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.SUPABASE_SERVICE_ROLE_KEY
) {
  console.log(
    '⚠️  Missing Supabase env vars. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env'
  )
}
const { createClient } = require('@supabase/supabase-js')

class BGGRatingBackfiller {
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

  async fetchGameData(bggId) {
    const url = `https://boardgamegeek.com/xmlapi2/thing?id=${bggId}&type=boardgame&stats=1`

    try {
      const response = await fetch(url)

      if (response.status === 429) {
        // Rate limited - progressive backoff
        const waitTime = Math.min(30000, 5000 + this.consecutiveErrors * 2000)
        console.log(
          `⏳ Rate limited on game ${bggId}, waiting ${waitTime / 1000}s...`
        )
        await new Promise((resolve) => setTimeout(resolve, waitTime))
        this.consecutiveErrors++

        if (this.consecutiveErrors < 5) {
          return await this.fetchGameData(bggId)
        } else {
          throw new Error('Rate limit retry exhausted')
        }
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const xmlText = await response.text()

      // Check if response is valid
      if (
        !xmlText ||
        xmlText.includes('Item not found') ||
        !xmlText.includes('<item')
      ) {
        return 'NOT_FOUND'
      }

      // Parse rating and rank from XML
      const ratingMatch = xmlText.match(/<average[^>]*value="([0-9.]+)"/)
      const numRatingsMatch = xmlText.match(/<usersrated[^>]*value="([0-9]+)"/)
      const rankMatch = xmlText.match(
        /<rank[^>]+name="boardgame"[^>]+value="(\d+)"/
      )

      const rating = ratingMatch ? parseFloat(ratingMatch[1]) : null
      const numRatings = numRatingsMatch ? parseInt(numRatingsMatch[1]) : null
      const rank = rankMatch ? parseInt(rankMatch[1]) : null

      // Reset consecutive errors on success
      this.consecutiveErrors = 0

      return {
        rating: rating || null,
        num_ratings: numRatings || null,
        rank: rank || null,
      }
    } catch (error) {
      this.consecutiveErrors++
      throw error
    }
  }

  async updateGameData(gameId, data) {
    try {
      const updateData = {}
      if (data.rating !== null) updateData.rating = data.rating
      if (data.num_ratings !== null) updateData.num_ratings = data.num_ratings
      if (data.rank !== null) updateData.rank = data.rank

      if (Object.keys(updateData).length === 0) {
        return false
      }

      const { error } = await this.supabase
        .from('games')
        .update(updateData)
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
    console.log(`  • Updated with BGG data: ${this.updatedCount}`)
    console.log(`  • Skipped (not found): ${this.skippedCount}`)
    console.log(`  • Errors: ${this.errorCount}`)
    console.log(`  • Rate: ${rate.toFixed(2)} games/sec`)
    console.log(`  • Runtime: ${Math.round(elapsed / 60)} minutes`)
  }

  async backfillRatingsAndRanks(limit = null, testMode = false) {
    console.log('⭐ Starting BGG ratings and ranks backfill...')
    if (testMode) {
      console.log('🧪 TEST MODE: Limited to small batch')
    }

    try {
      // Get games without rating or rank data
      const pageSize = 50
      let offset = 0
      let totalProcessed = 0

      while (true) {
        if (limit && totalProcessed >= limit) {
          break
        }

        const effectiveLimit = limit
          ? Math.min(pageSize, limit - totalProcessed)
          : pageSize

        const { data: games, error } = await this.supabase
          .from('games')
          .select('id, bgg_id, name, rating, rank, num_ratings')
          .not('bgg_id', 'is', null)
          .or('rating.is.null,rank.is.null,num_ratings.is.null')
          .order('id', { ascending: true })
          .range(offset, offset + effectiveLimit - 1)

        if (error) {
          throw new Error(`Failed to fetch batch: ${error.message}`)
        }

        if (!games || games.length === 0) {
          console.log('✅ No more games found that need BGG data updates!')
          break
        }

        console.log(
          `\n📦 Processing batch of ${games.length} games (offset ${offset})`
        )

        for (const game of games) {
          if (testMode && this.processedCount >= 10) {
            break
          }

          this.processedCount++
          totalProcessed++

          try {
            console.log(
              `🔍 [${this.processedCount}] ${game.name} (BGG ID: ${game.bgg_id})`
            )
            const data = await this.fetchGameData(game.bgg_id)

            if (data === 'NOT_FOUND') {
              console.log(`⚠️ Game not found on BGG`)
              this.skippedCount++
            } else {
              const updateSuccess = await this.updateGameData(game.id, data)
              if (updateSuccess) {
                console.log(
                  `✅ Updated - Rating: ${data.rating || 'N/A'}, Rank: ${data.rank ? '#' + data.rank : 'N/A'}, Users: ${data.num_ratings || 'N/A'}`
                )
                this.updatedCount++
              } else {
                console.log(`⚠️ No BGG data to update`)
                this.skippedCount++
              }
            }

            if (this.processedCount % 10 === 0) {
              this.logProgress()
            }
          } catch (error) {
            console.error(`❌ Error processing ${game.name}: ${error.message}`)
            this.errorCount++
            if (this.consecutiveErrors >= 3) {
              const breakTime = Math.min(
                60000,
                15000 + this.consecutiveErrors * 5000
              )
              console.log(
                `⚠️ Taking ${breakTime / 1000}s break due to errors...`
              )
              await new Promise((resolve) => setTimeout(resolve, breakTime))
            }
          }

          // Respectful rate limiting (2-4s)
          const delay = testMode ? 500 : 2000 + Math.random() * 2000
          await new Promise((r) => setTimeout(r, delay))

          if (limit && totalProcessed >= limit) {
            break
          }
        }

        offset += pageSize

        if (testMode && this.processedCount >= 10) {
          break
        }
      }

      // Final results
      const totalTime = (Date.now() - this.startTime) / 1000
      console.log(`\n⭐ BGG ratings and ranks backfill completed!`)
      console.log(`📊 Final Results:`)
      console.log(`  • Total processed: ${this.processedCount} games`)
      console.log(`  • Successfully updated: ${this.updatedCount} games`)
      console.log(`  • Skipped (not found/no data): ${this.skippedCount} games`)
      console.log(`  • Errors: ${this.errorCount} games`)
      console.log(
        `  • Success rate: ${this.processedCount ? ((this.updatedCount / this.processedCount) * 100).toFixed(1) : '0.0'}%`
      )
      console.log(`  • Total time: ${Math.round(totalTime / 60)} minutes`)
      console.log(
        `  • Average rate: ${this.processedCount ? (this.processedCount / totalTime).toFixed(2) : '0.00'} games/sec`
      )

      if (this.updatedCount > 0) {
        const { data: topRatedGames } = await this.supabase
          .from('games')
          .select('name, year_published, rating, rank, num_ratings')
          .not('rating', 'is', null)
          .order('rating', { ascending: false })
          .limit(Math.min(10, this.updatedCount))

        if (topRatedGames?.length > 0) {
          console.log(`\n🏆 Top BGG rated games in your collection:`)
          topRatedGames.forEach((game, index) => {
            console.log(
              `  ${index + 1}. ${game.name} (${game.year_published || 'Unknown'}) - Rating: ${game.rating?.toFixed(1)} (${game.num_ratings} users)${game.rank ? `, Rank: #${game.rank}` : ''}`
            )
          })
        }
      }
      console.log(
        `\n🚀 Your games now have BGG ratings and can be sorted by rating!`
      )
    } catch (error) {
      console.error(`💥 Fatal error in backfill process: ${error.message}`)
      process.exit(1)
    }
  }
}

// Parse command line arguments
const args = process.argv.slice(2)
const testMode = args.includes('--test')
const limit = testMode
  ? 10
  : args.includes('--limit')
    ? parseInt(args[args.indexOf('--limit') + 1])
    : null

// Create and run the backfiller
const backfiller = new BGGRatingBackfiller()

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

console.log('⭐ BGG Ratings & Ranks Backfiller')
console.log('=================================')
if (testMode) {
  console.log('🧪 Running in TEST MODE (10 games only)')
}
if (limit && !testMode) {
  console.log(`📊 Limited to ${limit} games`)
}
console.log(
  'This will fetch BGG ratings, user counts, and ranks for your games'
)
console.log('Press Ctrl+C to stop gracefully\n')

backfiller.backfillRatingsAndRanks(limit, testMode).catch((error) => {
  console.error(`💥 Unhandled error: ${error.message}`)
  process.exit(1)
})
