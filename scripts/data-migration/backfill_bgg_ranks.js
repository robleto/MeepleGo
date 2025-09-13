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
        const waitTime = Math.min(30000, 5000 + this.consecutiveErrors * 2000)
        console.log(
          `⏳ Rate limited on game ${bggId}, waiting ${waitTime / 1000}s...`
        )
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
      if (
        !xmlText ||
        xmlText.includes('Item not found') ||
        !xmlText.includes('<item')
      ) {
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
        .update({
          rank: rank === 'UNRANKED' || rank === 'NOT_FOUND' ? null : rank,
        })
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
    console.log('🏆 Starting BGG rank backfill (paged)...')
    if (testMode) {
      console.log('🧪 TEST MODE: Limited to small batch')
    }

    try {
      // Count remaining (best effort – may be null if count not permitted)
      try {
        const { count: remaining } = await this.supabase
          .from('games')
          .select('id', { count: 'exact', head: true })
          .is('rank', null)
        if (typeof remaining === 'number') {
          console.log(`📊 Initially remaining without rank: ${remaining}`)
        }
      } catch (_) {}

      const pageSize = this.pageSize || 100
      let batchNumber = 0
      let globalLimitRemaining = limit || null
      let startAfterConsumed = false

      let consecutiveEmptyBatches = 0
      const emptyStopThreshold = this.emptyStopThreshold || 10 // configurable

      // If we have an explicit onlyIds list, process just those then exit
      if (Array.isArray(this.onlyBggIds) && this.onlyBggIds.length > 0) {
        for (const bggId of this.onlyBggIds) {
          const { data: rows, error: fetchErr } = await this.supabase
            .from('games')
            .select('id, bgg_id, name, rank')
            .eq('bgg_id', bggId)
            .limit(1)
          if (fetchErr) {
            console.error(
              `❌ Fetch error for BGG ID ${bggId}: ${fetchErr.message}`
            )
            this.errorCount++
            continue
          }
          if (!rows || rows.length === 0) {
            console.log(`⚠️  No game found locally for BGG ID ${bggId}`)
            this.skippedCount++
            continue
          }
          const game = rows[0]
          if (game.rank != null) {
            console.log(`ℹ️  Already ranked (#${game.rank}) – ${game.name}`)
            continue
          }
          this.processedCount++
          try {
            console.log(
              `🔍 [${this.processedCount}] ${game.name} (BGG ID: ${game.bgg_id})`
            )
            const rank = await this.fetchGameRank(game.bgg_id)
            if (rank === 'NOT_FOUND') {
              console.log('⚠️  Game not found on BGG')
              this.skippedCount++
            } else if (rank === 'UNRANKED') {
              console.log('⚠️  Game exists but is unranked')
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
          } catch (e) {
            console.error(`❌ Error processing BGG ID ${bggId}: ${e.message}`)
            this.errorCount++
          }
        }
        // Skip normal loop by setting counters so outer processing concludes
        consecutiveEmptyBatches = emptyStopThreshold
        // Jump to final results section
        const totalTime = (Date.now() - this.startTime) / 1000
        console.log(`\n🏆 BGG rank backfill completed!`)
        console.log(`📊 Final Results:`)
        console.log(`  • Total processed: ${this.processedCount} games`)
        console.log(`  • Successfully updated: ${this.updatedCount} games`)
        console.log(
          `  • Skipped (unranked/not found/missing id): ${this.skippedCount} games`
        )
        console.log(`  • Errors: ${this.errorCount} games`)
        console.log(
          `  • Success rate: ${this.processedCount ? ((this.updatedCount / this.processedCount) * 100).toFixed(1) : '0.0'}%`
        )
        console.log(`  • Total time: ${Math.round(totalTime / 60)} minutes`)
        console.log(
          `  • Average rate: ${this.processedCount ? (this.processedCount / totalTime).toFixed(2) : '0.00'} games/sec`
        )
        return
      }

      while (true) {
        if (globalLimitRemaining !== null && globalLimitRemaining <= 0) {
          break
        }

        const effectiveLimit =
          globalLimitRemaining !== null
            ? Math.min(pageSize, globalLimitRemaining)
            : pageSize

        let query = this.supabase
          .from('games')
          .select('id, bgg_id, name')
          .is('rank', null)
          .not('bgg_id', 'is', null)
          .limit(effectiveLimit)

        // Ordering strategy
        if (this.orderStrategy === 'bgg') {
          query = query.order('bgg_id', { ascending: true })
          if (this.lastBggId) {
            query = query.gt('bgg_id', this.lastBggId)
          }
        } else {
          // default id
          query = query.order('id', { ascending: true })
          if (this.startAfterId && !startAfterConsumed) {
            query = query.gt('id', this.startAfterId)
          }
        }

        // (id advancement handled above now)

        const { data: games, error } = await query

        if (error) {
          throw new Error(`Failed to fetch batch: ${error.message}`)
        }

        if (!games || games.length === 0) {
          console.log(
            '✅ No more games found that need rank updates in remaining ID range!'
          )
          break
        }

        batchNumber++
        console.log(
          `\n� Batch #${batchNumber} – processing ${games.length} games (IDs ${games[0].id}..${games[games.length - 1].id})`
        )

        let batchUpdated = 0
        for (const game of games) {
          if (testMode && this.processedCount >= 10) {
            break
          }

          // Skip if no BGG id
          if (!game.bgg_id) {
            console.log(`⚠️  Skipping ${game.name} (no BGG ID)`)
            this.skippedCount++
            continue
          }

          this.processedCount++
          try {
            console.log(
              `🔍 [${this.processedCount}] ${game.name} (BGG ID: ${game.bgg_id})`
            )
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
                batchUpdated++
              } else {
                this.errorCount++
              }
            }

            if (this.processedCount % 25 === 0) {
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

          if (globalLimitRemaining !== null) {
            globalLimitRemaining--
            if (globalLimitRemaining <= 0) {
              break
            }
          }
        }

        startAfterConsumed = true

        // If nothing was updated (all unranked / missing ids / errors), avoid infinite loop
        if (batchUpdated === 0) {
          consecutiveEmptyBatches++
          console.log(
            `⚠️  Empty batch (${consecutiveEmptyBatches}/${emptyStopThreshold}) – continuing search for rankable games...`
          )
          if (consecutiveEmptyBatches >= emptyStopThreshold) {
            console.log('⛔ Reached empty batch threshold. Stopping.')
            break
          }
          // Advance cursor even though no updates so we don't loop on permanently unranked early IDs
          if (games && games.length > 0) {
            if (this.orderStrategy === 'bgg') {
              this.lastBggId = games[games.length - 1].bgg_id
            } else {
              this.startAfterId = games[games.length - 1].id
              startAfterConsumed = false
            }
          } else {
            // No rows at all -> break
            break
          }
        } else {
          consecutiveEmptyBatches = 0
          // Advance cursor after successful batch
          if (games && games.length > 0) {
            if (this.orderStrategy === 'bgg') {
              this.lastBggId = games[games.length - 1].bgg_id
            } else {
              this.startAfterId = games[games.length - 1].id
              startAfterConsumed = false
            }
          }
        }

        if (testMode && this.processedCount >= 10) {
          break
        }
      }

      // Final results
      const totalTime = (Date.now() - this.startTime) / 1000
      console.log(`\n🏆 BGG rank backfill completed!`)
      console.log(`📊 Final Results:`)
      console.log(`  • Total processed: ${this.processedCount} games`)
      console.log(`  • Successfully updated: ${this.updatedCount} games`)
      console.log(
        `  • Skipped (unranked/not found/missing id): ${this.skippedCount} games`
      )
      console.log(`  • Errors: ${this.errorCount} games`)
      console.log(
        `  • Success rate: ${this.processedCount ? ((this.updatedCount / this.processedCount) * 100).toFixed(1) : '0.0'}%`
      )
      console.log(`  • Total time: ${Math.round(totalTime / 60)} minutes`)
      console.log(
        `  • Average rate: ${this.processedCount ? (this.processedCount / totalTime).toFixed(2) : '0.00'} games/sec`
      )

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
            console.log(
              `  #${game.rank} - ${game.name} (${game.year_published || 'Unknown'}) - Rating: ${game.rating || 'N/A'}`
            )
          })
        }
      }
      console.log(
        `\n🚀 Your games can now be (better) sorted by actual BGG rankings!`
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
const pageSize = args.includes('--page-size')
  ? parseInt(args[args.indexOf('--page-size') + 1])
  : 100
const orderStrategy = args.includes('--order')
  ? args[args.indexOf('--order') + 1]
  : 'id' // id | bgg
const emptyStopThreshold = args.includes('--empty-stop')
  ? parseInt(args[args.indexOf('--empty-stop') + 1])
  : 10
const startAfterId = args.includes('--start-after')
  ? parseInt(args[args.indexOf('--start-after') + 1])
  : 0

// Create and run the backfiller
const backfiller = new BGGRankBackfiller()
backfiller.pageSize = pageSize
if (startAfterId > 0) backfiller.startAfterId = startAfterId
backfiller.orderStrategy = ['bgg', 'id'].includes(orderStrategy)
  ? orderStrategy
  : 'id'
backfiller.emptyStopThreshold =
  Number.isFinite(emptyStopThreshold) && emptyStopThreshold > 0
    ? emptyStopThreshold
    : 10

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
console.log(`🧩 Page size: ${pageSize}`)
console.log(`🔀 Order strategy: ${backfiller.orderStrategy}`)
console.log(`🛑 Empty batch stop threshold: ${backfiller.emptyStopThreshold}`)
if (startAfterId > 0) {
  console.log(`➡️  Starting after game ID: ${startAfterId}`)
}
console.log('Press Ctrl+C to stop gracefully\n')

backfiller.backfillRanks(limit, testMode).catch((error) => {
  console.error(`💥 Unhandled error: ${error.message}`)
  process.exit(1)
})
