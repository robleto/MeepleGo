const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Canonical 2024 Spiel & Kennerspiel data (expandable if editions change)
const SPIEL_2024 = {
  award_type: 'Spiel des Jahres',
  year: 2024,
  winner: { name: 'Sky Team', bgg_id: 379043 },
  nominees: [
    { name: 'Captain Flip', bgg_id: 398883 },
    { name: 'In the Footsteps of Darwin', bgg_id: 341169 }
  ],
  recommended: [
    { name: 'Die 7 Bazis', bgg_id: 410565 },
    { name: 'Agent Avenue', bgg_id: 411994 },
    { name: 'Castle Combo', bgg_id: 373106 },
    { name: 'Cities', bgg_id: 412293 },
    { name: 'Foxy', bgg_id: 394453 },
    { name: 'Perfect Words', bgg_id: 407863 },
    { name: 'The Animals of Baker Street', bgg_id: 377370 }
  ]
};

const KENNER_2024 = {
  award_type: 'Kennerspiel des Jahres',
  year: 2024,
  winner: { name: 'Daybreak', bgg_id: 397908 },
  nominees: [
    { name: 'Ticket to Ride Legacy: Legends of the West', bgg_id: 338834 },
    { name: 'The Guild of Merchant Explorers', bgg_id: 382954 }
  ]
};

// Lightweight BGG XML fetch (enough to populate required columns)
async function fetchGame(bggId) {
  try {
    const res = await fetch(`https://boardgamegeek.com/xmlapi2/thing?id=${bggId}&stats=1`);
    if (!res.ok) { console.error('BGG fetch http error', bggId, res.status); return null; }
    const xml = await res.text();
    const get = (regex) => { const m = xml.match(regex); return m ? m[1] : null; };
    const decode = (s) => s?.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#10;/g,' ').replace(/&#13;/g,' ').replace(/&apos;/g,"'") || null;
    const collect = (type) => {
      const r = new RegExp(`<link[^>]*type="${type}"[^>]*value="([^"]+)"[^>]*>`, 'g');
      const out = new Set(); let m; while ((m = r.exec(xml)) !== null) out.add(decode(m[1])); return Array.from(out);
    };
    const description = decode(get(/<description>([\s\S]*?)<\/description>/));
    const firstSentence = description ? description.split(/\.(\s|$)/)[0].trim().slice(0,400) : null;
    return {
      bgg_id: bggId,
      name: decode(get(/<name[^>]*type="primary"[^>]*value="([^"]+)"/)) || `Game ${bggId}`,
      year_published: parseInt(get(/<yearpublished[^>]*value="([0-9]+)"/)) || null,
      image_url: get(/<image>([^<]*)<\/image>/),
      thumbnail_url: get(/<thumbnail>([^<]*)<\/thumbnail>/),
      description,
      summary: firstSentence,
      categories: collect('boardgamecategory') || null,
      mechanics: collect('boardgamemechanic') || null,
      families: collect('boardgamefamily') || null,
      designers: collect('boardgamedesigner') || null,
      artists: collect('boardgameartist') || null,
      publisher: (collect('boardgamepublisher')[0]) || null,
      min_players: parseInt(get(/<minplayers[^>]*value="([0-9]+)"/)) || null,
      max_players: parseInt(get(/<maxplayers[^>]*value="([0-9]+)"/)) || null,
      playtime_minutes: parseInt(get(/<playingtime[^>]*value="([0-9]+)"/)) || null,
      age: parseInt(get(/<minage[^>]*value="([0-9]+)"/)) || null,
      weight: parseFloat(get(/<averageweight[^>]*value="([0-9.]+)"/)) || null,
      rating: parseFloat(get(/<average[^>]*value="([0-9.]+)"/)) || null,
      num_ratings: parseInt(get(/<usersrated[^>]*value="([0-9]+)"/)) || null,
      cached_at: new Date().toISOString(),
      is_active: true
    };
  } catch (e) {
    console.error('BGG fetch failed', bggId, e.message);
    return null;
  }
}

function buildHonor(award_type, year, category) {
  return {
    name: `${year} ${award_type} ${category}`,
    year,
    category,
    award_type,
    description: `${category} for the ${year} ${award_type}`
  };
}

const detectedColumnsPromise = (async () => {
  try {
    const { data, error } = await supabase.from('games').select('*').limit(1);
    if (error) return null;
    if (data && data.length) return new Set(Object.keys(data[0]));
    // If no rows, attempt to infer by querying information_schema via RPC not available; fallback minimal set
    return new Set(['bgg_id','name','year_published','image_url','thumbnail_url','min_players','max_players','playtime_minutes','publisher','description','summary','rank','rating','num_ratings','cached_at','honors','weight','age']);
  } catch { return null; }
})();

