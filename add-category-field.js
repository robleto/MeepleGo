const fs = require('fs');

// Read the current JSON file
const honorsData = JSON.parse(fs.readFileSync('enhanced-honors-complete.json', 'utf8'));

// Add category field based on winner/nominee logic
const updatedData = honorsData.map(honor => {
  // Skip non-Golden Geek awards for now
  if (!honor.awardSet || !honor.awardSet.includes('Golden Geek')) {
    return honor;
  }
  
  // Determine category based on number of games
  let category = 'Nominee'; // default
  
  if (honor.boardgames?.length === 1) {
    category = 'Winner';
  } else if (honor.boardgames?.length > 1) {
    category = 'Nominee';
  } else if (honor.boardgames?.length === 0) {
    category = 'Special'; // or 'Unknown'
  }
  
  return {
    ...honor,
    category
  };
});

// Write back to file
fs.writeFileSync('enhanced-honors-complete-with-categories.json', JSON.stringify(updatedData, null, 2));

console.log('Added category field to Golden Geek honors');
console.log('Original entries:', honorsData.length);
console.log('Updated entries:', updatedData.length);

// Show some stats
const goldenGeekEntries = updatedData.filter(h => h.awardSet && h.awardSet.includes('Golden Geek'));
const categoryStats = goldenGeekEntries.reduce((stats, entry) => {
  stats[entry.category] = (stats[entry.category] || 0) + 1;
  return stats;
}, {});

console.log('Golden Geek category breakdown:', categoryStats);
