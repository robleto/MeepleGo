const { createClient } = require('@supabase/supabase-js')

// Test database connection
async function testDatabase() {
  console.log('Testing database connection...')
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  
  try {
    // Test basic connection
    const { data, error, count } = await supabase
      .from('games')
      .select('*', { count: 'exact', head: true })
    
    console.log('Game count:', count)
    if (error) {
      console.error('Count error:', error)
      return
    }
    
    // Test actual query
    const { data: games, error: queryError } = await supabase
      .from('games')
      .select('id, name')
      .limit(5)
    
    if (queryError) {
      console.error('Query error:', queryError)
      return
    }
    
    console.log('Sample games:', games)
    
    // Test search query
    const { data: searchResult, error: searchError } = await supabase
      .from('games')
      .select('id, name')
      .ilike('name', '7 Wonders')
      .limit(1)
    
    if (searchError) {
      console.error('Search error:', searchError)
      return
    }
    
    console.log('Search result for "7 Wonders":', searchResult)
    
    // Test rankings table structure
    console.log('\nTesting rankings table...')
    const { data: rankingsData, error: rankingsError } = await supabase
      .from('rankings')
      .select('*')
      .limit(1)
    
    if (rankingsError) {
      console.error('Rankings table error:', rankingsError)
      return
    }
    
    console.log('Rankings sample:', rankingsData)
    
    // Test insert simulation (without actually inserting)
    console.log('\nTesting insert format...')
    const testInsert = {
      user_id: 'test-user-id',
      game_id: searchResult[0]?.id,
      played_it: true,
      own_it: false
    }
    console.log('Would insert:', testInsert)
    
  } catch (err) {
    console.error('Connection error:', err)
  }
}

testDatabase()
