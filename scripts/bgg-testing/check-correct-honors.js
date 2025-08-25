async function checkCorrectHonorIds() {
  console.log('Checking honor IDs around 106852...\n');
  
  const baseId = 106852;
  const variations = [
    { id: baseId - 2, name: '2024-spiel-des-jahres-recommended' },
    { id: baseId - 1, name: '2024-spiel-des-jahres-nominee' },
    { id: baseId, name: '2024-spiel-des-jahres-winner' },
    { id: baseId + 1, name: '2024-kennerspiel-des-jahres-recommended' },
    { id: baseId + 2, name: '2024-kennerspiel-des-jahres-nominee' },
    { id: baseId + 3, name: '2024-kennerspiel-des-jahres-winner' }
  ];
  
  const validHonors = [];
  
  for (const variation of variations) {
    const url = `https://boardgamegeek.com/boardgamehonor/${variation.id}/${variation.name}`;
    console.log(`Testing ${variation.id}: ${variation.name}`);
    
    try {
      const response = await fetch(url);
      if (response.ok) {
        const html = await response.text();
        
        if (!html.includes('This page does not exist')) {
          console.log(`  ✓ Valid honor page found!`);
          validHonors.push({
            honor_id: variation.id,
            name: variation.name,
            url: url
          });
        } else {
          console.log(`  - Page exists but no content yet`);
        }
      } else {
        console.log(`  ✗ Not found (${response.status})`);
      }
    } catch (error) {
      console.log(`  ✗ Error: ${error.message}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log(`\n=== VALID 2024 HONOR PAGES ===`);
  validHonors.forEach(honor => {
    console.log(`${honor.honor_id}: ${honor.name}`);
    console.log(`  URL: ${honor.url}`);
  });
  
  return validHonors;
}

// Run the check
checkCorrectHonorIds()
  .then(honors => {
    console.log(`\nFound ${honors.length} valid honor pages for 2024`);
  })
  .catch(error => {
    console.error('Error:', error);
  });
