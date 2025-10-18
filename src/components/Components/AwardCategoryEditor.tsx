'use client'
import { useEffect, useState, useMemo } from 'react'
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  useDroppable,
  useDraggable,
  closestCenter,
} from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Bars3Icon, TrophyIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase'
import { CATEGORY_CONFIGS } from '@/lib/awards/deriveUserAwards'
import { getRatingSolidClass } from '@/components/Foundations/ratingColors'

interface GameLite {
  id: string
  name: string
  thumbnail_url: string | null
  rating?: number | null
}

interface AwardRow {
  id: string
  category: string
  nominees: string[]
  winner_id: string | null
  manual_override?: boolean
  stale?: boolean
}

interface Props {
  year: number
  row: AwardRow
  categoryLabel: string
  gameMap: Record<string, GameLite>
  onChange?: (row: Partial<AwardRow>) => void
  maxNominees?: number
  seedGames?: GameLite[]
}

function NomineeItem({
  id,
  name,
  thumbnail_url,
  rating,
  isWinner,
  index,
}: {
  id: string
  name: string
  thumbnail_url?: string | null
  rating?: number | null
  isWinner: boolean
  index?: number
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id })
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }
  const thumb = thumbnail_url || '/placeholder-game.svg'
  const ratingClass = getRatingSolidClass(rating)
  
  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`group relative flex items-center gap-3 px-3 py-3 rounded-lg border bg-white dark:bg-gray-800 cursor-grab active:cursor-grabbing transition-shadow hover:shadow-md ${
        isWinner 
          ? 'border-amber-400 shadow-amber-100 dark:shadow-amber-900/20' 
          : 'border-gray-200 dark:border-gray-700'
      }`}
      {...attributes}
      {...listeners}
      title={name}
    >
      <Bars3Icon className="w-4 h-4 text-gray-400 shrink-0" aria-hidden="true" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={thumb} alt="" className="w-16 h-16 object-cover rounded shadow-sm" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1">
          {typeof index === 'number' && (
            <span className="shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-[10px] font-semibold">
              {index + 1}
            </span>
          )}
          <span className="truncate font-medium text-[14px] text-gray-900 dark:text-gray-100">{name}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {rating && (
            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${ratingClass}`}>
              {rating}
            </span>
          )}
          {isWinner && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-semibold">
              <TrophyIcon className="w-3 h-3" />
              Winner
            </span>
          )}
        </div>
      </div>
    </li>
  )
}

export default function AwardCategoryEditor({
  year,
  row,
  categoryLabel,
  gameMap,
  onChange,
  maxNominees = 10,
  seedGames = [],
}: Props) {
  // Namespace for DnD ids to avoid cross-editor collisions if multiple editors are open
  const ns = `ace-${row.category}-${year}`
  const nomineesDropId = `${ns}-nominees`

  // Derive per-category max nominees when not provided
  const cfgMax = CATEGORY_CONFIGS.find((c) => c.id === row.category)?.maxNominees
  const effectiveMax = maxNominees ?? cfgMax ?? 10
  const [initialNominees, setInitialNominees] = useState<string[]>(row.nominees)
  const [initialWinner, setInitialWinner] = useState<string | null>(row.winner_id)
  const [nominees, setNominees] = useState<string[]>(row.nominees)
  const [winnerId, setWinnerId] = useState<string | null>(row.winner_id)
  const [addingId, setAddingId] = useState('')
  const [saving, setSaving] = useState(false)
  const [info, setInfo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<GameLite[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [prefilled, setPrefilled] = useState(false)
  // Seed list to show in Available when no search input
  const seedList: GameLite[] = (seedGames || []).filter(Boolean)
  const [autoSeeds, setAutoSeeds] = useState<GameLite[]>([])
  const [autoSeedsLoading, setAutoSeedsLoading] = useState(false)
  
  // Internal game map that extends the parent's with data from Available items
  // Built dynamically from all sources to avoid circular dependency
  const internalGameMap = useMemo(() => {
    const map: Record<string, GameLite> = { ...gameMap }
    
    // Add seed games
    seedList.forEach((g) => {
      if (g && g.id) map[g.id] = g
    })
    
    // Add auto-seeded games
    autoSeeds.forEach((g) => {
      if (g && g.id) map[g.id] = g
    })
    
    // Add search results
    results.forEach((g) => {
      if (g && g.id) map[g.id] = g
    })
    
    return map
  }, [gameMap, seedList, autoSeeds, results])

  useEffect(() => {
    // Only overwrite nominees from the row when there are saved nominees.
    if (row.nominees && row.nominees.length > 0) {
      setNominees(row.nominees)
      setInitialNominees(row.nominees)
    }
    setWinnerId(row.winner_id)
    setInitialWinner(row.winner_id)
  }, [row.id, row.nominees, row.winner_id])

  // Combined seeds (prefer explicit seeds, but augment with autoSeeds for a larger pool)
  const combinedSeeds: GameLite[] = (() => {
    const base = seedList.length > 0 ? seedList : autoSeeds
    const extra = seedList.length > 0 ? autoSeeds : []
    const all = [...base, ...extra]
    const seen = new Set<string>()
    const deduped = [] as GameLite[]
    for (const g of all) {
      if (!g?.id) continue
      if (seen.has(g.id)) continue
      seen.add(g.id)
      deduped.push(g)
    }
    return deduped
  })()

  // Prefill nominees from the combined, ordered pool
  useEffect(() => {
    if (prefilled) return
    if (row.nominees && row.nominees.length > 0) return
    if (combinedSeeds.length === 0) return
    const top = combinedSeeds.map((g) => g.id).slice(0, effectiveMax)
    if (top.length > 0) {
      setNominees(top)
      setInitialNominees(top)
      setPrefilled(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [combinedSeeds, effectiveMax, row.nominees])

  // Default options when not searching: everything after the top N (N = effectiveMax), minus already-added nominees
  const defaultOptions = combinedSeeds.slice(effectiveMax).filter((g) => !nominees.includes(g.id))

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  function NomineesDropZone({ children }: { children: React.ReactNode }) {
    const { isOver, setNodeRef } = useDroppable({ id: nomineesDropId })
    return (
      <div ref={setNodeRef} className={isOver ? 'ring-1 ring-primary-500 rounded' : ''}>
        {children}
      </div>
    )
  }

  function AvailableItem({ g }: { g: GameLite }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: g.id })
    const thumb = g.thumbnail_url || '/placeholder-game.svg'
    const ratingClass = getRatingSolidClass(g.rating)
    
    return (
      <div
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        className={`flex items-center justify-between p-3 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors cursor-grab active:cursor-grabbing ${
          isDragging ? 'opacity-50' : ''
        }`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={thumb} alt="" className="w-14 h-14 object-cover rounded shadow-sm" />
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium text-[13px] text-gray-900 dark:text-gray-100 mb-1">{g.name}</div>
            {g.rating && (
              <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${ratingClass}`}>
                {g.rating}
              </span>
            )}
          </div>
        </div>
        <button 
          onClick={() => addNomineeById(g.id)} 
          className="ml-2 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-medium transition-colors shadow-sm"
        >
          Add
        </button>
      </div>
    )
  }

  function EmptySlot({ index }: { index: number }) {
    const id = `${ns}-slot-${index}`
    const { isOver, setNodeRef } = useDroppable({ id })
    return (
      <div
        ref={setNodeRef}
        className={`flex items-center justify-center h-9 text-[10px] rounded border border-dashed ${
          isOver ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-300'
        }`}
      >
        <span className="text-gray-400">Slot {index + 1}</span>
      </div>
    )
  }

  // Search (debounced)
  useEffect(() => {
    const term = search.trim()
    const handle = setTimeout(async () => {
      if (!term) {
        setResults([])
        return
      }
      try {
        setSearching(true)
        const res = await fetch(`/api/games?q=${encodeURIComponent(term)}&limit=12`)
        const js = await res.json().catch(() => null)
        const games: any[] = js?.games || []
        const lite: GameLite[] = games.map((g) => ({ id: String(g.id), name: g.name, thumbnail_url: g.thumbnail_url || null }))
        setResults(lite)
      } finally {
        setSearching(false)
      }
    }, 250)
    return () => clearTimeout(handle)
  }, [search])

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id))
  }

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e
    setActiveId(null)
    if (!over) return
    if (over.id === nomineesDropId && typeof active.id === 'string') {
      addNomineeById(String(active.id))
      return
    }
    // Slot-targeted drops (e.g., ace-cat-year-slot-2)
    if (typeof over.id === 'string' && over.id.startsWith(`${ns}-slot-`)) {
      const idxStr = over.id.substring((`${ns}-slot-`).length)
      const targetIndex = Math.max(0, Math.min(Number(idxStr) || 0, effectiveMax - 1))
      const activeId = String(active.id)
      const fromIndex = nominees.indexOf(activeId)
      // Reorder within nominees to the slot index
      if (fromIndex !== -1) {
        const toIndex = Math.max(0, Math.min(targetIndex, nominees.length - 1))
        const reordered = arrayMove(nominees, fromIndex, toIndex)
        setNominees(reordered)
        return
      }
      // Insert from Available at the slot index
      if (nominees.includes(activeId)) return
      if (nominees.length >= effectiveMax) {
        setError(`Max nominees reached (${effectiveMax}).`)
        return
      }
      const next = [...nominees]
      next.splice(Math.min(targetIndex, next.length), 0, activeId)
      setNominees(next)
      return
    }
    if (active.id === over.id) return
    const oldIndex = nominees.indexOf(String(active.id))
    const newIndex = nominees.indexOf(String(over.id))
    // If dragging an already-present nominee, reorder
    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(nominees, oldIndex, newIndex)
      setNominees(reordered)
      return
    }
    // If dragging from Available onto a nominee row, insert at that position
    if (oldIndex === -1 && newIndex !== -1 && typeof active.id === 'string') {
      if (nominees.includes(String(active.id))) return
      if (nominees.length >= effectiveMax) {
        setError(`Max nominees reached (${effectiveMax}).`)
        return
      }
      const next = [...nominees]
      next.splice(newIndex, 0, String(active.id))
      setNominees(next)
      return
    }
  }

  function addNominee() {
    const idVal = addingId.trim()
    if (!idVal || nominees.includes(idVal)) return
    if (nominees.length >= effectiveMax) {
      setError(`Max nominees reached (${effectiveMax}).`)
      return
    }
    setNominees([...nominees, idVal])
    setAddingId('')
  }

  function addNomineeById(id: string) {
    if (!id || nominees.includes(id)) return
    if (nominees.length >= effectiveMax) {
      setError(`Max nominees reached (${effectiveMax}).`)
      return
    }
    setNominees([...nominees, id])
  }

  function removeNominee(id: string) {
    const next = nominees.filter((n) => n !== id)
    setNominees(next)
    if (winnerId === id) setWinnerId(null)
  }

  function setWinner(id: string) {
    setWinnerId(id)
    if (!nominees.includes(id)) {
      if (nominees.length >= effectiveMax) {
        setError(`Max nominees reached (${effectiveMax}).`)
        return
      }
      setNominees((n) => [...n, id])
    }
  }

  async function save() {
    setSaving(true)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`
      const res = await fetch(`/api/awards/${year}/${row.category}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ nominees, winner_id: winnerId }),
      })
      const js = await res.json().catch(() => null)
      if (!res.ok) {
        setError(js?.error || 'Update failed')
      } else {
        onChange?.({ nominees, winner_id: winnerId })
        setInitialNominees(nominees)
        setInitialWinner(winnerId)
        setInfo('Saved')
        setTimeout(() => setInfo(null), 1200)
      }
    } finally {
      setSaving(false)
    }
  }

  function cancel() {
    setNominees(initialNominees)
    setWinnerId(initialWinner)
    setError(null)
  }

  function resetAll() {
    setNominees([])
    setWinnerId(null)
  }

  // Auto-seed from user's top-ranked games in this category if no explicit seeds were passed
  useEffect(() => {
    if (seedList.length > 0) return
    let cancelled = false
    ;(async () => {
      try {
        setAutoSeedsLoading(true)
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return
        // Pull all rankings and join minimal game info
        const { data } = await supabase
          .from('rankings')
          .select('game_id, ranking, played_it, games:game_id ( id, name, thumbnail_url, categories, mechanics, min_players, max_players )')
          .eq('user_id', session.user.id)
        const cfg = CATEGORY_CONFIGS.find((c) => c.id === row.category)
        const filtered = (data || [])
          .map((r: any) => ({
            ranking: r.ranking as number | null,
            played_it: r.played_it as boolean | null,
            game: r.games ? {
              id: String(r.games.id),
              name: r.games.name as string,
              thumbnail_url: r.games.thumbnail_url as string | null,
              categories: (r.games.categories as string[] | null) || [],
              mechanics: (r.games.mechanics as string[] | null) || [],
              min_players: r.games.min_players as number | null,
              max_players: r.games.max_players as number | null,
            } : null,
          }))
          .filter((r) => r.game && (r.ranking ?? 0) > 0 && r.played_it)

        let matches = filtered
        if (cfg) {
          // Mirror server logic: rating >= 7 and predicate
          matches = filtered.filter((r: any) => (r.ranking ?? 0) >= 7 && cfg.predicate({
            game_id: r.game!.id,
            rating: r.ranking,
            updated_at: null,
            played_it: r.played_it,
            game: {
              id: r.game!.id,
              name: r.game!.name,
              year_published: null,
              categories: r.game!.categories,
              mechanics: r.game!.mechanics,
              min_players: r.game!.min_players,
              max_players: r.game!.max_players,
            },
          } as any))
        }
        matches.sort((a: any, b: any) => (b.ranking ?? 0) - (a.ranking ?? 0))
        const lite: GameLite[] = matches.map((r: any) => ({
          id: r.game!.id,
          name: r.game!.name,
          thumbnail_url: r.game!.thumbnail_url,
        }))
        if (!cancelled) setAutoSeeds(lite)
      } catch {
        // no-op
      } finally {
        if (!cancelled) setAutoSeedsLoading(false)
      }
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [row.category])

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} collisionDetection={closestCenter}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left (2/3): Nominees editor */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h3 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">
                Nominees
              </h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-[11px] font-medium text-gray-600 dark:text-gray-400">
                {nominees.length}/{effectiveMax}
              </span>
              {winnerId && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[11px] font-medium">
                  <TrophyIcon className="w-3 h-3" />
                  Winner: {internalGameMap[winnerId]?.name || `#${winnerId}`}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={resetAll}
                className="text-[12px] px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-300 font-medium transition-colors"
                title="Reset nominees & winner"
              >
                Reset
              </button>
              <button
                onClick={cancel}
                className="text-[12px] px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-300 font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={save} 
                className="text-[12px] px-4 py-1.5 rounded-md bg-green-600 hover:bg-green-700 text-white font-medium transition-colors shadow-sm"
              >
                Save
              </button>
              {info && <span className="text-[11px] text-green-600 dark:text-green-400 font-medium">{info}</span>}
              {saving && <span className="text-[11px] text-gray-500">Saving…</span>}
            </div>
          </div>
          <NomineesDropZone>
            <SortableContext items={nominees} strategy={rectSortingStrategy}>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Array.from({ length: effectiveMax }).map((_, i) => {
                  const id = nominees[i]
                  return (
                    <li key={`${ns}-row-${i}`} className="min-h-20">
                      {id ? (
                        <div className="relative group">
                          <NomineeItem
                            id={id}
                            name={internalGameMap[id]?.name || `#${id}`}
                            thumbnail_url={internalGameMap[id]?.thumbnail_url || null}
                            rating={(internalGameMap[id] as any)?.rating || null}
                            isWinner={id === winnerId}
                            index={i}
                          />
                          <div className="absolute top-2 right-2 flex gap-2 items-center">
                            <button
                              onClick={() => setWinner(id)}
                              className="p-1.5 rounded-md bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 transition-colors shadow-sm"
                              title="Set winner"
                              aria-label="Set winner"
                            >
                              <TrophyIcon
                                className={id === winnerId ? 'w-4 h-4 text-amber-500' : 'w-4 h-4 text-gray-400 hover:text-amber-500'}
                                aria-hidden="true"
                              />
                            </button>
                            <button
                              onClick={() => removeNominee(id)}
                              className="p-1.5 rounded-md bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 transition-colors shadow-sm"
                              title="Remove nominee"
                              aria-label="Remove nominee"
                            >
                              <XMarkIcon className="w-4 h-4 text-gray-400 hover:text-red-600 transition-colors" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 text-[11px] text-gray-400 dark:text-gray-500 h-20 flex items-center justify-center bg-gray-50/50 dark:bg-gray-800/50">
                          Empty slot
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            </SortableContext>
          </NomineesDropZone>
          {error && <div className="mt-2 text-[12px] text-red-600 dark:text-red-400 font-medium">{error}</div>}
        </div>

        {/* Right (1/3): Available pool with independent scroll */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">
              Available Games
            </h3>
            <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
              {search
                ? `${results.filter((g) => !nominees.includes(g.id)).length} matches`
                : `${defaultOptions.length} options`}
            </span>
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="text"
            placeholder="Search games…"
            className="w-full text-[13px] px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-shadow"
          />
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800 shadow-sm max-h-[600px] overflow-y-auto">{search ? (
              <>
                {searching && <div className="p-4 text-[12px] text-gray-500 text-center">Searching…</div>}
                {!searching && results.filter((g) => !nominees.includes(g.id)).length === 0 && (
                  <div className="p-4 text-[12px] text-gray-400 text-center">No available matches</div>
                )}
                {results
                  .filter((g) => !nominees.includes(g.id))
                  .map((g) => (
                    <AvailableItem key={g.id} g={g} />
                  ))}
              </>
            ) : defaultOptions.length > 0 ? (
              defaultOptions.map((g) => <AvailableItem key={g.id} g={g} />)
            ) : autoSeedsLoading ? (
              <div className="p-4 text-[12px] text-gray-500 text-center">Loading options…</div>
            ) : (
              <div className="p-4 text-[12px] text-gray-400 text-center italic">No options available.</div>
            )}
          </div>
        </div>
      </div>
    </DndContext>
  )
}
