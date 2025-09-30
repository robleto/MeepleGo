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
  '../data/honors/enhanced-honors-complete.backup-categories.json'
)

// Function to extract category from position by removing awardSet text
function extractCategory(honor) {
  if (!honor.position || !honor.awardSet) {
    return null
  }

  let position = honor.position.trim()
  let awardSet = honor.awardSet.trim()

  // Remove year patterns from awardSet for better matching
  let cleanAwardSet = awardSet.replace(/^\d{4}\s+/, '') // Remove year prefix like "1974 "

  // Try to remove the award set name from the position
  let category = position

  // Try exact match first
  if (position.toLowerCase().includes(cleanAwardSet.toLowerCase())) {
    category = position.replace(new RegExp(cleanAwardSet, 'gi'), '').trim()
  }

  // Clean up the result
  category = category.replace(/^\s*-\s*/, '') // Remove leading dashes
  category = category.replace(/\s+/g, ' ') // Normalize whitespace
  category = category.trim()

  // If what remains is just a status word, return null (no category)
  const statusWords = [
    'winner',
    'nominee',
    'recommended',
    'finalist',
    'honorable mention',
    'runner-up',
  ]
  if (statusWords.includes(category.toLowerCase())) {
    return null
  }

  // If the category doesn't start with common category words, it might not be a real category
  const categoryStarters = [
    'best',
    'beautiful',
    'special',
    'game of',
    'most',
    'outstanding',
    'excellence',
  ]
  const startsWithCategory = categoryStarters.some((starter) =>
    category.toLowerCase().startsWith(starter)
  )

  if (!startsWithCategory && category.length > 0) {
    // Check if it's still a meaningful category or just leftover text
    if (category.length < 5 || category.toLowerCase().includes('award')) {
      return null
    }
  }

  return category || null
}

async function processHonorsForCategories(testMode = false, testCount = 10) {
  try {
    console.log('🎯 Starting category extraction...')
    console.log(`📁 Reading file: ${INPUT_FILE}`)

    // Read the input file
    const rawData = fs.readFileSync(INPUT_FILE, 'utf8')
    const honors = JSON.parse(rawData)

    const totalCount = testMode
      ? Math.min(testCount, honors.length)
      : honors.length
    console.log(
      `📊 Processing ${totalCount} honors ${testMode ? '(TEST MODE)' : ''}`
    )

    if (!testMode) {
      // Create backup only in full mode
      console.log(`💾 Creating backup: ${BACKUP_FILE}`)
      fs.writeFileSync(BACKUP_FILE, rawData)
    }

    let processedCount = 0
    let addedCategoryCount = 0
    let noCategoryCount = 0

    console.log('\n🔄 Processing categories...\n')

    // Process honors
    for (let i = 0; i < totalCount; i++) {
      const honor = honors[i]
      const originalPosition = honor.position
      const originalAwardSet = honor.awardSet

      const category = extractCategory(honor)
      honor.category = category

      if (category) {
        addedCategoryCount++
        console.log(`➕ [${i + 1}/${totalCount}] Added category "${category}"`)
        console.log(`   From: "${originalPosition}" - "${originalAwardSet}"`)
      } else {
        noCategoryCount++
        console.log(`⚪ [${i + 1}/${totalCount}] No category extracted`)
        console.log(`   From: "${originalPosition}" - "${originalAwardSet}"`)
      }

      processedCount++

      console.log('') // Add blank line for readability
    }

    if (!testMode) {
      console.log('\n📝 Writing updated file...')
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(honors, null, 2))
    } else {
      console.log('\n🧪 Test mode - no file written')
    }

    console.log('\n✅ Processing complete!')
    console.log(`📊 Summary:`)
    console.log(`   • Total processed: ${processedCount}`)
    console.log(`   • Added categories: ${addedCategoryCount}`)
    console.log(`   • No category: ${noCategoryCount}`)

    if (!testMode) {
      console.log(`📁 Output written to: ${OUTPUT_FILE}`)
      console.log(`💾 Backup saved to: ${BACKUP_FILE}`)
    }

    // Show some category examples
    console.log('\n📈 Sample categories found:')
    const categoriesFound = new Set()
    for (let i = 0; i < Math.min(totalCount, 20); i++) {
      if (honors[i].category) {
        categoriesFound.add(honors[i].category)
      }
    }

    Array.from(categoriesFound)
      .slice(0, 10)
      .forEach((category) => {
        console.log(`   • "${category}"`)
      })
  } catch (error) {
    console.error('❌ Error processing categories:', error)
    process.exit(1)
  }
}

// Check command line arguments
const args = process.argv.slice(2)
const testMode = args.includes('--test') || args.includes('-t')
const testCount = args.includes('--count')
  ? parseInt(args[args.indexOf('--count') + 1]) || 10
  : 10

// Run the script
processHonorsForCategories(testMode, testCount)
