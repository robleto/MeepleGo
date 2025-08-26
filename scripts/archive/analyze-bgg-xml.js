#!/usr/bin/env node

// Let's see the full structure of the BGG API response
const analyzeBGGXML = async () => {
  console.log('🔍 Analyzing BGG XML structure...')

  try {
    // Get a specific game
    const response = await fetch(
      'https://boardgamegeek.com/xmlapi2/thing?id=174430&type=boardgame&stats=1'
    )

    if (!response.ok) {
      throw new Error(`API failed: ${response.status}`)
    }

    const xml = await response.text()
    console.log('📋 Full XML response:')
    console.log(xml)
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

analyzeBGGXML()
