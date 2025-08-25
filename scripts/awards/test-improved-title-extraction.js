#!/usr/bin/env node

const fs = require('fs');

console.log('=== IMPROVED TITLE EXTRACTION ===');

// Read the complete honors dataset
const honorsData = JSON.parse(fs.readFileSync('complete-bgg-honors-with-years.json', 'utf8'));

// Function to extract and clean title from slug
function extractTitle(slug) {
  // Skip first 5 characters (year + dash: "2024-")
  let titlePart = slug.substring(5);
  
  // Replace dashes with spaces
  let withSpaces = titlePart.replace(/-/g, ' ');
  
  // Handle special French characters and words
  const replacements = {
    'lannee': "l'année",
    'dor': "d'Or",
    'dargent': "d'Argent", 
    'de bronze': "de Bronze",
    'jeu de l année': "Jeu de l'Année",
    'as dor': "As d'Or",
    'tric trac': "Tric Trac"
  };
  
  // Apply replacements (case insensitive)
  Object.entries(replacements).forEach(([search, replace]) => {
    const regex = new RegExp(search, 'gi');
    withSpaces = withSpaces.replace(regex, replace);
  });
  
  // Convert to title case, but preserve special formatting
  const titleCase = withSpaces.replace(/\b\w+/g, word => {
    // Don't change already properly formatted words
    if (word.includes("'") || word.includes("'")) {
      return word;
    }
    // Standard title case
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });
  
  // Clean up common patterns
  let cleaned = titleCase
    .replace(/\bDes\b/g, 'des')  // German articles should be lowercase
    .replace(/\bDe\b/g, 'de')    // French articles should be lowercase  
    .replace(/\bDu\b/g, 'du')    // French articles should be lowercase
    .replace(/\bLa\b/g, 'la')    // French articles should be lowercase
    .replace(/\bLe\b/g, 'le')    // French articles should be lowercase
    .replace(/\bAnd\b/g, 'and')  // English conjunctions lowercase
    .replace(/\bOf\b/g, 'of')    // English prepositions lowercase
    .replace(/\bFor\b/g, 'for')  // English prepositions lowercase
    .replace(/\bIn\b/g, 'in')    // English prepositions lowercase
    .replace(/\bThe\b/g, 'the')  // English articles lowercase (except at start)
    ;
  
  // Ensure first word is capitalized
  cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  
  return cleaned;
}

// Test with same examples as before
const testCases = [
  // As d'Or examples
  ...honorsData.filter(h => h.slug.includes('as-dor')).slice(0, 5),
  // German awards
  ...honorsData.filter(h => h.slug.includes('spiel-des-jahres')).slice(0, 3),
  // Tric Trac
  ...honorsData.filter(h => h.slug.includes('tric-trac')).slice(0, 5)
];

console.log('\nImproved title extraction:');
console.log('Original Slug → Improved Title');
console.log('=' .repeat(80));

testCases.forEach(honor => {
  const extractedTitle = extractTitle(honor.slug);
  console.log(`${honor.slug}`);
  console.log(`→ ${extractedTitle}`);
  console.log('');
});

// Test specifically with 2024-2025 As d'Or examples
const recentAsDor = honorsData.filter(h => 
  h.slug.toLowerCase().includes('as-d') && h.year >= 2024
).slice(0, 8);

console.log('\nRecent As d\'Or examples (2024-2025):');
console.log('=' .repeat(60));

recentAsDor.forEach(honor => {
  const extractedTitle = extractTitle(honor.slug);
  console.log(`${honor.year}: ${extractedTitle}`);
});

// Show how this would work for creating honors
console.log('\nSample honor objects with extracted titles:');
recentAsDor.slice(0, 3).forEach(honor => {
  const title = extractTitle(honor.slug);
  console.log(`{`);
  console.log(`  id: "${honor.id}",`);
  console.log(`  year: ${honor.year},`);
  console.log(`  slug: "${honor.slug}",`);
  console.log(`  title: "${title}",`);
  console.log(`  url: "https://boardgamegeek.com${honor.url}"`);
  console.log(`},`);
  console.log('');
});
