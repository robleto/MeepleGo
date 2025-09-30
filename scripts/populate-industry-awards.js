#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config()

const INPUT_FILE = path.join(
  __dirname,
  '../data/honors/enhanced-honors-complete.json'
)

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role key for admin operations

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    '❌ Missing Supabase configuration. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file.'
  )
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function populateIndustryAwards() {
  try {
    console.log('🎯 Starting industry awards population...')
    console.log(`📁 Reading file: ${INPUT_FILE}`)

    // Read the JSON file
    const rawData = fs.readFileSync(INPUT_FILE, 'utf8')
    const honors = JSON.parse(rawData)

    console.log(`📊 Total honors to process: ${honors.length}`)

    let processedCount = 0
    let insertedAwards = 0
    let skippedNoGames = 0
    let errorCount = 0
    const errors = []

    console.log('\n🔄 Processing honors...\n')

    // Process in batches to avoid overwhelming the database
    const batchSize = 50
    for (let i = 0; i < honors.length; i += batchSize) {
      const batch = honors.slice(i, i + batchSize)

      for (const honor of batch) {
        try {
          processedCount++

          // Skip honors with no games
          if (!honor.boardgames || honor.boardgames.length === 0) {
            skippedNoGames++
            if (processedCount % 500 === 0) {
              console.log(
                `⚪ [${processedCount}/${honors.length}] Skipped (no games): ${honor.title}`
              )
            }
            continue
          }

          // Insert the award with boardgames JSONB
          const { data: awardData, error: awardError } = await supabase
            .from('industry_awards')
            .insert({
              bgg_honor_id: honor.id,
              slug: honor.slug,
              bgg_url: honor.url
                ? `https://boardgamegeek.com${honor.url}`
                : null,
              year: honor.year,
              title: honor.title,
              primary_name: honor.primaryName || null,
              alternate_names:
                honor.alternateNames && honor.alternateNames.length > 0
                  ? honor.alternateNames
                  : null,
              award_set: honor.awardSet,
              position: honor.position,
              status: honor.status,
              category: honor.category,
              boardgames: honor.boardgames || [],
            })
            .select()
            .single()

          if (awardError) {
            if (awardError.code === '23505') {
              // Unique constraint violation
              console.log(
                `⚪ [${processedCount}/${honors.length}] Already exists: ${honor.title} (${honor.id})`
              )
              continue
            }
            throw awardError
          }

          insertedAwards++

          console.log(
            `➕ [${processedCount}/${honors.length}] Added: ${honor.title} (${honor.year || 'No year'}) with ${honor.boardgames.length} games`
          )
        } catch (error) {
          errorCount++
          const errorMsg = `Error processing honor ${honor.id}: ${error.message}`
          errors.push(errorMsg)
          console.log(`❌ [${processedCount}/${honors.length}] ${errorMsg}`)
        }
      }

      // Show progress every batch
      if (i % (batchSize * 10) === 0 && i > 0) {
        console.log(
          `📈 Progress: ${Math.min(i + batchSize, honors.length)}/${honors.length} (${Math.round((i / honors.length) * 100)}%)`
        )
        console.log(`   Awards inserted: ${insertedAwards}`)
      }

      // Small delay between batches to be nice to the database
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    console.log('\n✅ Processing complete!')
    console.log(`📊 Summary:`)
    console.log(`   • Total processed: ${processedCount}`)
    console.log(`   • Awards inserted: ${insertedAwards}`)
    console.log(`   • Skipped (no games): ${skippedNoGames}`)
    console.log(`   • Errors: ${errorCount}`)

    if (errors.length > 0) {
      console.log('\n❌ Errors encountered:')
      errors.slice(0, 10).forEach((error) => console.log(`   • ${error}`))
      if (errors.length > 10) {
        console.log(`   ... and ${errors.length - 10} more errors`)
      }
    }

    // Show some statistics
    console.log('\n📈 Database statistics:')
    const { count: totalAwards } = await supabase
      .from('industry_awards')
      .select('*', { count: 'exact', head: true })

    const { count: totalGameLinks } = await supabase
      .from('industry_award_games')
      .select('*', { count: 'exact', head: true })

    console.log(`   • Total awards in database: ${totalAwards}`)
    console.log(`   • Total game links in database: ${totalGameLinks}`)
  } catch (error) {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  }
}

// Run the script
populateIndustryAwards()
