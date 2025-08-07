#!/usr/bin/env node

// Test BGG API directly to see what we're getting
const testBGGAPI = async () => {
  console.log('🧪 Testing BGG API directly...')
  
  try {
    // Test hot games API
    console.log('📡 Fetching hot games list...')
    const hotResponse = await fetch('https://boardgamegeek.com/xmlapi2/hot?type=boardgame')
    
    if (!hotResponse.ok) {
      throw new Error(`Hot games API failed: ${hotResponse.status}`)
    }
    
    const hotXML = await hotResponse.text()
    console.log('✅ Hot games XML length:', hotXML.length)
    
    // Extract first few game IDs
    const hotIds = []
    const itemMatches = hotXML.match(/<item[^>]*>/g)
    for (const match of itemMatches?.slice(0, 3) || []) {
      const idMatch = match.match(/id="(\d+)"/)
      if (idMatch) hotIds.push(parseInt(idMatch[1]))
    }
    
    console.log('🎯 First 3 hot game IDs:', hotIds)
    
    if (hotIds.length > 0) {
      // Test detailed game API for first game
      console.log(`📡 Fetching details for game ${hotIds[0]}...`)
      const detailResponse = await fetch(`https://boardgamegeek.com/xmlapi2/thing?id=${hotIds[0]}&type=boardgame&stats=1`)
      
      if (!detailResponse.ok) {
        throw new Error(`Game details API failed: ${detailResponse.status}`)
      }
      
      const detailXML = await detailResponse.text()
      console.log('✅ Game details XML length:', detailXML.length)
      console.log('📋 First 500 characters of response:')
      console.log(detailXML.substring(0, 500))
      
      // Test parsing
      console.log('\n🔍 Testing XML parsing...')
      const nameMatch = detailXML.match(/<name[^>]*>([^<]+)<\/name>/)
      const yearMatch = detailXML.match(/<yearpublished[^>]*>(\d+)<\/yearpublished>/)
      
      if (nameMatch) {
        console.log('✅ Game name found:', nameMatch[1])
      } else {
        console.log('❌ No game name found in XML')
      }
      
      if (yearMatch) {
        console.log('✅ Year found:', yearMatch[1])
      } else {
        console.log('❌ No year found in XML')
      }
    }
    
  } catch (error) {
    console.error('❌ BGG API test failed:', error.message)
  }
}

testBGGAPI()
