'use client'

import { useEffect, useState, useMemo } from 'react'
import ListExplorer from '@/components/Components/ListExplorer'
import { useParams, useRouter } from 'next/navigation'
import PageLayout from '@/components/Components/PageLayout'
import Heading from '@/components/Components/Heading'
import supabase from '@/lib/supabase'
import { GameListWithItems } from '@/types/supabase'
import SearchDropdown from '@/components/Elements/SearchDropdown'
import Portal from '@/components/Elements/Portal'
import { XMarkIcon } from '@heroicons/react/24/outline'
import SaveProgressModal from '@/components/Components/SaveProgressModal'
import { getGuestActivityCount, getOnboardingState, saveOnboardingState } from '@/lib/guestSession'
import GameOnboardingModal from '@/components/Components/GameOnboardingModal'
import type { SuggestionGame } from '@/components/Components/GameSearchSelect'

interface GameListItemWithGame {
  id: string
  game_id: string
  ranking?: number | null
  created_at: string
  game: any
}

const bggDefaultDescriptions: Record<string, string> = {
  bgg_bestsellers: 'Top-selling games on BoardGameGeek right now.',
  bgg_hotness: 'What’s heating up on BoardGameGeek today.',
  bgg_trendingplays: 'Games getting the most plays lately on BGG.',
  bgg_mostplayed: 'All-time most played games on BoardGameGeek.',
}

