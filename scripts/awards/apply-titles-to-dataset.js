#!/usr/bin/env node

const fs = require('fs');

console.log('=== APPLYING TITLE EXTRACTION TO COMPLETE DATASET ===');

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
console.log('Reading complete honors dataset...');
const honorsData = JSON.parse(fs.readFileSync('complete-bgg-honors-with-years.json', 'utf8'));

console.log(`Processing ${honorsData.length} honors...`);

// Add title field to each honor
const honorsWithTitles = honorsData.map((honor, index) => {
  if (index % 1000 === 0) {
    console.log(`  Processed ${index}/${honorsData.length} honors...`);
  }
  
  const title = extractTitle(honor.slug);
  
  return {
    ...honor,
    title: title
  };
});

console.log(`\nCompleted processing ${honorsWithTitles.length} honors.`);

// Save the enhanced dataset
const outputFile = 'complete-bgg-honors-with-titles.json';
fs.writeFileSync(outputFile, JSON.stringify(honorsWithTitles, null, 2));

console.log(`\n=== DATASET WITH TITLES SAVED ===`);
console.log(`File: ${outputFile}`);
console.log(`Total honors: ${honorsWithTitles.length}`);

// Show some statistics
const withTitles = honorsWithTitles.filter(h => h.title && h.title.length > 0);
console.log(`Honors with titles: ${withTitles.length}`);

// Show samples by category
const categories = {
  'As d\'Or': honorsWithTitles.filter(h => h.title.toLowerCase().includes('as d\'or')),
  'Tric Trac': honorsWithTitles.filter(h => h.title.toLowerCase().includes('tric trac')),
  'Spiel des Jahres': honorsWithTitles.filter(h => h.title.toLowerCase().includes('spiel des jahres')),
  'Golden Geek': honorsWithTitles.filter(h => h.title.toLowerCase().includes('golden geek')),
  'Origins Awards': honorsWithTitles.filter(h => h.title.toLowerCase().includes('origins')),
};

console.log(`\nSample titles by category:`);
Object.entries(categories).forEach(([category, honors]) => {
  if (honors.length > 0) {
    console.log(`\n${category} (${honors.length} total):`);
    honors.slice(0, 3).forEach(honor => {
      console.log(`  ${honor.year}: ${honor.title}`);
    });
  }
});

// Show As d'Or specific analysis
const asDorHonors = honorsWithTitles.filter(h => 
  h.title.toLowerCase().includes('as d\'or') || 
  h.title.toLowerCase().includes('tric trac d\'or')
);

console.log(`\n=== AS D'OR ANALYSIS ===`);
console.log(`Total As d'Or related honors: ${asDorHonors.length}`);

// Group by year
const asDorByYear = {};
asDorHonors.forEach(honor => {
  if (honor.year) {
    asDorByYear[honor.year] = (asDorByYear[honor.year] || 0) + 1;
  }
});

const years = Object.keys(asDorByYear).sort();
if (years.length > 0) {
  console.log(`Year range: ${years[0]} - ${years[years.length - 1]}`);
  console.log(`\nAs d'Or honors by year (recent):`);
  Object.entries(asDorByYear)
    .filter(([year]) => parseInt(year) >= 2020)
    .sort((a, b) => b[0] - a[0])
    .forEach(([year, count]) => {
      console.log(`  ${year}: ${count} honors`);
    });
}

// Show recent As d'Or examples
console.log(`\nRecent As d'Or titles (2024-2025):`);
asDorHonors
  .filter(h => h.year >= 2024)
  .slice(0, 8)
  .forEach(honor => {
    console.log(`  ${honor.year}: ${honor.title} (ID: ${honor.id})`);
  });

console.log(`\n✅ Complete dataset with titles ready for As d'Or import!`);
