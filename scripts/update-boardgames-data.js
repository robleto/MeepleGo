const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Found' : 'Missing')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? 'Found' : 'Missing')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function updateBoardgamesData() {
  try {
    console.log('🔄 Starting boardgames data update...\n')

    // Read the JSON file
    const jsonPath = path.join(
      __dirname,
      '..',
      'data',
      'honors',
      'enhanced-honors-complete.json'
    )
    const rawData = fs.readFileSync(jsonPath, 'utf8')
    const honors = JSON.parse(rawData)

    console.log(`📊 Total honors to update: ${honors.length}`)

    let processedCount = 0
    let updatedCount = 0
    let errorCount = 0
    const errors = []

    console.log('\n🔄 Updating existing records with boardgames data...\n')

    // Process in batches
    const batchSize = 50
    for (let i = 0; i < honors.length; i += batchSize) {
      const batch = honors.slice(i, i + batchSize)

      for (const honor of batch) {
        try {
          processedCount++

          // Skip if no games
          if (!honor.boardgames || honor.boardgames.length === 0) {
            continue
          }

          // Update the existing record with boardgames data
          const { data, error } = await supabase
            .from('industry_awards')
            .update({
              boardgames: honor.boardgames,
            })
            .eq('bgg_honor_id', honor.id)
            .select()

          if (error) {
            console.log(`⚠️  Error updating ${honor.id}: ${error.message}`)
            errorCount++
            errors.push(`${honor.id}: ${error.message}`)
            continue
          }

          if (data && data.length > 0) {
            updatedCount++
            console.log(
              `✅ [${processedCount}/${honors.length}] Updated: ${honor.title} (${honor.id}) with ${honor.boardgames.length} games`
            )
          } else {
            console.log(
              `🔍 [${processedCount}/${honors.length}] Not found: ${honor.title} (${honor.id})`
            )
          }
        } catch (error) {
          console.error(`❌ Error processing honor ${honor.id}:`, error.message)
          errorCount++
          errors.push(`${honor.id}: ${error.message}`)
        }
      }

      // Show progress every batch
      if (i % (batchSize * 10) === 0 && i > 0) {
        console.log(
          `📈 Progress: ${Math.min(i + batchSize, honors.length)}/${honors.length} (${Math.round((i / honors.length) * 100)}%)`
        )
        console.log(`   Records updated: ${updatedCount}`)
      }

      // Small delay between batches
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    console.log('\n✅ Update complete!')
    console.log(`📊 Summary:`)
    console.log(`   • Total processed: ${processedCount}`)
    console.log(`   • Records updated: ${updatedCount}`)
    console.log(`   • Errors: ${errorCount}`)

    if (errors.length > 0) {
      console.log('\n❌ Errors encountered:')
      errors.slice(0, 10).forEach((error) => console.log(`   • ${error}`))
      if (errors.length > 10) {
        console.log(`   ... and ${errors.length - 10} more errors`)
      }
    }
  } catch (error) {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  }
}

// Run the script
updateBoardgamesData()
