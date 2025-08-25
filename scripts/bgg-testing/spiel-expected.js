// Expected Spiel & Kennerspiel datasets for validation of scraped honor pages.
// Extend with prior years to enable historical validation.

module.exports.SPIEL_EXPECTED = {
  2024: {
    winner: 'Sky Team',
    nominees: ['Captain Flip','In the Footsteps of Darwin'],
    recommended: ['Die 7 Bazis','Agent Avenue','Castle Combo','Cities','Foxy','Perfect Words','The Animals of Baker Street']
  }
  // TODO: Add earlier years (1979+)
};

module.exports.KENNER_EXPECTED = {
  2024: {
    winner: 'Daybreak',
    nominees: ['Ticket to Ride Legacy: Legends of the West','The Guild of Merchant Explorers']
  }
  // TODO: Add earlier years (2011+)
};

module.exports.validateHonorSet = function(year, collected, expected) {
  const missing = [];
  const unexpected = [];
  const expSet = new Set(expected.map(e=>e.toLowerCase()));
  const colSet = new Set(collected.map(e=>e.toLowerCase()));
  for (const e of expSet) if (!colSet.has(e)) missing.push(e);
  for (const c of colSet) if (!expSet.has(c)) unexpected.push(c);
  return { missing, unexpected };
};
