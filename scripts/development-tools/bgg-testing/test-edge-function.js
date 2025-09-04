#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' })

async function testEdgeFunction() {
  console.log('🧪 Testing BGG import edge function...')

  const functionUrl =
    'https://dsqceuerzoeotrcatxvb.supabase.co/functions/v1/populate-games'
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceKey) {
    console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY')
    return
  }

  try {
    console.log('📡 Calling edge function...')

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
    })

    console.log(`📊 Status: ${response.status}`)

    const responseText = await response.text()
    console.log('📋 Raw Response:', responseText)

    // Try to parse as JSON
    try {
      const jsonResponse = JSON.parse(responseText)
      console.log('📊 Parsed Response:', JSON.stringify(jsonResponse, null, 2))

      if (jsonResponse.errors > 0) {
        console.log(
          '⚠️ Errors detected in import - this suggests the function is running but has data issues'
        )
      }
    } catch (parseError) {
      console.log('❌ Could not parse response as JSON')
    }
  } catch (error) {
    console.error('❌ Error calling function:', error.message)
  }
}

testEdgeFunction()
