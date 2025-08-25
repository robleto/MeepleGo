#!/usr/bin/env node

const fs = require('fs');

console.log('=== TESTING TITLE EXTRACTION FROM SLUGS ===');

// Read the complete honors dataset
const honorsData = JSON.parse(fs.readFileSync('complete-bgg-honors-with-years.json', 'utf8'));

// Function to extract title from slug
function extractTitle(slug) {
  // Skip first 5 characters (year + dash: "2024-")
  const titlePart = slug.substring(5);
  
  // Replace dashes with spaces
  const withSpaces = titlePart.replace(/-/g, ' ');
  
  // Convert to title case
  const titleCase = withSpaces.replace(/\b\w/g, char => char.toUpperCase());
  
  return titleCase;
}

// Test with various types of honors
const testCases = [
  // Find some As d'Or examples
  ...honorsData.filter(h => h.slug.includes('as-dor')).slice(0, 5),
  // Find some German awards
  ...honorsData.filter(h => h.slug.includes('spiel-des-jahres')).slice(0, 3),
  // Find some other awards
  ...honorsData.filter(h => h.slug.includes('golden-geek')).slice(0, 3),
  // Find some Tric Trac
  ...honorsData.filter(h => h.slug.includes('tric-trac')).slice(0, 3)
];

console.log('\nTesting title extraction:');
console.log('Original Slug → Extracted Title');
console.log('=' .repeat(80));

testCases.forEach(honor => {
  const extractedTitle = extractTitle(honor.slug);
  console.log(`${honor.slug}`);
  console.log(`→ ${extractedTitle}`);
  console.log('');
});

// Test specifically with As d'Or examples
const asDorHonors = honorsData.filter(h => 
  h.slug.toLowerCase().includes('as-d') && h.year >= 2020
).slice(0, 10);

console.log('\nAs d\'Or specific examples (2020+):');
console.log('=' .repeat(60));

asDorHonors.forEach(honor => {
  const extractedTitle = extractTitle(honor.slug);
  console.log(`${honor.year}: ${extractedTitle}`);
});

// Check for potential issues
console.log('\nPotential issues to address:');
const issueChecks = [
  {
    name: 'Very long titles',
    items: honorsData.filter(h => h.slug.length > 80).slice(0, 3)
  },
  {
    name: 'Titles with numbers',
    items: honorsData.filter(h => /\d/.test(h.slug.substring(5))).slice(0, 3)
  },
  {
    name: 'Titles with special characters',
    items: honorsData.filter(h => h.slug.includes('lannee') || h.slug.includes('dor')).slice(0, 3)
  }
];

issueChecks.forEach(check => {
  if (check.items.length > 0) {
    console.log(`\n${check.name}:`);
    check.items.forEach(honor => {
      console.log(`  ${honor.slug} → ${extractTitle(honor.slug)}`);
    });
  }
});
