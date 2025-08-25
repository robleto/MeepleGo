#!/usr/bin/env node

const fs = require('fs');

console.log('=== FINAL TITLE EXTRACTION TEST ===');

// Function to extract and clean title from slug
function extractTitle(slug) {
  // Skip first 5 characters (year + dash: "2024-")
  let titlePart = slug.substring(5);
  
  // Replace dashes with spaces
  let withSpaces = titlePart.replace(/-/g, ' ');
  
  // Handle special patterns first (before title casing)
  const preReplacements = {
    'lannee': "l'année",
    'dor': "d'or",
    'dargent': "d'argent", 
    'de bronze': "de bronze",
    'as dor': "As d'Or",
    'tric trac': "Tric Trac"
  };
  
  // Apply pre-replacements (case insensitive)
  Object.entries(preReplacements).forEach(([search, replace]) => {
    const regex = new RegExp('\\b' + search + '\\b', 'gi');
    withSpaces = withSpaces.replace(regex, replace);
  });
  
  // Convert to title case, but preserve special formatting
  const titleCase = withSpaces.replace(/\b[\w']+/g, word => {
    // Don't change already properly formatted words with apostrophes
    if (word.includes("'") && (word.toLowerCase().includes("d'") || word.toLowerCase().includes("l'"))) {
      return word;
    }
    // Standard title case
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });
  
  // Final cleanup for articles and prepositions
  let cleaned = titleCase
    .replace(/\bDes\b/g, 'des')
    .replace(/\bDe\b/g, 'de')  
    .replace(/\bDu\b/g, 'du')
    .replace(/\bLa\b/g, 'la')
    .replace(/\bLe\b/g, 'le')
    .replace(/\bAnd\b/g, 'and')
    .replace(/\bOf\b/g, 'of')
    .replace(/\bFor\b/g, 'for')
    .replace(/\bIn\b/g, 'in')
    .replace(/\bThe\b/g, 'the')
    .replace(/\bWith\b/g, 'with')
    .replace(/\bAt\b/g, 'at')
    .replace(/\bOn\b/g, 'on')
    .replace(/\bTo\b/g, 'to')
    ;
  
  // Ensure first word is capitalized
  cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  
  return cleaned;
}

// Read the complete honors dataset
const honorsData = JSON.parse(fs.readFileSync('complete-bgg-honors-with-years.json', 'utf8'));

// Test with As d'Or examples
const asDorTests = [
  '2024-as-dor-jeu-de-lannee-enfant-nominee',
  '2024-as-dor-jeu-de-lannee-expert-winner', 
  '2022-tric-trac-dor',
  '2001-tric-trac-dargent',
  '1979-spiel-des-jahres-winner',
  '2006-golden-geek-best-family-board-game-winner'
];

console.log('Final title extraction test:');
console.log('Original Slug → Final Title');
console.log('=' .repeat(70));

asDorTests.forEach(slug => {
  const title = extractTitle(slug);
  console.log(`${slug}`);
  console.log(`→ ${title}`);
  console.log('');
});

// Test with real data from our dataset
const realExamples = honorsData.filter(h => 
  h.slug.includes('as-dor-jeu-de-lannee') && h.year >= 2023
).slice(0, 5);

console.log('Real 2023+ As d\'Or examples:');
console.log('=' .repeat(50));

realExamples.forEach(honor => {
  const title = extractTitle(honor.slug);
  console.log(`${honor.year}: ${title}`);
});

console.log(`\nThis approach looks good for title extraction! ✅`);
console.log(`\nNext step: Apply this to create honor titles in the dataset.`);
