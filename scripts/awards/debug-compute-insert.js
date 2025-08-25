#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
if (!args.length) {
  console.error('Usage: node debug-compute-insert.js <bggId> [bggId ...]');
  process.exit(1);
}

const DATA_FILE = path.join(process.cwd(), 'enhanced-honors-complete.json');
if (!fs.existsSync(DATA_FILE)) { console.error('Data file not found:', DATA_FILE); process.exit(1); }
const raw = fs.readFileSync(DATA_FILE, 'utf8');
const honorsArray = JSON.parse(raw);

function deriveAwardType(awardSet) {
  if (!awardSet) return null;
  return awardSet.replace(/^\d{4}\s+/, '').trim();
}
function deriveCategory(position, awardType) {
  if (!position) return null;
  const normPos = position.trim();
  if (awardType && normPos.startsWith(awardType)) {
    const tail = normPos.slice(awardType.length).trim();
    return tail.length ? tail : awardType;
  }
  return normPos;
}
function deriveResultType(entry) {
  const s = (entry.slug || entry.title || '').toLowerCase();
  if (s.includes('winner')) return 'Winner';
  if (s.includes('nominee')) return 'Nominee';
  if (s.includes('recommended')) return 'Recommended';
  if (s.includes('finalist')) return 'Finalist';
  if (s.includes('runner')) return 'Runner-up';
  return null;
}
function deriveResultFromPosition(position) {
  if (!position) return null;
  const s = position.toLowerCase();
  if (s.includes('winner')) return 'Winner';
  if (s.includes('nominee')) return 'Nominee';
  if (s.includes('recommended')) return 'Special';
  if (s.includes('finalist')) return 'Nominee';
  if (s.includes('runner')) return 'Nominee';
  return null;
}

const perGame = new Map();
const nowIso = new Date().toISOString();
const usableHonors = honorsArray.filter(h => {
  if (!h || !Array.isArray(h.boardgames) || !h.boardgames.length) return false;
  if (!h.year || !h.awardSet) return false;
  // allowMissingPosition in this debug
  return true;
});

for (const entry of usableHonors) {
  const awardType = deriveAwardType(entry.awardSet);
  const category = deriveCategory(entry.position, awardType);
  const resultType = deriveResultType(entry);
  for (const game of entry.boardgames) {
    if (!game.bggId) continue;
    const honorObj = {
      name: `${entry.year} ${awardType}${category && category !== awardType ? ' ' + category : ''}`.trim(),
      year: entry.year,
      source: 'scrape',
      category: (resultType || deriveResultFromPosition(entry.position) || 'Special'),
      validated: false,
      award_type: awardType,
      created_at: nowIso,
      description: entry.title || entry.slug || null,
      result: resultType,
      honor_id: entry.id,
      slug: entry.slug
    };
    if (!perGame.has(game.bggId)) perGame.set(game.bggId, []);
    perGame.get(game.bggId).push(honorObj);
  }
}

const createGamesOnly = true;

for (const id of args) {
  const idNum = Number(id);
  const honors = perGame.get(idNum) || [];
  const payload = {
    bgg_id: idNum,
    name: (honors[0] && (honors[0].description || honors[0].name)) || `BGG ${idNum}`,
    honors: createGamesOnly ? [] : honors,
    created_at: nowIso,
    updated_at: nowIso
  };
  console.log(`\n=== BGG ${idNum} ===`);
  console.log('Computed honors count:', honors.length);
  if (honors.length) console.log('First honor:', honors[0]);
  console.log('Insert payload honors:', JSON.stringify(payload.honors, null, 2));
}
