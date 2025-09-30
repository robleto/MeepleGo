#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const INPUT_FILE = path.join(
  __dirname,
  '../data/honors/enhanced-honors-complete.json'
)
const OUTPUT_FILE = path.join(
  __dirname,
  '../data/honors/enhanced-honors-complete.json'
)
const BACKUP_FILE = path.join(
  __dirname,
  '../data/honors/enhanced-honors-complete.backup.json'
)

// Status determination logic
function determineStatus(honor) {
  // If status already exists, keep it
  if (honor.status) {
    return honor.status
  }

  const title = honor.title?.toLowerCase() || ''
  const position = honor.position?.toLowerCase() || ''
  const slug = honor.slug?.toLowerCase() || ''

  // Check for winner indicators
  const winnerPatterns = [
    'winner',
    'best',
    'award',
    'champion',
    'first place',
    '1st place',
    'grand prize',
    'gold',
    'spiel des jahres',
    'game of the year',
    'mensa select',
    'origins award',
    'diana jones award',
  ]

  // Check for nominee indicators
  const nomineePatterns = [
    'nominee',
    'nomination',
    'shortlist',
    'finalist',
    'recommended',
    'honorable mention',
    'runner-up',
    'second place',
    '2nd place',
    'third place',
    '3rd place',
    'silver',
    'bronze',
  ]

  const textToCheck = `${title} ${position} ${slug}`

  // Check for explicit nominee indicators first
  for (const pattern of nomineePatterns) {
    if (textToCheck.includes(pattern)) {
      return 'Nominee'
    }
  }

  // Check for winner indicators
  for (const pattern of winnerPatterns) {
    if (textToCheck.includes(pattern)) {
      return 'Winner'
    }
  }

  // Default fallback logic
  if (
    textToCheck.includes('recommendation') ||
    textToCheck.includes('special')
  ) {
    return 'Recognition'
  }

  // If no clear indicator, default to Winner for now
  // (this might need manual review later)
  return 'Winner'
}

async function processHonors() {
  try {
    console.log('🎯 Starting honors status processing...')
    console.log(`📁 Reading file: ${INPUT_FILE}`)

    // Read the input file
    const rawData = fs.readFileSync(INPUT_FILE, 'utf8')
    const honors = JSON.parse(rawData)

    console.log(`📊 Total honors to process: ${honors.length}`)

    // Create backup
    console.log(`💾 Creating backup: ${BACKUP_FILE}`)
    fs.writeFileSync(BACKUP_FILE, rawData)

    let processedCount = 0
    let addedStatusCount = 0
    let existingStatusCount = 0

    console.log('\n🔄 Processing honors...\n')

    // Process each honor
    for (let i = 0; i < honors.length; i++) {
      const honor = honors[i]
      const hadStatus = !!honor.status

      honor.status = determineStatus(honor)

      if (!hadStatus) {
        addedStatusCount++
        console.log(
          `➕ [${i + 1}/${honors.length}] Added status "${honor.status}" to: ${honor.title} (${honor.year || 'No year'})`
        )
      } else {
        existingStatusCount++
        if (i % 1000 === 0) {
          // Show progress for existing ones every 1000
          console.log(
            `✓ [${i + 1}/${honors.length}] Kept existing status "${honor.status}" for: ${honor.title}`
          )
        }
      }

      processedCount++

      // Show progress every 500 items for better feedback
      if (i % 500 === 0 && i > 0) {
        console.log(
          `📈 Progress: ${i}/${honors.length} (${Math.round((i / honors.length) * 100)}%)`
        )
      }
    }

    console.log('\n📝 Writing updated file...')

    // Write the updated data
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(honors, null, 2))

    console.log('\n✅ Processing complete!')
    console.log(`📊 Summary:`)
    console.log(`   • Total processed: ${processedCount}`)
    console.log(`   • Added status: ${addedStatusCount}`)
    console.log(`   • Existing status: ${existingStatusCount}`)
    console.log(`📁 Output written to: ${OUTPUT_FILE}`)
    console.log(`💾 Backup saved to: ${BACKUP_FILE}`)

    // Show some examples of status distribution
    const statusCounts = {}
    honors.forEach((honor) => {
      statusCounts[honor.status] = (statusCounts[honor.status] || 0) + 1
    })

    console.log('\n📈 Status distribution:')
    Object.entries(statusCounts)
      .sort(([, a], [, b]) => b - a)
      .forEach(([status, count]) => {
        console.log(`   • ${status}: ${count}`)
      })
  } catch (error) {
    console.error('❌ Error processing honors:', error)
    process.exit(1)
  }
}

// Run the script
processHonors()
