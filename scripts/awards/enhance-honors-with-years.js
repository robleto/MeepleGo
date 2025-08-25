#!/usr/bin/env node

const fs = require('fs');

console.log('=== ADDING YEAR FIELD TO HONOR DATA ===');

// Read the existing honors data
const honorsData = JSON.parse(fs.readFileSync('all-bgg-honors.json', 'utf8'));

console.log(`Processing ${honorsData.length} honor entries...`);

// Add year field to each honor
const enhancedHonors = honorsData.map(honor => {
  // Extract first 4 characters from slug as year
  const year = honor.slug.substring(0, 4);
  
  // Validate it's a reasonable year (numbers only and within expected range)
  const yearNum = parseInt(year);
  const isValidYear = /^\d{4}$/.test(year) && yearNum >= 1970 && yearNum <= 2030;
  
  return {
    ...honor,
    year: isValidYear ? yearNum : null
  };
});

// Show some statistics
const withYear = enhancedHonors.filter(h => h.year !== null);
const withoutYear = enhancedHonors.filter(h => h.year === null);

console.log(`\nResults:`);
console.log(`  Entries with valid year: ${withYear.length}`);
console.log(`  Entries without valid year: ${withoutYear.length}`);

if (withoutYear.length > 0) {
  console.log(`\nEntries without valid year:`);
  withoutYear.slice(0, 5).forEach(honor => {
    console.log(`  ${honor.id}: ${honor.slug.substring(0, 10)}...`);
  });
}

// Show year range
if (withYear.length > 0) {
  const years = withYear.map(h => h.year).sort((a, b) => a - b);
  const minYear = years[0];
  const maxYear = years[years.length - 1];
  console.log(`\nYear range: ${minYear} - ${maxYear}`);
  
  // Show year distribution
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

// Save the enhanced data
const outputFile = 'all-bgg-honors-with-years.json';
fs.writeFileSync(outputFile, JSON.stringify(enhancedHonors, null, 2));
console.log(`\nEnhanced data saved to: ${outputFile}`);

// Show sample entries
console.log(`\nSample enhanced entries:`);
enhancedHonors.slice(0, 3).forEach(honor => {
  console.log(`  ${honor.year}: ${honor.slug} (ID: ${honor.id})`);
});

// Look for As d'Or related entries specifically
const asDorHonors = enhancedHonors.filter(honor => 
  honor.slug.toLowerCase().includes('as-d') || 
  honor.slug.toLowerCase().includes('dor') ||
  honor.slug.toLowerCase().includes('tric-trac')
);

console.log(`\nAs d'Or related honors found: ${asDorHonors.length}`);
asDorHonors.forEach(honor => {
  console.log(`  ${honor.year}: ${honor.slug} (ID: ${honor.id})`);
});