function sanitizeInsertPayload(payload, columnSet) {
  if (!columnSet) return payload; // fallback
  const out = {}; Object.entries(payload).forEach(([k,v]) => { if (columnSet.has(k)) out[k]=v; });
  return out;
}

async function ensureGame(bgg_id) {
  const { data: existing, error } = await supabase
    .from('games')
    .select('*')
    .eq('bgg_id', bgg_id)
    .single();
  if (existing) return existing;
  if (error && error.code !== 'PGRST116') {
    console.error('Error querying game', bgg_id, error.message); return null;
  }
  const full = await fetchGame(bgg_id);
  if (!full) { console.error('Skipping insertion; fetch failed', bgg_id); return null; }
  const columnSet = await detectedColumnsPromise;
  let insertPayload = sanitizeInsertPayload({ ...full, honors: [] }, columnSet);
  let { data: inserted, error: insertErr } = await supabase
    .from('games')
    .insert([insertPayload])
    .select('*')
    .single();
  if (insertErr) {
    console.warn('Initial insert failed, attempting progressive field stripping:', insertErr.message);
    const priorityFields = ['bgg_id','name'];
    // Keep mandatory, drop others until success or minimal
    const keys = Object.keys(insertPayload).filter(k => !priorityFields.includes(k));
    for (const k of keys) {
      delete insertPayload[k];
      const retry = await supabase.from('games').insert([insertPayload]).select('*').single();
      if (!retry.error) { inserted = retry.data; insertErr = null; break; }
    }
    if (insertErr) { console.error('Final insert failure for', bgg_id, insertErr.message); return null; }
  }
  console.log('Inserted new game', insertPayload.name || full.name);
  return inserted;
}

async function removeIncorrect2024Honors() {
  const { data: games, error } = await supabase
    .from('games')
    .select('id,bgg_id,name,honors');
  if (error) throw error;
  const targetAwards = new Set(['Spiel des Jahres','Kennerspiel des Jahres']);
  const updates = [];
  for (const g of games) {
    const honors = Array.isArray(g.honors) ? g.honors : [];
    const filtered = honors.filter(h => !(h && h.year === 2024 && targetAwards.has(h.award_type)));
    if (filtered.length !== honors.length) {
      updates.push({ id: g.id, honors: filtered });
    }
  }
  for (const u of updates) {
    const { error: upErr } = await supabase.from('games').update({ honors: u.honors }).eq('id', u.id);
    if (upErr) console.error('Failed clearing honors for', u.id, upErr.message);
  }
  console.log(`Cleared 2024 honors from ${updates.length} game rows.`);
}

async function apply2024() {
  console.log('Starting deterministic 2024 honors fix...');
  await removeIncorrect2024Honors();

  const queue = [];
  queue.push({ ...SPIEL_2024.winner, award_type: SPIEL_2024.award_type, year: SPIEL_2024.year, category: 'Winner' });
  SPIEL_2024.nominees.forEach(n => queue.push({ ...n, award_type: SPIEL_2024.award_type, year: SPIEL_2024.year, category: 'Nominee' }));
  SPIEL_2024.recommended.forEach(r => queue.push({ ...r, award_type: SPIEL_2024.award_type, year: SPIEL_2024.year, category: 'Special' }));
  queue.push({ ...KENNER_2024.winner, award_type: KENNER_2024.award_type, year: KENNER_2024.year, category: 'Winner' });
  KENNER_2024.nominees.forEach(n => queue.push({ ...n, award_type: KENNER_2024.award_type, year: KENNER_2024.year, category: 'Nominee' }));

  let applied = 0;
  for (const entry of queue) {
    const game = await ensureGame(entry.bgg_id);
    if (!game) continue;
    const honors = Array.isArray(game.honors) ? game.honors : [];
    const exists = honors.some(h => h && h.year === entry.year && h.award_type === entry.award_type && h.category === entry.category);
    if (!exists) {
      honors.push(buildHonor(entry.award_type, entry.year, entry.category));
      const { error: upErr } = await supabase
        .from('games')
        .update({ honors })
        .eq('bgg_id', entry.bgg_id);
      if (upErr) {
        console.error('Failed updating honors for', entry.bgg_id, upErr.message);
      } else {
        applied++;
        console.log(`Applied ${entry.year} ${entry.award_type} ${entry.category} to ${game.name}`);
      }
      await new Promise(r => setTimeout(r, 120));
    } else {
      console.log('Already has honor, skipping', game.name, entry.category);
    }
  }
  console.log(`\nApplied/updated ${applied} honors.`);
}

if (require.main === module) {
  apply2024()
    .then(()=>{ console.log('\n2024 honors fix complete.'); process.exit(0); })
    .catch(e=>{ console.error('Failure', e); process.exit(1); });
}

module.exports = { apply2024 };
