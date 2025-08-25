const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

function buildAuthHeaders() {
  const headers = {
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'accept-language': 'en-US,en;q=0.9',
    'user-agent': process.env.BGG_USER_AGENT || 'Mozilla/5.0 (MeepleGo Awards)' ,
  };
  if (process.env.BGG_COOKIES) headers['cookie'] = process.env.BGG_COOKIES;
  return headers;
}

async function fetchHonorBrowsePage(page) {
  const url = `https://boardgamegeek.com/browse/boardgamehonor/page/${page}`;
  const res = await fetch(url, { headers: buildAuthHeaders() });
  if (!res.ok) throw new Error(`Browse page ${page} status ${res.status}`);
  return res.text();
}

function extractHonorLinks(html) {
  const honors = [];
  const regex = /\/boardgamehonor\/(\d+)\/([0-9a-zA-Z-]+)/g; let m;
  while ((m = regex.exec(html)) !== null) honors.push({ id: parseInt(m[1]), slug: m[2] });
  return honors;
}

function extractGameIdsFromHonor(html, opts = {}) {
  const out = new Set();
  // Pattern 1: standard links /boardgame/12345/
  let regexes = [
    /href="\/boardgame\/(\d+)(?:[\/"?])/g, // common href format
    /\/boardgame\/(\d+)\//g,                 // legacy simple
    /data-objectid="(\d+)"/g,                // data attribute
  ];
  for (const r of regexes) {
    let m; while ((m = r.exec(html)) !== null) out.add(parseInt(m[1]));
  }
  if (opts.debug && out.size === 0) {
    console.log('[debug] No game IDs extracted; first 400 chars of honor HTML:');
    console.log(html.slice(0,400).replace(/\n/g,' '));
  }
  return Array.from(out);
}

async function searchGameByName(name) {
  // Basic search using BGG XML API2
  try {
    const res = await fetch(`https://boardgamegeek.com/xmlapi2/search?query=${encodeURIComponent(name)}&type=boardgame`);
    if (!res.ok) return null;
    const xml = await res.text();
    const regex = /<item type="boardgame" id="(\d+)">[\s\S]*?<name type="primary" value="([^"]+)"/g;
    let best = null; let m;
    while ((m = regex.exec(xml)) !== null) {
      const id = parseInt(m[1]); const foundName = m[2];
      if (foundName.toLowerCase() === name.toLowerCase()) { best = id; break; }
      if (!best) best = id; // fallback first
    }
    return best;
  } catch (e) {
    console.error('Search error for', name, e.message);
    return null;
  }
}

async function fetchHonorPage(id, slug) {
  const url = `https://boardgamegeek.com/boardgamehonor/${id}/${slug}`;
  const res = await fetch(url, { headers: buildAuthHeaders() });
  if (!res.ok) throw new Error(`Honor page ${id} status ${res.status}`);
  return res.text();
}

async function fetchGame(bggId) {
  const res = await fetch(`https://boardgamegeek.com/xmlapi2/thing?id=${bggId}&stats=1`);
  if (!res.ok) return null;
  const xml = await res.text();
  const get = (r) => { const m = xml.match(r); return m?m[1]:null; };
  const decode = s => s?.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#10;/g,' ').replace(/&#13;/g,' ').replace(/&apos;/g,"'")||null;
  const collect = type => { const r=new RegExp(`<link[^>]*type="${type}"[^>]*value="([^"]+)"[^>]*>`,'g');const set=new Set();let m;while((m=r.exec(xml))!==null) set.add(decode(m[1]));return Array.from(set); };
  const description = decode(get(/<description>([\s\S]*?)<\/description>/));
  const firstSentence = description?description.split(/\.(\s|$)/)[0].trim().slice(0,400):null;
  return {
    bgg_id: bggId,
    name: decode(get(/<name[^>]*type="primary"[^>]*value="([^"]+)"/))||`Game ${bggId}`,
    year_published: parseInt(get(/<yearpublished[^>]*value="([0-9]+)"/))||null,
    image_url: get(/<image>([^<]*)<\/image>/),
    thumbnail_url: get(/<thumbnail>([^<]*)<\/thumbnail>/),
    description,
    summary: firstSentence,
    categories: collect('boardgamecategory')||null,
    mechanics: collect('boardgamemechanic')||null,
    families: collect('boardgamefamily')||null,
    designers: collect('boardgamedesigner')||null,
    artists: collect('boardgameartist')||null,
    publisher: (collect('boardgamepublisher')[0])||null,
    min_players: parseInt(get(/<minplayers[^>]*value="([0-9]+)"/))||null,
    max_players: parseInt(get(/<maxplayers[^>]*value="([0-9]+)"/))||null,
    playtime_minutes: parseInt(get(/<playingtime[^>]*value="([0-9]+)"/))||null,
    age: parseInt(get(/<minage[^>]*value="([0-9]+)"/))||null,
    weight: parseFloat(get(/<averageweight[^>]*value="([0-9.]+)"/))||null,
    rating: parseFloat(get(/<average[^>]*value="([0-9.]+)"/))||null,
    num_ratings: parseInt(get(/<usersrated[^>]*value="([0-9]+)"/))||null,
    rank: parseInt(get(/<rank[^>]*type="subtype"[^>]*id="1"[^>]*value="([0-9]+)"/))||null,
    cached_at: new Date().toISOString(),
    is_active: true
  };
}

async function ensureGame(bgg_id) {
  const { data: existing, error } = await supabase.from('games').select('*,honors').eq('bgg_id', bgg_id).single();
  if (existing) return existing;
  if (error && error.code !== 'PGRST116') { console.error('Query error', error.message); return null; }
  const full = await fetchGame(bgg_id);
  if (!full) return null;
  const { error: insErr } = await supabase.from('games').insert([{ ...full, honors: [] }]);
  if (insErr) {
    // degrade to minimal fields
    const minimal = { bgg_id, name: full.name, honors: [] };
    const { error: ins2 } = await supabase.from('games').insert([minimal]);
    if (ins2) { console.error('Insert failed for', bgg_id, ins2.message); return null; }
    return minimal;
  }
  return full;
}

module.exports = { fetchHonorBrowsePage, extractHonorLinks, fetchHonorPage, extractGameIdsFromHonor, ensureGame, supabase, searchGameByName, buildAuthHeaders };