export default function ListDetailPage() {
  const params = useParams()
  const router = useRouter()
  // Support friendly slug format: name-slugified-<id>
  const rawParam =
    typeof params?.id === 'string'
      ? params.id
      : Array.isArray(params?.id)
        ? params.id[0]
        : null
  const listId = rawParam
    ? rawParam.match(/([a-f0-9-]{36})$/)
      ? rawParam.match(/([a-f0-9-]{36})$/)![1]
      : rawParam
    : null
  // If we have a UUID without trailing slug part, once list loads we'll push friendly slug
  const needsSlug = rawParam === listId

  const [list, setList] = useState<GameListWithItems | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [userEnrichment, setUserEnrichment] = useState<{
    rankings: Record<string, { ranking: number | null; played_it: boolean }>
    membership: Record<string, { library: boolean; wishlist: boolean }>
  }>({ rankings: {}, membership: {} })
  const [enriching, setEnriching] = useState(false)
  const [sessionUserId, setSessionUserId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedGameForAdd, setSelectedGameForAdd] = useState<{ id: string; name: string } | null>(null)
  const [editing, setEditing] = useState(false)
  const [customOrderDefault, setCustomOrderDefault] = useState<boolean>(false)
  const [customOrder, setCustomOrder] = useState<boolean>(false)
  const [savingOrder, setSavingOrder] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [lastOrderSnapshot, setLastOrderSnapshot] = useState<string[] | null>(null)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [guestDismissCount, setGuestDismissCount] = useState(0)
  const [guestActionsSincePrompt, setGuestActionsSincePrompt] = useState(0)
  const [selectedGameForGuest, setSelectedGameForGuest] = useState<SuggestionGame | null>(null)
  const [showGameModal, setShowGameModal] = useState(false)
  const isBgg = list?.list_type?.startsWith('bgg_') ?? false

  useEffect(() => {
    if (!listId) return
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setNotFound(false)
      const { data, error } = await supabase
        .from('game_lists')
        .select(`*, game_list_items(*, game:games(*))`)
        .eq('id', listId)
        .maybeSingle()
      if (!cancelled) {
        if (error) {
          console.error('List fetch error', error)
          if (
            error.code === 'PGRST116' ||
            error.details?.includes('Results contain 0 rows')
          )
            setNotFound(true)
        } else if (!data) {
          setNotFound(true)
        } else {
          setList(data as any)
          const dbCustom = !!(data as any).custom_order_enabled
          setCustomOrderDefault(dbCustom)
          setCustomOrder(dbCustom)
          if (needsSlug) {
            // Construct slug (basic)
            const slug = (data.name || 'list')
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-+|-+$/g, '')
              .slice(0, 60)
            router.replace(`/lists/${slug}-${data.id}`)
          }
        }
        setLoading(false)
      }
    }
    ;(async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!cancelled) setSessionUserId(session?.user.id ?? null)
      await load()
    })()
    return () => {
      cancelled = true
    }
  }, [listId])


  const sortedItems: GameListItemWithGame[] = useMemo(() => {
    if (!list?.game_list_items) return []
    const items = [...list.game_list_items] as GameListItemWithGame[]
    // Sort by explicit ranking if present, else fallback created_at
    items.sort((a, b) => {
      const ar = a.ranking ?? Number.MAX_SAFE_INTEGER
      const br = b.ranking ?? Number.MAX_SAFE_INTEGER
      if (ar !== br) return ar - br
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    })
    return items
  }, [list])

  // Enrich with current user ranking + played + library/wishlist
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!sortedItems.length) return
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        if (!cancelled) setUserEnrichment({ rankings: {}, membership: {} })
        return
      }
      setEnriching(true)
      try {
        const gameIds = sortedItems.map((i) => i.game_id)
        // Fetch rankings
        const { data: rankRows } = await supabase
          .from('rankings')
          .select('game_id, ranking, played_it')
          .eq('user_id', session.user.id)
          .in('game_id', gameIds)
        const rankings: Record<
          string,
          { ranking: number | null; played_it: boolean }
        > = {}
        rankRows?.forEach((r) => {
          rankings[r.game_id] = { ranking: r.ranking, played_it: !!r.played_it }
        })
        // Fetch membership for library + wishlist
        const { data: memRows } = await supabase
          .from('game_list_items')
          .select('game_id, list:game_lists(list_type)')
          .eq('list.user_id', session.user.id)
          .in('game_id', gameIds)
          .in('list.list_type', ['library', 'wishlist'])
        const membership: Record<
          string,
          { library: boolean; wishlist: boolean }
        > = {}
        memRows?.forEach((row: any) => {
          if (!membership[row.game_id])
            membership[row.game_id] = { library: false, wishlist: false }
          if (row.list?.list_type === 'library')
            membership[row.game_id].library = true
          if (row.list?.list_type === 'wishlist')
            membership[row.game_id].wishlist = true
        })
        if (!cancelled) setUserEnrichment({ rankings, membership })
      } finally {
        if (!cancelled) setEnriching(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [sortedItems])

  // Auto-dismiss toast — keep hooks above any early returns to preserve hook order
  useEffect(() => {
    if (!toast) return
    const id = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(id)
  }, [toast])

  // Prevent body scroll when add modal is open
  useEffect(() => {
    if (!showAddModal) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [showAddModal])

  // If needed, we could keep localStorage as a fallback, but DB is now source of truth.

  if (!listId) {
    return (
      <PageLayout>
        <div className="py-16 text-center text-gray-500">
          Invalid list id.
        </div>
      </PageLayout>
    )
  }

  if (loading) {
    return (
      <PageLayout>
        <div className="py-16 text-center text-gray-500">
          Loading list…
        </div>
      </PageLayout>
    )
  }

  if (notFound || !list) {
    return (
      <PageLayout>
        <div className="py-16 text-center">
          <Heading as="h1" size="lg" className="mb-4">
            List Not Found
          </Heading>
          <p className="text-gray-600 mb-6">
            The list you are looking for doesn&apos;t exist or you don&apos;t
            have access.
          </p>
          <button
            onClick={() => router.push('/lists')}
            className="px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700 transition-colors"
          >
            Back to Lists
          </button>
        </div>
      </PageLayout>
    )
  }

  // Map sorted list items to GameWithRanking-like objects for explorer
  const explorerGames = sortedItems.map((item) => {
    const base = { ...item.game } as any
    const userRank = userEnrichment.rankings[item.game_id]
    if (userRank) {
      base.ranking = {
        ranking: userRank.ranking,
        played_it: userRank.played_it,
      }
    }
    const mem = userEnrichment.membership[item.game_id]
    if (mem) {
      base.list_membership = mem
    }
    base.__listRanking = item.ranking ?? null
    return base
  })

  const canEdit = !!(list && sessionUserId && list.user_id === sessionUserId)

  async function handleAddGameToList(game: { id: string; name: string }) {
    if (!list || !canEdit) return
    setAdding(true)
    setAddError(null)
    try {
      // Determine ranking to append to end of list (max+1)
      const nextRank = (() => {
        const ranks = (list.game_list_items || [])
          .map((i: any) => i.ranking)
          .filter((r: any) => typeof r === 'number') as number[]
        return ranks.length ? Math.max(...ranks) + 1 : (list.game_list_items?.length || 0) + 1
      })()
      const { data: inserted, error } = await supabase
        .from('game_list_items')
        .insert({ list_id: list.id, game_id: game.id, ranking: nextRank })
        .select('*, game:games(*)')
        .single()
      if (error) {
        // Ignore duplicate entries gracefully
        if ((error as any).code === '23505') {
          setToast({ type: 'success', message: `${game.name} is already in this list` })
          return
        }
        console.error('Add game error', error)
        setAddError('Could not add game to list')
        setToast({ type: 'error', message: 'Could not add game to list' })
        return
      }
      if (inserted) {
        setList((prev) =>
          prev
            ? {
                ...prev,
                game_list_items: [
                  ...(prev.game_list_items || []),
                  inserted as any,
                ],
              }
            : prev
        )
        setToast({ type: 'success', message: `Added ${game.name}` })
      }
    } finally {
      setAdding(false)
    }
  }

  // Move item up/down by swapping rankings
  async function moveItem(itemId: string, direction: 'up' | 'down') {
    if (!list || !canEdit) return
    const items = [...(list.game_list_items || [])] as GameListItemWithGame[]
    const index = items.findIndex((i) => i.id === itemId)
    if (index === -1) return
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= items.length) return
    const a = items[index]
    const b = items[swapIndex]
    const aRank = a.ranking ?? index + 1
    const bRank = b.ranking ?? swapIndex + 1
    // Optimistic update
    const updated = items.map((it) =>
      it.id === a.id ? { ...it, ranking: bRank } : it.id === b.id ? { ...it, ranking: aRank } : it
    )
    setList((prev) => (prev ? { ...prev, game_list_items: updated as any } : prev))
    // Persist both swaps
    try {
      const { error } = await supabase.rpc('swap_list_item_ranks', {
        p_list_id: list.id,
        p_item_id_a: a.id,
        p_rank_a: bRank,
        p_item_id_b: b.id,
        p_rank_b: aRank,
      })
      if (error) throw error
    } catch (err) {
      // fallback: update individually
      await supabase
        .from('game_list_items')
        .update({ ranking: bRank })
        .eq('id', a.id)
      await supabase
        .from('game_list_items')
        .update({ ranking: aRank })
        .eq('id', b.id)
    }
  }

  // Delete item from list
  async function deleteItem(itemId: string) {
    if (!list || !canEdit) return
    const item = (list.game_list_items as any)?.find((i: any) => i.id === itemId)
    setList((prev) =>
      prev
        ? {
            ...prev,
            game_list_items: (prev.game_list_items || []).filter((i: any) => i.id !== itemId),
          }
        : prev
    )
    const { error } = await supabase.from('game_list_items').delete().eq('id', itemId)
    if (error) {
      // revert on failure
      setList((prev) =>
        prev
          ? { ...prev, game_list_items: [...(prev.game_list_items || []), item] as any }
          : prev
      )
      setToast({ type: 'error', message: 'Failed to remove from list' })
    } else {
      setToast({ type: 'success', message: 'Removed from list' })
    }
  }

  const handleRankingUpdate = async (
    gameId: string,
    patch: { ranking?: number | null; played_it?: boolean }
  ) => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) return
    // optimistic enrichment update
    setUserEnrichment((prev) => {
      const existing = prev.rankings[gameId] || {
        ranking: null,
        played_it: false,
      }
      return {
        ...prev,
        rankings: {
          ...prev.rankings,
          [gameId]: {
            ranking:
              patch.ranking === undefined ? existing.ranking : patch.ranking,
            played_it:
              patch.played_it === undefined
                ? existing.played_it
                : !!patch.played_it,
          },
        },
      }
    })
    const { error } = await supabase.from('rankings').upsert(
      {
        user_id: session.user.id,
        game_id: gameId,
        ranking:
          patch.ranking === undefined
            ? (userEnrichment.rankings[gameId]?.ranking ?? null)
            : patch.ranking,
        played_it:
          patch.played_it === undefined
            ? (userEnrichment.rankings[gameId]?.played_it ?? false)
            : patch.played_it,
      },
      { onConflict: 'user_id,game_id' }
    )
    if (error) {
      console.error('Ranking update error', error.message)
      // refetch enrichment on failure
      setTimeout(() => {
        setUserEnrichment((prev) => prev) // trigger no-op
      }, 0)
    }
  }

  const handleMembershipChange = (
    gameId: string,
    change: { library?: boolean; wishlist?: boolean }
  ) => {
    // If user is not logged in, open game detail modal instead
    if (!sessionUserId) {
      // Find the game from the list
      const game = explorerGames.find((g: any) => g.id === gameId)
      if (game) {
        setSelectedGameForGuest({
          id: game.id,
          name: game.name,
          yearPublished: game.year_published,
          imageUrl: game.image_url,
        })
        setShowGameModal(true)
      }
      return
    }

    // Optimistic update for authenticated users
    setUserEnrichment((prev) => {
      const existing = prev.membership[gameId] || { library: false, wishlist: false }
      return {
        ...prev,
        membership: {
          ...prev.membership,
          [gameId]: {
            library: change.library !== undefined ? change.library : existing.library,
            wishlist: change.wishlist !== undefined ? change.wishlist : existing.wishlist,
          },
        },
      }
    })
  }

  const handleGameModalComplete = () => {
    setShowGameModal(false)
    // After guest interacts with game, increment action count
    setGuestActionsSincePrompt((prev) => prev + 1)
    
    const newActionCount = guestActionsSincePrompt + 1
    
    // Check threshold to show save modal
    let threshold = 3
    if (guestDismissCount === 1) threshold = 5
    else if (guestDismissCount === 2) threshold = 3
    else if (guestDismissCount >= 3) threshold = 2
    
    if (newActionCount >= threshold) {
      setShowSaveModal(true)
      setGuestActionsSincePrompt(0)
    }
  }

  const header = (
    <div>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <Heading
          as="h2"
          size="lg"
          weightScale
          className="heading-display mb-2 flex items-center"
        >
          {list.name}
        </Heading>
        {!isBgg && canEdit && (
          <div className="ml-auto pt-1">
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full btn-brand text-sm font-medium"
            >
              Add New
            </button>
            <button
              onClick={() => setEditing((e) => !e)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-full border ml-2 text-sm font-medium bg-white hover:bg-gray-50 border-gray-200"
            >
              {editing ? 'Done' : 'Edit'}
            </button>
          </div>
        )}
      </div>
      {(list.description ||
        (isBgg && bggDefaultDescriptions[list.list_type as string])) && (
        <p className="text-gray-700 text-sm max-w-3xl">
          {list.description || bggDefaultDescriptions[list.list_type as string]}
          <br />
          {(list.updated_at || list.created_at) && (
            <span className="text-gray-400" suppressHydrationWarning>
              Updated{' '}
              {new Date(
                (list.updated_at || list.created_at) as string
              ).toLocaleDateString(undefined, {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          )}
        </p>
      )}
      {/* Custom Order toggle under the Updated date, shown only in Edit mode */}
      {editing && !isBgg && canEdit && (
        <div className="mt-3 text-xs text-gray-600">
          <div className="inline-flex items-center gap-3 select-none">
            <label className="inline-flex items-center gap-2 select-none">
              <span>Custom Order</span>
              <button
                type="button"
                onClick={async () => {
                  if (!list) return
                  const next = !customOrder
                  setCustomOrder(next)
                  setCustomOrderDefault(next)
                  // optimistic
                  setSavingOrder('saving')
                  const { error } = await supabase
                    .from('game_lists')
                    .update({ custom_order_enabled: next })
                    .eq('id', list.id)
                  if (error) {
                    setCustomOrder(!next)
                    setCustomOrderDefault(!next)
                  }
                  setSavingOrder('saved')
                  setTimeout(() => setSavingOrder('idle'), 1200)
                }}
                className={`relative inline-flex items-center h-5 w-9 rounded-full border transition-colors ${customOrder ? 'bg-sky-600 border-sky-600' : 'bg-gray-200 border-gray-300'}`}
                aria-pressed={customOrder}
                aria-label="Toggle custom order"
              >
                <span
                  className={`inline-block h-4 w-4 bg-white rounded-full shadow transform transition-transform ${customOrder ? 'translate-x-4' : 'translate-x-0.5'}`}
                />
              </button>
            </label>
            {savingOrder !== 'idle' && (
              <span className="text-xs text-gray-500">
                {savingOrder === 'saving' ? 'Saving…' : 'Saved'}
              </span>
            )}
            {customOrder && (
              <button
                className="text-xs text-gray-600 hover:text-gray-900 underline"
                onClick={async () => {
                  if (!list) return
                  const snapshot = list.game_list_items
                  // optimistic clear
                  setList({ ...list, game_list_items: (list.game_list_items || []).map((it: any) => ({ ...it, ranking: null })) } as any)
                  setSavingOrder('saving')
                  const res = await fetch(`/api/lists/${list.id}/reorder`, { method: 'PUT' })
                  if (!res.ok) {
                    setList((prev) => (prev ? { ...prev, game_list_items: snapshot } as any : prev))
                  }
                  setSavingOrder('saved')
                  setTimeout(() => setSavingOrder('idle'), 1200)
                }}
              >
                Reset to default
              </button>
            )}
            {customOrder && lastOrderSnapshot && (
              <button
                className="text-xs text-gray-600 hover:text-gray-900 underline"
                onClick={async () => {
                  if (!list || !lastOrderSnapshot) return
                  const byGameId = new Map((list.game_list_items || []).map((it: any) => [it.game_id, it]))
                  const orderedItemIds = lastOrderSnapshot
                    .map((gid) => byGameId.get(gid)?.id)
                    .filter(Boolean)
                  // optimistic revert display
                  const newItems: any[] = lastOrderSnapshot
                    .map((gid, idx) => {
                      const it = byGameId.get(gid)
                      return it ? { ...it, ranking: idx + 1 } : null
                    })
                    .filter(Boolean)
                  setList((prev) => (prev ? { ...prev, game_list_items: newItems as any } : prev))
                  setSavingOrder('saving')
                  await fetch(`/api/lists/${list.id}/reorder`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ itemIds: orderedItemIds }),
                  })
                  setLastOrderSnapshot(null)
                  setSavingOrder('saved')
                  setTimeout(() => setSavingOrder('idle'), 1200)
                }}
              >
                Undo last reorder
              </button>
            )}
          </div>
        </div>
      )}
      {!isBgg && canEdit && addError && (
        <div className="mt-2 text-xs text-red-600">{addError}</div>
      )}
    </div>
  )
  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto">
        {toast && (
          <div className="toast-stack">
            <div className={`toast toast-enter ${toast.type === 'success' ? 'toast-success' : ''}`}>
              <div className="text-xs">{toast.message}</div>
            </div>
          </div>
        )}
        {/** Determine effective custom order (default outside edit; toggle inside edit) */}
        {/** showListRanking and hasExplicitOrder use effective flag; DnD only when editing && customOrder */}
        <ListExplorer
          games={explorerGames as any}
          header={header}
          emptyMessage={{ title: 'No games in this list yet.' }}
          showListRanking={editing ? customOrder : customOrderDefault}
          hasExplicitOrder={editing ? customOrder : customOrderDefault}
          onRankingUpdate={handleRankingUpdate}
          onMembershipChange={handleMembershipChange}
          defaultViewMode="list"
          storageKeyPrefix={list?.id ? `list-${list.id}` : 'list-detail'}
          getListItemControls={
            canEdit && editing && customOrder && !isBgg
              ? (game) => {
                  const item = (sortedItems as any[]).find((i) => i.game_id === game.id)
                  if (!item) return {}
                  return {
                    onRemove: () => deleteItem(item.id),
                  }
                }
              : undefined
          }
          onReorder={
            canEdit && editing && customOrder && !isBgg
              ? async (ids: string[]) => {
                  if (!list) return
                  // snapshot previous order for potential undo
                  if (!lastOrderSnapshot) {
                    setLastOrderSnapshot(sortedItems.map((it) => it.game_id))
                  }
                  // ids are ordered game IDs; map to item IDs
                  const byGameId = new Map((list.game_list_items || []).map((it: any) => [it.game_id, it]))
                  const orderedItemIds = ids.map((gid) => byGameId.get(gid)?.id).filter(Boolean)
                  // Optimistic update
                  const newItems: GameListItemWithGame[] = ids
                    .map((gid, idx) => {
                      const it = byGameId.get(gid)
                      return it ? { ...it, ranking: idx + 1 } : null
                    })
                    .filter(Boolean) as any
                  setList((prev) => (prev ? { ...prev, game_list_items: newItems as any } : prev))
                  setSavingOrder('saving')
                  const res = await fetch(`/api/lists/${list.id}/reorder`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ itemIds: orderedItemIds }),
                  })
                  if (!res.ok) {
                    // Optional: refetch list for consistency
                  }
                  setSavingOrder('saved')
                  setTimeout(() => setSavingOrder('idle'), 1200)
                }
              : undefined
          }
        />
      </div>

      {/* Add to List Modal */}
      {showAddModal && canEdit && !isBgg && (
        <Portal>
          <div
            className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4"
            onClick={() => {
              setShowAddModal(false)
              setSelectedGameForAdd(null)
            }}
          >
            <div
              className="bg-white w-full sm:max-w-xl rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[80vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold">Add a Game to this List</h3>
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setSelectedGameForAdd(null)
                  }}
                  className="p-2 rounded-md hover:bg-gray-100"
                  aria-label="Close"
                >
                  <XMarkIcon className="w-6 h-6 text-gray-500" />
                </button>
              </div>
              {/* Body */}
              <div className="p-6 flex-1 overflow-y-auto">
                <div className="space-y-4">
                  <p className="text-gray-600 text-sm mb-2">Search for a game to add:</p>
                  <SearchDropdown
                    onSelect={async (game) => {
                      setSelectedGameForAdd({ id: game.id, name: game.name })
                      await handleAddGameToList({ id: game.id, name: game.name })
                      setShowAddModal(false)
                      setSelectedGameForAdd(null)
                    }}
                    placeholder="Search for a game..."
                    autoFocus
                  />
                  <div className="flex justify-end pt-4">
                    <button
                      onClick={() => {
                        setShowAddModal(false)
                        setSelectedGameForAdd(null)
                      }}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Save Progress Modal for logged-out users */}
      <SaveProgressModal
        visible={showSaveModal}
        dismissCount={guestDismissCount}
        onClose={() => {
          setShowSaveModal(false)
          setGuestDismissCount((prev) => prev + 1)
        }}
        onAuthSuccess={() => {
          setShowSaveModal(false)
          // Refresh user enrichment after authentication
          const refreshEnrichment = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (session) {
              setSessionUserId(session.user.id)
              // Re-fetch user-specific data
              setEnriching(true)
              const gameIds = (list?.game_list_items || []).map((item: any) => item.game_id)
              if (gameIds.length) {
                const [{ data: rankData }, { data: membershipData }] = await Promise.all([
                  supabase
                    .from('rankings')
                    .select('game_id, ranking, played_it')
                    .eq('user_id', session.user.id)
                    .in('game_id', gameIds),
                  supabase.rpc('get_default_memberships', {
                    p_user_id: session.user.id,
                    p_game_ids: gameIds,
                  }),
                ])
                const rankings: Record<string, { ranking: number | null; played_it: boolean }> = {}
                const membership: Record<string, { library: boolean; wishlist: boolean }> = {}
                rankData?.forEach((r: any) => {
                  rankings[r.game_id] = { ranking: r.ranking, played_it: r.played_it }
                })
                membershipData?.forEach((m: any) => {
                  membership[m.game_id] = { library: m.in_library, wishlist: m.in_wishlist }
                })
                setUserEnrichment({ rankings, membership })
              }
              setEnriching(false)
            }
          }
          refreshEnrichment()
        }}
      />

      {/* Game Onboarding Modal for logged-out users */}
      {selectedGameForGuest && (
        <GameOnboardingModal
          game={selectedGameForGuest}
          visible={showGameModal}
          onClose={() => {
            setShowGameModal(false)
            setSelectedGameForGuest(null)
          }}
          onComplete={handleGameModalComplete}
        />
      )}
    </PageLayout>
  )
}
