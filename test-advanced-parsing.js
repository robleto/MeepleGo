#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

function parseXMLToGameTest(xmlText) {
  try {
    // Helper function to sanitize XML entities
    const sanitizeXMLText = (text) => {
      return text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#039;/g, "'")
        .replace(/&ldquo;/g, '"')
        .replace(/&rdquo;/g, '"')
        .replace(/&#10;/g, '\n')
        .trim();
    };

    // ✅ BASIC GAME INFO
    const bggIdMatch = xmlText.match(/<item[^>]+id="(\d+)"/);
    const nameMatch = xmlText.match(/<name[^>]+type="primary"[^>]+value="([^"]+)"/);
    const yearMatch = xmlText.match(/<yearpublished[^>]+value="(\d+)"/);
    
    // ✅ IMAGES - Fixed to ensure they're not skipped
    const imageMatch = xmlText.match(/<image>([^<]+)<\/image>/);
    const thumbnailMatch = xmlText.match(/<thumbnail>([^<]+)<\/thumbnail>/);
    
    // ✅ DESCRIPTION - Fixed with non-greedy multiline regex
    const descriptionMatch = xmlText.match(/<description>([\s\S]*?)<\/description>/);
    
    // ✅ PLAYER INFO
    const minPlayersMatch = xmlText.match(/<minplayers[^>]+value="(\d+)"/);
    const maxPlayersMatch = xmlText.match(/<maxplayers[^>]+value="(\d+)"/);
    const playtimeMatch = xmlText.match(/<playingtime[^>]+value="(\d+)"/);
    
    // ✅ CATEGORIES - Fixed to always return arrays
    const categoryMatches = xmlText.match(/<link[^>]+type="boardgamecategory"[^>]+value="([^"]+)"/g);
    const categories = categoryMatches?.map(match => {
      const valueMatch = match.match(/value="([^"]+)"/);
      return valueMatch ? sanitizeXMLText(valueMatch[1]) : '';
    }).filter(Boolean) || [];

    // ✅ MECHANICS - Fixed to always return arrays  
    const mechanicMatches = xmlText.match(/<link[^>]+type="boardgamemechanic"[^>]+value="([^"]+)"/g);
    const mechanics = mechanicMatches?.map(match => {
      const valueMatch = match.match(/value="([^"]+)"/);
      return valueMatch ? sanitizeXMLText(valueMatch[1]) : '';
    }).filter(Boolean) || [];

    // ✅ PUBLISHER
    const publisherMatch = xmlText.match(/<link[^>]+type="boardgamepublisher"[^>]+value="([^"]+)"/);
    const publisher = publisherMatch ? sanitizeXMLText(publisherMatch[1]) : null;

    // ✅ RATINGS DATA from statistics section
    const usersRatedMatch = xmlText.match(/<usersrated[^>]+value="(\d+)"/);
    const averageRatingMatch = xmlText.match(/<average[^>]+value="([\d.]+)"/);
    const rankMatch = xmlText.match(/<rank[^>]+name="boardgame"[^>]+value="(\d+)"/);

    if (!bggIdMatch || !nameMatch) {
      console.log('❌ Missing required fields (ID or name)');
      return null;
    }

    const gameData = {
      bgg_id: parseInt(bggIdMatch[1]),
      name: sanitizeXMLText(nameMatch[1]),
      year_published: yearMatch ? parseInt(yearMatch[1]) : null,
      
      // ✅ Images - ensure these are properly extracted
      image_url: imageMatch?.[1] || null,
      thumbnail_url: thumbnailMatch?.[1] || null,
      
      // ✅ Description - properly sanitized
      description: descriptionMatch ? sanitizeXMLText(descriptionMatch[1]) : null,
      
      // ✅ Arrays - always return arrays (for existing fields only)
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
      num_ratings: usersRatedMatch ? parseInt(usersRatedMatch[1]) : null,
      
      cached_at: new Date().toISOString()
    };
    
    return gameData;
  } catch (error) {
    console.error('❌ Parse error:', error.message);
    return null;
  }
}

async function testAdvancedParsing() {
  console.log('🧪 Testing advanced parsing with existing schema...');
  
  try {
    // Test with Gloomhaven (known good game)
    const bggId = 174430;
    console.log(`📡 Fetching BGG data for game ID ${bggId}...`);
    
    const response = await fetch(`https://boardgamegeek.com/xmlapi2/thing?id=${bggId}&type=boardgame&stats=1`);
    if (!response.ok) {
      throw new Error(`BGG API failed: ${response.status}`);
    }
    
    const xmlText = await response.text();
    console.log(`✅ Received XML (${xmlText.length} characters)`);
    
    const gameData = parseXMLToGameTest(xmlText);
    
    console.log('🔍 Advanced parsing results:');
    if (gameData) {
      console.log('   BGG ID:', gameData.bgg_id);
      console.log('   Name:', gameData.name);
      console.log('   Year:', gameData.year_published);
      console.log('   Image URL:', gameData.image_url ? '✅ Found' : '❌ Missing');
      console.log('   Thumbnail URL:', gameData.thumbnail_url ? '✅ Found' : '❌ Missing');
      console.log('   Description:', gameData.description ? `✅ Found (${gameData.description.length} chars)` : '❌ Missing');
      console.log('   Players:', `${gameData.min_players}-${gameData.max_players}`);
      console.log('   Playtime:', gameData.playtime_minutes, 'minutes');
      console.log('   Publisher:', gameData.publisher);
      console.log('   Categories:', gameData.categories);
      console.log('   Mechanics:', gameData.mechanics);
      console.log('   Rating:', gameData.rating);
      console.log('   Rank:', gameData.rank);
      console.log('   Num Ratings:', gameData.num_ratings);
      
      console.log('📝 Attempting to insert game with advanced parsing...');
      
      const { data, error } = await supabase
        .from('games')
        .upsert(gameData, {
          onConflict: 'bgg_id',
          ignoreDuplicates: false
        })
        .select();
      
      if (error) {
        console.error('❌ Database error:', error);
      } else {
        console.log('✅ Successfully inserted with advanced parsing:', data);
      }
    } else {
      console.log('   ❌ Failed to parse game data');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAdvancedParsing()
