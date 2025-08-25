// Central award configuration
module.exports = {
  awards: [
    {
      id: 'spiel_des_jahres',
      display: 'Spiel des Jahres',
      startYear: 1979,
  mode: 'pages', // honor pages (disable aggregate attempt noisy 404)
  aggregateUrl: null, // no aggregate page confirmed yet
      // Optional hints for parsing if structure changes
      aggregate: {
        yearPattern: /(19|20)\d{2}/g,
        winnerMarkers: [/Winner/i, /Spiel des Jahres/i],
        nomineeMarkers: [/Nominee/i],
        recommendedMarkers: [/Recommended/i]
      },
      // Legacy honor page fallback (keep patterns in case pages return later)
      slugPatterns: ['spiel-des-jahres'],
      excludeSlugSubstrings: ['kennerspiel','kinder'],
      categories: { // honor-page mapping
  // Winner only if plain year winner slug (no variant tokens)
  winner: /^(\d{4})-spiel-des-jahres-winner$/,
        nominee: /-nominee/,
        recommended: /-recommended/,
  special: /(beautiful-game|cooperative-family-game|literary-game|dexterity-game|childrens-game|complex-game|fantasy-game|new-worlds-game|party-game|historical-game|special-prize-game|special-prize|game-of-the-ye)/
      },
      normalizeCategory(slug) {
  // Order: recommended, nominee, plain winner, specials
  if (this.categories && this.categories.recommended.test(slug)) return { category: 'Recommended' };
  if (this.categories && this.categories.nominee.test(slug)) return { category: 'Nominee' };
  if (this.categories && this.categories.winner.test(slug)) return { category: 'Winner' };
  if (this.categories && this.categories.special.test(slug)) return { category: 'Special' };
  // Any other -winner variant we didn't pattern-match becomes Special
  if (/-winner$/.test(slug)) return { category: 'Special' };
  return { category: 'Special' };
      }
    },
    {
      id: 'kennerspiel_des_jahres',
      display: 'Kennerspiel des Jahres',
      startYear: 2011,
      mode: 'aggregate',
      aggregateUrl: 'https://boardgamegeek.com/award/kennerspiel-des-jahres', // TODO: confirm
      aggregate: {
        yearPattern: /(20)\d{2}/g,
        winnerMarkers: [/Winner/i, /Kennerspiel des Jahres/i],
        nomineeMarkers: [/Nominee/i]
      },
      slugPatterns: ['kennerspiel-des-jahres'],
      categories: {
        winner: /-winner$/,
        nominee: /-nominee/,
      },
      normalizeCategory(slug) {
        if (this.categories && this.categories.winner.test(slug)) return { category: 'Winner' };
        if (this.categories && this.categories.nominee.test(slug)) return { category: 'Nominee' };
        return { category: 'Special' };
      }
    }
  ]
};
