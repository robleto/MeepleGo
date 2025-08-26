#!/usr/bin/env node

// Test BGG API directly to see what's happening
async function testBGGAPI() {
  console.log('🧪 Testing BGG API directly...')

  try {
    // First test: Get hot games list
    console.log('📡 Fetching BGG hot games list...')
    const hotResponse = await fetch(
      'https://boardgamegeek.com/xmlapi2/hot?type=boardgame'
    )

    if (!hotResponse.ok) {
      console.error(`❌ Hot games API failed: ${hotResponse.status}`)
      return
    }

    const hotXml = await hotResponse.text()
    console.log('✅ Hot games XML length:', hotXml.length)

    // Extract a few game IDs from hot list
    const idMatches = hotXml.match(/<item[^>]*id="(\d+)"/g)
    if (!idMatches) {
      console.error('❌ No game IDs found in hot list')
      return
    }

    const gameIds = idMatches
      .slice(0, 3)
      .map((match) => {
        const idMatch = match.match(/id="(\d+)"/)
        return idMatch ? idMatch[1] : null
      })
      .filter(Boolean)

    console.log('🎯 Found game IDs:', gameIds)

    // Test fetching detailed game data
    console.log('📡 Fetching detailed game data...')
    const detailUrl = `https://boardgamegeek.com/xmlapi2/thing?id=${gameIds.join(',')}&type=boardgame&stats=1`
    console.log('🔗 URL:', detailUrl)

    const detailResponse = await fetch(detailUrl)

    if (!detailResponse.ok) {
      console.error(`❌ Detail API failed: ${detailResponse.status}`)
      return
    }

    const detailXml = await detailResponse.text()
    console.log('✅ Detail XML length:', detailXml.length)

    // Check if XML contains expected structure
    const hasItems = detailXml.includes('<items>')
    const hasItemTags = detailXml.includes('<item')
    const hasNames = detailXml.includes('<name')
    const hasDescriptions = detailXml.includes('<description>')

    console.log('📊 XML Structure Check:')
    console.log(`  - Has <items>: ${hasItems ? '✅' : '❌'}`)
    console.log(`  - Has <item>: ${hasItemTags ? '✅' : '❌'}`)
    console.log(`  - Has <name>: ${hasNames ? '✅' : '❌'}`)
    console.log(`  - Has <description>: ${hasDescriptions ? '✅' : '❌'}`)

    // Show sample of XML
    console.log('\n📋 Sample XML (first 500 chars):')
    console.log(detailXml.substring(0, 500) + '...')

    // Test our parser logic
    console.log('\n🔍 Testing parser logic...')
    const itemMatches = detailXml.match(/<item[^>]*>[\s\S]*?<\/item>/g)
    if (itemMatches) {
      console.log(`✅ Found ${itemMatches.length} item matches`)

      // Test first item
      const firstItem = itemMatches[0]
      const nameMatch = firstItem.match(
        /<name[^>]+type="primary"[^>]+value="([^"]+)"/
      )
      const descMatch = firstItem.match(
        /<description>([\s\S]*?)<\/description>/
      )

      if (nameMatch) {
        console.log(`✅ First game name: "${nameMatch[1]}"`)
      } else {
        console.log('❌ Could not extract name from first item')
        console.log('📄 First item sample:', firstItem.substring(0, 300))
      }

      if (descMatch) {
        const rawDesc = descMatch[1]
        console.log(`✅ First game description length: ${rawDesc.length}`)
        console.log(`📝 Description sample: "${rawDesc.substring(0, 100)}..."`)

        // Test summary extraction
        const cleanDesc = rawDesc
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&nbsp;/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()

        const summaryMatch = cleanDesc.match(/^(.+?[.!?])(\s|$)/)
        if (summaryMatch) {
          console.log(`✅ Extracted summary: "${summaryMatch[1]}"`)
        } else {
          console.log('❌ Could not extract summary')
          console.log(
            `📝 Clean description: "${cleanDesc.substring(0, 200)}..."`
          )
        }
      } else {
        console.log('❌ Could not extract description from first item')
      }
    } else {
      console.log('❌ No item matches found - parser regex issue')
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

testBGGAPI()
