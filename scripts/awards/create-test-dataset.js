#!/usr/bin/env node

const fs = require('fs');

// Create a small test dataset with known As d'Or honors
const testHonors = [
  {
    "id": "104574",
    "slug": "2024-as-dor-jeu-de-lannee-winner",
    "url": "/boardgamehonor/104574/2024-as-dor-jeu-de-lannee-winner",
    "year": 2024,
    "title": "As d'or Jeu de l'année Winner"
  },
  {
    "id": "104575",
    "slug": "2024-as-dor-jeu-de-lannee-initie-winner",
    "url": "/boardgamehonor/104575/2024-as-dor-jeu-de-lannee-initie-winner",
    "year": 2024,
    "title": "As d'or Jeu de l'année Initié Winner"
  }
];

fs.writeFileSync('test-asdor-honors-mini.json', JSON.stringify(testHonors, null, 2));
console.log('Created test-asdor-honors-mini.json with 2 As d\'Or honors for testing');
