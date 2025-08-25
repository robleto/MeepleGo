#!/usr/bin/env node

const fs = require('fs');

console.log('=== COMPILING COMPLETE BGG HONORS DATASET ===');

// Read all the collected honor files
const files = [
  'all-bgg-honors-authenticated.json',  // Pages 1-34 + 41 + 51
  'honors-pages-34-60.json'            // Pages 34-60 (retry)
];

let allHonors = [];

files.forEach(filename => {
  if (fs.existsSync(filename)) {
    console.log(`Reading ${filename}...`);
    const data = JSON.parse(fs.readFileSync(filename, 'utf8'));
    console.log(`  Found ${data.length} honors`);
    allHonors.push(...data);
  } else {
    console.log(`Warning: ${filename} not found, skipping...`);
  }
});

console.log(`\nTotal honors before deduplication: ${allHonors.length}`);

// Remove duplicates by ID
const uniqueHonors = [];
const seenIds = new Set();

allHonors.forEach(honor => {
  if (!seenIds.has(honor.id)) {
    seenIds.add(honor.id);
    uniqueHonors.push(honor);
  }
});

console.log(`Total unique honors: ${uniqueHonors.length}`);
console.log(`Duplicates removed: ${allHonors.length - uniqueHonors.length}`);

// Add year field to each honor
console.log('\nAdding year field to each honor...');
const enhancedHonors = uniqueHonors.map(honor => {
  // Extract first 4 characters from slug as year
  const year = honor.slug.substring(0, 4);
  
  // Validate it's a reasonable year
  const yearNum = parseInt(year);
  const isValidYear = /^\d{4}$/.test(year) && yearNum >= 1970 && yearNum <= 2030;
  
  return {
    ...honor,
    year: isValidYear ? yearNum : null
  };
});

// Sort by year, then by slug
enhancedHonors.sort((a, b) => {
  if (a.year !== b.year) {
    return (a.year || 0) - (b.year || 0);
  }
  return a.slug.localeCompare(b.slug);
});

// Statistics
const withYear = enhancedHonors.filter(h => h.year !== null);
const withoutYear = enhancedHonors.filter(h => h.year === null);

console.log(`\nResults:`);
console.log(`  Entries with valid year: ${withYear.length}`);
console.log(`  Entries without valid year: ${withoutYear.length}`);

if (withYear.length > 0) {
  const years = withYear.map(h => h.year).sort((a, b) => a - b);
  const minYear = years[0];
  const maxYear = years[years.length - 1];
  console.log(`  Year range: ${minYear} - ${maxYear}`);
  
  // Year distribution
  const yearCounts = {};
  years.forEach(year => {
    yearCounts[year] = (yearCounts[year] || 0) + 1;
  });
  
  console.log(`\nTop years by honor count:`);
  Object.entries(yearCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([year, count]) => {
      console.log(`  ${year}: ${count} honors`);
    });
}

// As d'Or analysis
const asDorHonors = enhancedHonors.filter(honor => 
  honor.slug.toLowerCase().includes('as-d') || 
  honor.slug.toLowerCase().includes('dor') ||
  honor.slug.toLowerCase().includes('enfant') ||
  honor.slug.toLowerCase().includes('jeu-de-l') ||
  honor.slug.toLowerCase().includes('tric-trac') ||
  honor.slug.toLowerCase().includes('palme-d')
);

console.log(`\nAs d'Or related honors found: ${asDorHonors.length}`);

// Categorize As d'Or honors
const asDorCategories = {};
asDorHonors.forEach(honor => {
  const slug = honor.slug.toLowerCase();
  let category = 'Other';
  
  if (slug.includes('as-dor') || slug.includes('as-d-or')) {
    if (slug.includes('enfant')) category = 'As d\'Or Enfant';
    else if (slug.includes('expert')) category = 'As d\'Or Expert';
    else if (slug.includes('initie')) category = 'As d\'Or Initié';
    else category = 'As d\'Or Main';
  } else if (slug.includes('tric-trac')) {
    category = 'Tric Trac d\'Or';
  } else if (slug.includes('palme-d')) {
    category = 'Palme d\'Or';
  } else if (slug.includes('lys')) {
    category = 'Lys Enfant';
  }
  
  asDorCategories[category] = (asDorCategories[category] || 0) + 1;
});

console.log(`\nAs d'Or categories:`);
Object.entries(asDorCategories)
  .sort((a, b) => b[1] - a[1])
  .forEach(([category, count]) => {
    console.log(`  ${category}: ${count} honors`);
  });

// Show As d'Or year range
const asDorYears = asDorHonors
  .filter(h => h.year !== null)
  .map(h => h.year)
  .sort((a, b) => a - b);

if (asDorYears.length > 0) {
  console.log(`\nAs d'Or year range: ${asDorYears[0]} - ${asDorYears[asDorYears.length - 1]}`);
}

// Save the complete dataset
const outputFile = 'complete-bgg-honors-with-years.json';
fs.writeFileSync(outputFile, JSON.stringify(enhancedHonors, null, 2));
console.log(`\n=== COMPLETE DATASET SAVED ===`);
console.log(`File: ${outputFile}`);
console.log(`Total honors: ${enhancedHonors.length}`);
console.log(`As d'Or honors: ${asDorHonors.length}`);

// Show sample entries
console.log(`\nSample entries:`);
enhancedHonors.slice(0, 3).forEach(honor => {
  console.log(`  ${honor.year}: ${honor.slug} (ID: ${honor.id})`);
});

console.log(`\nSample As d'Or entries:`);
asDorHonors.slice(0, 5).forEach(honor => {
  console.log(`  ${honor.year}: ${honor.slug} (ID: ${honor.id})`);
});
