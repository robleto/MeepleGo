#!/usr/bin/env node
/*
 * Fix Golden Geek categories in enhanced-honors-complete.json
 * Logic: For truncated titles ending in "prese" (presentation), 
 * single-game honors = Winner, multi-game honors = Nominee
 */

const fs = require('fs');
const path = require('path');

const inputFile = 'enhanced-honors-complete.json';
const outputFile = 'enhanced-honors-complete.fixed.json';

function fixHonorCategories() {
  console.log('🔧 Loading honors JSON...');
  const raw = fs.readFileSync(inputFile, 'utf8');
  const honors = JSON.parse(raw);
  
  console.log(`📊 Processing ${honors.length} honors...`);
  
  // Group honors by position/year to find winner vs nominee patterns
  const groups = new Map();
  
  honors.forEach(honor => {
    if (honor.awardSet?.includes('Golden Geek')) {
      const key = `${honor.position}-${honor.year}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key).push(honor);
    }
  });
  
  let updated = 0;
  
  // Process each honor
  honors.forEach(honor => {
    if (!honor.awardSet?.includes('Golden Geek')) return;
    
    const key = `${honor.position}-${honor.year}`;
    const group = groups.get(key) || [];
    
    // Find if this honor has a truncated title ending in "prese"
    const isTruncatedPresentation = honor.title?.toLowerCase().endsWith('prese') || 
                                   honor.slug?.includes('artwork-and-prese');
    
    if (isTruncatedPresentation) {
      const gameCount = honor.boardgames?.length || 0;
      
      if (gameCount === 1) {
        // Single game = Winner
        if (!honor.category || honor.category === 'Special') {
          honor.category = 'Winner';
          honor.result_raw = 'Winner';
          honor.derived_result = 'Winner';
          updated++;
          console.log(`✅ Fixed ${honor.id}: ${honor.title} -> Winner (${gameCount} game)`);
        }
      } else if (gameCount > 1) {
        // Multiple games = Nominees
        if (!honor.category || honor.category === 'Special') {
          honor.category = 'Nominee';
          honor.result_raw = 'Nominee';
          honor.derived_result = 'Nominee';
          updated++;
          console.log(`✅ Fixed ${honor.id}: ${honor.title} -> Nominee (${gameCount} games)`);
        }
      }
    }
    
    // Also fix other truncated Golden Geek patterns
    const corpus = `${honor.slug || ''} ${honor.title || ''}`.toLowerCase();
    if (honor.awardSet?.includes('Golden Geek') && !honor.category) {
      if (corpus.includes('-winn') || corpus.endsWith('winn')) {
        honor.category = 'Winner';
        honor.result_raw = 'Winner';
        honor.derived_result = 'Winner';
        updated++;
        console.log(`✅ Fixed ${honor.id}: ${honor.title} -> Winner (truncated)`);
      } else if (corpus.includes('-nomin') || corpus.includes('nomin')) {
        honor.category = 'Nominee';
        honor.result_raw = 'Nominee'; 
        honor.derived_result = 'Nominee';
        updated++;
        console.log(`✅ Fixed ${honor.id}: ${honor.title} -> Nominee (truncated)`);
      }
    }
  });
  
  console.log(`🎯 Updated ${updated} honors`);
  console.log(`💾 Writing to ${outputFile}...`);
  
  fs.writeFileSync(outputFile, JSON.stringify(honors, null, 2));
  console.log('✅ Done!');
}

fixHonorCategories();
