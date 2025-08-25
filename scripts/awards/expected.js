// Expected canonical data for validation
module.exports.expected = {
  spiel_des_jahres: {
    2024: {
      winner: ['Sky Team'],
  nominees: ['Captain Flip','In the Footsteps of Darwin'],
  recommended: ['Harmonies','Match!','Phantom Ink','Schätz it if you can','Trekking Through History','Trio']
    }
  },
  kennerspiel_des_jahres: {
    2024: {
      winner: ['Daybreak'],
      nominees: ['Ticket to Ride Legacy: Legends of the West','The Guild of Merchant Explorers']
    }
  }
};

module.exports.diffSets = function(collectedNames, expectedNames) {
  const col = new Set(collectedNames.map(s=>s.toLowerCase()));
  const exp = new Set(expectedNames.map(s=>s.toLowerCase()));
  const missing = Array.from(exp).filter(x=>!col.has(x));
  const unexpected = Array.from(col).filter(x=>!exp.has(x));
  return { missing, unexpected };
};
