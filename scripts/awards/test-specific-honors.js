#!/usr/bin/env node

const fs = require('fs');

// Test with specific As d'Or honors to verify parsing
const honorsDataset = JSON.parse(fs.readFileSync('complete-bgg-honors-with-titles.json', 'utf8'));

// Find some recent As d'Or honors
const asDorHonors = honorsDataset.filter(h => 
  h.title && h.title.toLowerCase().includes('as d\'or') && h.year >= 2024
).slice(0, 3);

console.log('Testing with these honors:');
asDorHonors.forEach(honor => {
  console.log(`  ${honor.year}: ${honor.title} (ID: ${honor.id})`);
});

// Create a test file with just these honors
fs.writeFileSync('test-asdor-honors.json', JSON.stringify(asDorHonors, null, 2));
console.log('\nTest honors saved to test-asdor-honors.json');

// Now run the enhancement script on these specific honors
require('./enhance-honors-with-details.js');
