#!/usr/bin/env node
// Reconcile 2024 Spiel des Jahres honors with current expected set.
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const { expected } = require('./expected');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const YEAR = 2024;
const AWARD_TYPE = 'Spiel des Jahres';

async function fetchGamesWithHonors() {
  const { data, error } = await supabase.from('games').select('*').not('honors','eq','[]');
  if (error) throw error;
  return data;
}

async function fetchExpectedGames(allNames) {
  // Fetch games matching expected names even if they currently have no honors
  // Break into chunks to avoid URL length issues
  const chunks = [];
  const names = Array.from(new Set(allNames));
  const MAX_CHUNK = 20; // conservative
  for (let i=0;i<names.length;i+=MAX_CHUNK) chunks.push(names.slice(i,i+MAX_CHUNK));
  const collected = [];
  for (const chunk of chunks) {
    const { data, error } = await supabase.from('games').select('*').in('name', chunk);
    if (error) throw error;
    collected.push(...data);
  }
  return collected;
}

function normalizeName(s){return s.toLowerCase();}

async function ensureHonor(game, honor) {
  const honors = Array.isArray(game.honors)? [...game.honors]:[];
  const exists = honors.some(h => h.name === honor.name);
  if (!exists) {
    honors.push(honor);
    await supabase.from('games').update({ honors }).eq('bgg_id', game.bgg_id);
    return 'added';
  }
  return 'kept';
}

async function run() {
  const exp = expected.spiel_des_jahres[YEAR];
  if (!exp) { console.error('No expected set for 2024'); process.exit(1); }
  const want = {
    Winner: new Set(exp.winner.map(normalizeName)),
    Nominee: new Set(exp.nominees.map(normalizeName)),
    Special: new Set(exp.recommended.map(normalizeName)) // stored as Special in DB display Recommended on UI
  };

  // Prepare expected name list (winner + nominees + recommended)
  const expectedNames = [
    ...exp.winner,
    ...exp.nominees,
    ...(exp.recommended||[])
  ];

  const gamesWithHonors = await fetchGamesWithHonors();
  const expectedGames = await fetchExpectedGames(expectedNames);

  // Merge unique by bgg_id
  const mergedMap = new Map();
  for (const g of [...gamesWithHonors, ...expectedGames]) mergedMap.set(g.bgg_id, g);
  const games = Array.from(mergedMap.values());
  const nameIndex = new Map();
  games.forEach(g => nameIndex.set(normalizeName(g.name), g));

  const summary = { removed: 0, added: 0, kept: 0 };

  // Remove any 2024 Spiel honors not in expected
  for (const g of games) {
    const honors = Array.isArray(g.honors)? g.honors:[];
    const filtered = honors.filter(h => {
      if (h.award_type !== AWARD_TYPE || h.year !== YEAR) return true;
      const set = want[h.category];
      if (!set) return false; // unknown category -> drop
      if (!set.has(normalizeName(g.name))) { summary.removed++; return false; }
      return true;
    });
    if (filtered.length !== honors.length) {
      await supabase.from('games').update({ honors: filtered }).eq('bgg_id', g.bgg_id);
    }
  }

  // Add missing honors
  for (const [cat, set] of Object.entries(want)) {
    for (const nm of set) {
      const g = nameIndex.get(nm);
      if (!g) continue; // game not present
      const honor = {
        name: `${YEAR} ${AWARD_TYPE} ${cat==='Special'?'Recommended':cat}`,
        year: YEAR,
        category: cat,
        award_type: AWARD_TYPE,
        description: `${cat==='Special'?'Recommended':cat} for the ${YEAR} ${AWARD_TYPE}`
      };
      const res = await ensureHonor(g, honor);
      summary[res]++;
    }
  }

  console.log('2024 Spiel reconciliation summary:', summary);
}

run().catch(e=>{ console.error(e); process.exit(1); });
