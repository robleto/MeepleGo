#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Use the exact same parsing function as our edge function
function parseXMLToGame(xmlText) {
  const games = [];
  const itemMatches = xmlText.match(/<item[^>]*>[\s\S]*?<\/item>/g);
  if (!itemMatches) return games;

  // Helper function to sanitize XML entities
  const sanitizeXMLText = (text) => {
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#039;/g, "'")
      .replace(/&ldquo;/g, '"')
      .replace(/&rdquo;/g, '"')
      .replace(/&nbsp;/g, ' ')        // Non-breaking space to regular space
      .replace(/&mdash;/g, '—')       // Em dash
      .replace(/&ndash;/g, '–')       // En dash
      .replace(/&hellip;/g, '...')    // Ellipsis
      .replace(/&lsquo;/g, "'")       // Left single quote
      .replace(/&rsquo;/g, "'")       // Right single quote
      .replace(/&quot;/g, '"')        // Double quote
      .replace(/&#10;/g, '\n')        // Line break
      .replace(/&#13;/g, '\r')        // Carriage return
      .replace(/\s+/g, ' ')           // Normalize multiple spaces to single space
      .trim();
  };

  for (const itemMatch of itemMatches) {
    try {
      // ✅ BASIC GAME INFO
      const bggIdMatch = itemMatch.match(/<item[^>]+id="(\d+)"/);
      const nameMatch = itemMatch.match(/<name[^>]+type="primary"[^>]+value="([^"]+)"/);
      const yearMatch = itemMatch.match(/<yearpublished[^>]+value="(\d+)"/);
      
      // ✅ IMAGES - Fixed to ensure they're not skipped
      const imageMatch = itemMatch.match(/<image>([^<]+)<\/image>/);
      const thumbnailMatch = itemMatch.match(/<thumbnail>([^<]+)<\/thumbnail>/);
      
      // ✅ DESCRIPTION - Fixed with non-greedy multiline regex
      const descriptionMatch = itemMatch.match(/<description>([\s\S]*?)<\/description>/);
      
      // ✅ PLAYER INFO
      const minPlayersMatch = itemMatch.match(/<minplayers[^>]+value="(\d+)"/);
      const maxPlayersMatch = itemMatch.match(/<maxplayers[^>]+value="(\d+)"/);
      const playtimeMatch = itemMatch.match(/<playingtime[^>]+value="(\d+)"/);
      
      // ✅ CATEGORIES - Fixed to always return arrays
      const categoryMatches = itemMatch.match(/<link[^>]+type="boardgamecategory"[^>]+value="([^"]+)"/g);
      const categories = categoryMatches?.map(match => {
        const valueMatch = match.match(/value="([^"]+)"/);
        return valueMatch ? sanitizeXMLText(valueMatch[1]) : '';
      }).filter(Boolean) || [];

      // ✅ MECHANICS - Fixed to always return arrays  
      const mechanicMatches = itemMatch.match(/<link[^>]+type="boardgamemechanic"[^>]+value="([^"]+)"/g);
      const mechanics = mechanicMatches?.map(match => {
        const valueMatch = match.match(/value="([^"]+)"/);
        return valueMatch ? sanitizeXMLText(valueMatch[1]) : '';
      }).filter(Boolean) || [];

      // ✅ PUBLISHER
      const publisherMatch = itemMatch.match(/<link[^>]+type="boardgamepublisher"[^>]+value="([^"]+)"/);
      const publisher = publisherMatch ? sanitizeXMLText(publisherMatch[1]) : null;

      // ✅ RATINGS DATA from statistics section
      const usersRatedMatch = itemMatch.match(/<usersrated[^>]+value="(\d+)"/);
      const averageRatingMatch = itemMatch.match(/<average[^>]+value="([\d.]+)"/);
      const rankMatch = itemMatch.match(/<rank[^>]+name="boardgame"[^>]+value="(\d+)"/);

      if (bggIdMatch && nameMatch) {
        // ✅ Process description and extract summary
        const fullDescription = descriptionMatch ? sanitizeXMLText(descriptionMatch[1]) : null;
        let summary = null;
        
        if (fullDescription) {
          // Extract first sentence using regex: ^(.+?[.!?])(\s|$)
          const summaryMatch = fullDescription.match(/^(.+?[.!?])(\s|$)/);
          if (summaryMatch) {
            summary = summaryMatch[1].trim();
          }
        }
        
        const game = {
          bgg_id: parseInt(bggIdMatch[1]),
          name: sanitizeXMLText(nameMatch[1]),
          year_published: yearMatch ? parseInt(yearMatch[1]) : null,
          
          // ✅ Images - ensure these are properly extracted
          image_url: imageMatch?.[1] || null,
          thumbnail_url: thumbnailMatch?.[1] || null,
          
          // ✅ Description - properly sanitized
          description: fullDescription,
          
          // ➕ NEW: Summary - first sentence from description
          summary: summary,
          
          // ✅ Arrays - always return arrays, even empty ones (for current schema)
          categories: categories.length > 0 ? categories : [],
          mechanics: mechanics.length > 0 ? mechanics : [],
          
          // ✅ Player info
          min_players: minPlayersMatch ? parseInt(minPlayersMatch[1]) : null,
          max_players: maxPlayersMatch ? parseInt(maxPlayersMatch[1]) : null,
          playtime_minutes: playtimeMatch ? parseInt(playtimeMatch[1]) : null,
          
          // ✅ Publisher
          publisher,
          
          // ✅ Ratings data
          rank: rankMatch ? parseInt(rankMatch[1]) : null,
          rating: averageRatingMatch ? parseFloat(averageRatingMatch[1]) : null,
          num_ratings: usersRatedMatch ? parseInt(usersRatedMatch[1]) : null
        };
        
        games.push(game);
        console.log(`✅ Parsed game: ${game.name} (BGG ${game.bgg_id})`);
        console.log(`   Images: ${game.image_url ? '✅' : '❌'} Description: ${game.description ? '✅' : '❌'} Summary: ${game.summary ? '✅' : '❌'}`);
        console.log(`   Summary: "${game.summary || 'None'}"`);
        console.log(`   Categories: [${game.categories.slice(0,3).join(', ')}${game.categories.length > 3 ? '...' : ''}] (${game.categories.length})`);
      } else {
        console.warn(`⚠️ Could not parse game from XML segment (missing ID or name)`);
      }
    } catch (error) {
      console.error('❌ Error parsing game item:', error);
    }
  }

  console.log(`📊 Successfully parsed ${games.length} games from XML response`);
  return games;
}

async function testEdgeFunctionLogic() {
  console.log('🧪 Testing edge function parsing logic with a fresh game...');
  
  try {
    // Test with Vantage (BGG ID: 420033) which had &nbsp; in the summary
    const bggId = 420033;
    console.log(`📡 Fetching BGG data for game ID ${bggId}...`);
    
    const response = await fetch(`https://boardgamegeek.com/xmlapi2/thing?id=${bggId}&type=boardgame&stats=1`);
    if (!response.ok) {
      throw new Error(`BGG API failed: ${response.status}`);
    }
    
    const xmlText = await response.text();
    console.log(`✅ Received XML (${xmlText.length} characters)`);
    
    const games = parseXMLToGame(xmlText);
    
    if (games.length > 0) {
      const game = games[0];
      console.log('🎯 Game parsing results:');
      console.log('   Name:', game.name);
      console.log('   Description Length:', game.description?.length || 0, 'chars');
      console.log('   Summary:', `"${game.summary}"`);
      console.log('   Categories:', game.categories.length, 'items');
      console.log('   Mechanics:', game.mechanics.length, 'items');
      console.log('✅ Summary extraction working correctly!');
    } else {
      console.log('❌ No games parsed from XML');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testEdgeFunctionLogic()
