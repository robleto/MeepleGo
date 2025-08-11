import { supabase } from '@/lib/supabase'

export type DefaultLists = { library?: string; wishlist?: string }
export type MembershipSets = { library: Set<string>; wishlist: Set<string> }

// Fetch (and lazily create) default list ids for current user
export async function getOrCreateDefaultLists(): Promise<DefaultLists | null> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null
  const userId = session.user.id
  // Fetch existing
  const { data: existing } = await supabase
    .from('game_lists')
    .select('id,list_type')
    .eq('user_id', userId)
    .in('list_type', ['library','wishlist'])
  const lists: DefaultLists = {}
  existing?.forEach(l => { if (l.list_type === 'library') lists.library = l.id; if (l.list_type === 'wishlist') lists.wishlist = l.id })
  // Ensure both exist
  const missing: { list_type: 'library' | 'wishlist'; name: string; description: string }[] = []
  if (!lists.library) missing.push({ list_type: 'library', name: 'Library', description: 'All games you own or track' })
  if (!lists.wishlist) missing.push({ list_type: 'wishlist', name: 'Wishlist', description: 'Games you want to acquire' })
  if (missing.length) {
    const { data: inserted, error } = await supabase
      .from('game_lists')
      .insert(missing.map(m => ({ user_id: userId, name: m.name, description: m.description, list_type: m.list_type, is_public: false })))
      .select('id,list_type')
    if (!error && inserted) {
      inserted.forEach(l => { if (l.list_type === 'library') lists.library = l.id; if (l.list_type === 'wishlist') lists.wishlist = l.id })
    }
  }
  return lists
}

// Get membership sets (game ids) for defaults
export async function getMembershipSets(): Promise<MembershipSets | null> {
  const lists = await getOrCreateDefaultLists()
  if (!lists) return null
  const library = new Set<string>()
  const wishlist = new Set<string>()
  const listIds: string[] = []
  if (lists.library) listIds.push(lists.library)
  if (lists.wishlist) listIds.push(lists.wishlist)
  if (!listIds.length) return { library, wishlist }
  const { data } = await supabase
    .from('game_list_items')
    .select('list_id, game_id')
    .in('list_id', listIds)
  data?.forEach(row => {
    if (row.list_id === lists.library) library.add(row.game_id)
    if (row.list_id === lists.wishlist) wishlist.add(row.game_id)
  })
  return { library, wishlist }
}

export async function addGameToDefaultList(gameId: string, listType: 'library' | 'wishlist'): Promise<boolean> {
  const lists = await getOrCreateDefaultLists()
  if (!lists || !lists[listType]) return false
  const listId = lists[listType]!
  const { error } = await supabase.from('game_list_items').insert({ list_id: listId, game_id: gameId })
  if (error && error.code !== '23505') { // ignore duplicate
    console.error('addGameToDefaultList error', error)
    return false
  }
  return true
}

export async function removeGameFromDefaultList(gameId: string, listType: 'library' | 'wishlist'): Promise<boolean> {
  const lists = await getOrCreateDefaultLists()
  if (!lists || !lists[listType]) return false
  const listId = lists[listType]!
  const { error } = await supabase
    .from('game_list_items')
    .delete()
    .eq('list_id', listId)
    .eq('game_id', gameId)
  if (error) {
    console.error('removeGameFromDefaultList error', error)
    return false
  }
  return true
}
