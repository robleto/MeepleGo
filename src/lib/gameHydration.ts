import type { SupabaseClient } from '@supabase/supabase-js'

type ListMembership = {
  library: boolean
  wishlist: boolean
}

type MetaById = Map<string, {
  id: string
  min_players: number | null
  max_players: number | null
  playtime_minutes: number | null
  thumbnail_url: string | null
  image_url: string | null
  year_published: number | null
}>

type RankingById = Map<string, {
  game_id: string
  ranking: number | null
  played_it: boolean | null
}>

type ListMembershipById = Map<string, ListMembership>

type HydrationMaps = {
  metaById: MetaById
  rankingById: RankingById
  listMembershipById: ListMembershipById
}

type HydrationItem = {
  id?: string
  game_id?: string
  game_min_players?: number | null
  game_max_players?: number | null
  game_playtime_minutes?: number | null
  game_thumbnail_url?: string | null
  game_image_url?: string | null
  game_year_published?: number | null
  min_players?: number | null
  max_players?: number | null
  playtime_minutes?: number | null
  thumbnail_url?: string | null
  image_url?: string | null
  year_published?: number | null
  ranking?: any
  played_it?: boolean
  list_membership?: ListMembership
  [key: string]: any
}

export type DiscoveryLists<T = HydrationItem> = {
  mostAwarded: T[]
  highestRanked: T[]
  sleeperHits: T[]
  hotTakes: T[]
  comebackGames: T[]
}

function buildListMembershipMap(items: any[]): ListMembershipById {
  const listMembershipById = new Map<string, ListMembership>()

  items.forEach((item: any) => {
    const name = item.game_lists?.name
    const current = listMembershipById.get(item.game_id) || {
      library: false,
      wishlist: false,
    }

    listMembershipById.set(item.game_id, {
      library: current.library || name === 'Library',
      wishlist: current.wishlist || name === 'Wishlist',
    })
  })

  return listMembershipById
}

function applyHydration(items: HydrationItem[], maps: HydrationMaps): HydrationItem[] {
  return items.map((item) => {
    const gameId = item.game_id || item.id
    if (!gameId) return item

    const meta = maps.metaById.get(gameId)
    const ranking = maps.rankingById.get(gameId)
    const listMembership = maps.listMembershipById.get(gameId)

    return {
      ...item,
      game_id: item.game_id || gameId,
      game_min_players:
        item.game_min_players ?? item.min_players ?? meta?.min_players ?? null,
      game_max_players:
        item.game_max_players ?? item.max_players ?? meta?.max_players ?? null,
      game_playtime_minutes:
        item.game_playtime_minutes ??
        item.playtime_minutes ??
        meta?.playtime_minutes ??
        null,
      game_thumbnail_url:
        item.game_thumbnail_url ??
        item.thumbnail_url ??
        meta?.thumbnail_url ??
        meta?.image_url ??
        null,
      game_image_url:
        item.game_image_url ?? item.image_url ?? meta?.image_url ?? null,
      game_year_published:
        item.game_year_published ?? item.year_published ?? meta?.year_published ?? null,
      ranking:
        item.ranking ??
        (ranking
          ? {
              ranking: ranking.ranking,
              played_it: ranking.played_it ?? false,
            }
          : null),
      played_it: item.played_it ?? ranking?.played_it ?? false,
      list_membership:
        item.list_membership ??
        listMembership ??
        {
          library: false,
          wishlist: false,
        },
    }
  })
}

async function fetchHydrationMaps(
  supabase: SupabaseClient,
  userId: string,
  gameIds: string[]
): Promise<HydrationMaps> {
  const [metaResponse, rankingsResponse, listItemsResponse] = await Promise.all([
    supabase
      .from('games')
      .select(
        'id,min_players,max_players,playtime_minutes,thumbnail_url,image_url,year_published'
      )
      .in('id', gameIds),
    supabase
      .from('rankings')
      .select('game_id,ranking,played_it')
      .eq('user_id', userId)
      .in('game_id', gameIds),
    supabase
      .from('game_list_items')
      .select('game_id, game_lists!inner(name, user_id)')
      .eq('game_lists.user_id', userId)
      .in('game_id', gameIds),
  ])

  const metaById = new Map(
    (metaResponse.data || []).map((meta: any) => [meta.id, meta])
  )
  const rankingById = new Map(
    (rankingsResponse.data || []).map((r: any) => [r.game_id, r])
  )
  const listMembershipById = buildListMembershipMap(
    listItemsResponse.data || []
  )

  return { metaById, rankingById, listMembershipById }
}

export async function hydrateItemsWithUserMeta(
  supabase: SupabaseClient,
  userId: string,
  items: HydrationItem[]
): Promise<HydrationItem[]> {
  const gameIds = Array.from(
    new Set(items.map((item) => item.game_id || item.id).filter(Boolean))
  ) as string[]

  if (gameIds.length === 0) return items

  const maps = await fetchHydrationMaps(supabase, userId, gameIds)
  return applyHydration(items, maps)
}

export async function hydrateDiscoveryListsWithUserMeta(
  supabase: SupabaseClient,
  userId: string,
  lists: DiscoveryLists
): Promise<DiscoveryLists> {
  const allGameIds = new Set<string>()

  Object.values(lists).forEach((list) => {
    list.forEach((item) => {
      const gameId = item.game_id || item.id
      if (gameId) allGameIds.add(gameId)
    })
  })

  if (allGameIds.size === 0) return lists

  const maps = await fetchHydrationMaps(
    supabase,
    userId,
    Array.from(allGameIds)
  )

  return {
    mostAwarded: applyHydration(lists.mostAwarded, maps),
    highestRanked: applyHydration(lists.highestRanked, maps),
    sleeperHits: applyHydration(lists.sleeperHits, maps),
    hotTakes: applyHydration(lists.hotTakes, maps),
    comebackGames: applyHydration(lists.comebackGames, maps),
  }
}
