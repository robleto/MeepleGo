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
import {
  Bars3Icon,
  TrophyIcon,
  XMarkIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  CheckIcon,
} from '@heroicons/react/24/outline'
import { TrophyIcon as TrophySolid } from '@heroicons/react/24/solid'
import { supabase } from '@/lib/supabase'
import { CATEGORY_CONFIGS, getCategoryLabel } from '@/lib/awards/deriveUserAwards'
import { getRatingSolidClass } from '@/components/Foundations/ratingColors'
import { cn } from '@/utils/helpers'
import GameImage from '@/components/Elements/GameImage'

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
  /** Called with the editor's full game map on save, so the parent can update its own game data */
  onGameMapUpdate?: (map: Record<string, GameLite>) => void
  onClose?: () => void
  onSave?: () => void
  maxNominees?: number
  seedGames?: GameLite[]
}

/* ─── Sortable nominee card ─────────────────────────────── */
function NomineeCard({
  id,
  name,
  thumbnail_url,
  rating,
  isWinner,
  index,
  onSetWinner,
  onRemove,
}: {
  id: string
  name: string
  thumbnail_url?: string | null
  rating?: number | null
  isWinner: boolean
  index: number
  onSetWinner: () => void
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id })
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative flex items-center gap-2.5 rounded-lg border bg-white transition-all',
        isWinner
          ? 'border-amber-300 ring-1 ring-amber-200/60 shadow-sm'
          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
      )}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="flex items-center self-stretch px-1.5 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-400 shrink-0"
        title="Drag to reorder"
      >
        <Bars3Icon className="w-3.5 h-3.5" aria-hidden="true" />
      </div>

      {/* Thumbnail */}
      <div className="w-11 h-11 rounded overflow-hidden shrink-0 my-1.5">
        <GameImage
          src={thumbnail_url || null}
          alt={name}
          name={name}
          variant="thumb"
          fit="cover"
          className="w-full h-full"
        />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1 py-1.5 pr-1">
        <div className="flex items-center gap-1.5">
          <span className="shrink-0 text-[10px] font-semibold text-gray-400 tabular-nums w-4 text-right">
            {index + 1}.
          </span>
          <span className="truncate text-[13px] font-medium text-gray-900">{name}</span>
        </div>
        {rating != null && rating > 0 && (
          <div className="mt-0.5 ml-[22px]">
            <span className={cn('inline-block px-1.5 py-px rounded text-[10px] font-bold', getRatingSolidClass(rating))}>
              {rating}
            </span>
          </div>
        )}
      </div>

      {/* Actions — visible on hover, always visible for winner */}
      <div className={cn(
        'flex items-center gap-0.5 pr-1.5 transition-opacity',
        isWinner ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
      )}>
        <button
          onClick={onSetWinner}
          className={cn(
            'p-1 rounded transition-colors',
            isWinner
              ? 'text-amber-500'
              : 'text-gray-300 hover:text-amber-500'
          )}
          title={isWinner ? 'Current winner' : 'Set as winner'}
          aria-label={isWinner ? 'Current winner' : 'Set as winner'}
        >
          {isWinner ? (
            <TrophySolid className="w-3.5 h-3.5" aria-hidden="true" />
          ) : (
            <TrophyIcon className="w-3.5 h-3.5" aria-hidden="true" />
          )}
        </button>
        <button
          onClick={onRemove}
          className="p-1 rounded text-gray-300 hover:text-red-500 transition-colors"
          title="Remove nominee"
          aria-label="Remove nominee"
        >
          <XMarkIcon className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

/* ─── Available game item ───────────────────────────────── */
function AvailableGameItem({
  g,
  onAdd,
}: {
  g: GameLite
  onAdd: () => void
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: g.id })

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        'flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50/80 transition-colors cursor-grab active:cursor-grabbing border-b border-gray-100/80 last:border-b-0',
        isDragging && 'opacity-40'
      )}
    >
      <div className="w-9 h-9 rounded overflow-hidden shrink-0">
        <GameImage
          src={g.thumbnail_url || null}
          alt={g.name}
          name={g.name}
          variant="thumb"
          fit="cover"
          className="w-full h-full"
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[12px] font-medium text-gray-800">{g.name}</div>
        {g.rating != null && g.rating > 0 && (
          <span className={cn('inline-block px-1 py-px rounded text-[9px] font-bold mt-0.5', getRatingSolidClass(g.rating))}>
            {g.rating}
          </span>
        )}
      </div>
      <button
        onClick={onAdd}
        className="shrink-0 p-1 rounded-md text-gray-400 hover:text-brand hover:bg-brand-subtle transition-colors"
        title={`Add ${g.name}`}
        aria-label={`Add ${g.name}`}
      >
        <PlusIcon className="w-4 h-4" />
      </button>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   Main editor component
   ═══════════════════════════════════════════════════════════ */
export default function AwardCategoryEditor({
  year,
  row,
  categoryLabel,
  gameMap,
  onChange,
  onGameMapUpdate,
  onClose,
  onSave,
  maxNominees = 10,
  seedGames = [],
}: Props) {
  const ns = `ace-${row.category}-${year}`
  const nomineesDropId = `${ns}-nominees`

  const cfgMax = CATEGORY_CONFIGS.find((c) => c.id === row.category)?.maxNominees
  const effectiveMax = maxNominees ?? cfgMax ?? 10

  const [initialNominees, setInitialNominees] = useState<string[]>(row.nominees)
  const [initialWinner, setInitialWinner] = useState<string | null>(row.winner_id)
  const [nominees, setNominees] = useState<string[]>(row.nominees)
  const [winnerId, setWinnerId] = useState<string | null>(row.winner_id)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [info, setInfo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<GameLite[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [prefilled, setPrefilled] = useState(false)

  const seedList: GameLite[] = (seedGames || []).filter(Boolean)
  const [autoSeeds, setAutoSeeds] = useState<GameLite[]>([])
  const [autoSeedsLoading, setAutoSeedsLoading] = useState(false)

  // Internal game map that extends the parent's with data from all sources
  const internalGameMap = useMemo(() => {
    const map: Record<string, GameLite> = { ...gameMap }
    seedList.forEach((g) => { if (g?.id) map[g.id] = g })
    autoSeeds.forEach((g) => { if (g?.id) map[g.id] = g })
    results.forEach((g) => { if (g?.id) map[g.id] = g })
    return map
  }, [gameMap, seedList, autoSeeds, results])

  // Sync from row prop
  useEffect(() => {
    if (row.nominees && row.nominees.length > 0) {
      setNominees(row.nominees)
      setInitialNominees(row.nominees)
    }
    setWinnerId(row.winner_id)
    setInitialWinner(row.winner_id)
  }, [row.id, row.nominees, row.winner_id])

  // Combined seeds
  const combinedSeeds: GameLite[] = (() => {
    const base = seedList.length > 0 ? seedList : autoSeeds
    const extra = seedList.length > 0 ? autoSeeds : []
    const all = [...base, ...extra]
    const seen = new Set<string>()
    const deduped: GameLite[] = []
    for (const g of all) {
      if (!g?.id || seen.has(g.id)) continue
      seen.add(g.id)
      deduped.push(g)
    }
    return deduped
  })()

  // Prefill nominees
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

  // Available options (not already nominated)
  const defaultOptions = combinedSeeds.slice(effectiveMax).filter((g) => !nominees.includes(g.id))

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  function NomineesDropZone({ children }: { children: React.ReactNode }) {
    const { isOver, setNodeRef } = useDroppable({ id: nomineesDropId })
    return (
      <div ref={setNodeRef} className={cn(isOver && 'ring-1 ring-brand/30 rounded-lg')}>
        {children}
      </div>
    )
  }

  function EmptySlot({ index }: { index: number }) {
    const id = `${ns}-slot-${index}`
    const { isOver, setNodeRef } = useDroppable({ id })
    return (
      <div
        ref={setNodeRef}
        className={cn(
          'flex items-center justify-center rounded-lg border-2 border-dashed transition-colors',
          isOver
            ? 'border-brand bg-brand-subtle/40'
            : 'border-gray-200 bg-gray-50/50'
        )}
        style={{ minHeight: '52px' }}
      >
        <span className="text-[11px] text-gray-400">{index + 1}</span>
      </div>
    )
  }

  // Debounced search
  useEffect(() => {
    const term = search.trim()
    const handle = setTimeout(async () => {
      if (!term) { setResults([]); return }
      try {
        setSearching(true)
        const res = await fetch(`/api/games?q=${encodeURIComponent(term)}&limit=12`)
        const js = await res.json().catch(() => null)
        const games: any[] = js?.games || []
        setResults(games.map((g) => ({
          id: String(g.id),
          name: g.name,
          thumbnail_url: g.thumbnail_url || null,
        })))
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
    // Slot-targeted drops
    if (typeof over.id === 'string' && over.id.startsWith(`${ns}-slot-`)) {
      const idxStr = over.id.substring((`${ns}-slot-`).length)
      const targetIndex = Math.max(0, Math.min(Number(idxStr) || 0, effectiveMax - 1))
      const aid = String(active.id)
      const fromIndex = nominees.indexOf(aid)
      if (fromIndex !== -1) {
        setNominees(arrayMove(nominees, fromIndex, Math.min(targetIndex, nominees.length - 1)))
        return
      }
      if (nominees.includes(aid)) return
      if (nominees.length >= effectiveMax) {
        setError(`Maximum ${effectiveMax} nominees reached.`)
        return
      }
      const next = [...nominees]
      next.splice(Math.min(targetIndex, next.length), 0, aid)
      setNominees(next)
      return
    }

    if (active.id === over.id) return
    const oldIndex = nominees.indexOf(String(active.id))
    const newIndex = nominees.indexOf(String(over.id))
    if (oldIndex !== -1 && newIndex !== -1) {
      setNominees(arrayMove(nominees, oldIndex, newIndex))
      return
    }
    if (oldIndex === -1 && newIndex !== -1 && typeof active.id === 'string') {
      if (nominees.includes(String(active.id))) return
      if (nominees.length >= effectiveMax) {
        setError(`Maximum ${effectiveMax} nominees reached.`)
        return
      }
      const next = [...nominees]
      next.splice(newIndex, 0, String(active.id))
      setNominees(next)
    }
  }

  function addNomineeById(id: string) {
    if (!id || nominees.includes(id)) return
    if (nominees.length >= effectiveMax) {
      setError(`Maximum ${effectiveMax} nominees reached.`)
      return
    }
    setNominees([...nominees, id])
  }

  function removeNominee(id: string) {
    setNominees((prev) => prev.filter((n) => n !== id))
    if (winnerId === id) setWinnerId(null)
  }

  function setWinner(id: string) {
    setWinnerId(id)
    if (!nominees.includes(id)) {
      if (nominees.length >= effectiveMax) {
        setError(`Maximum ${effectiveMax} nominees reached.`)
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
        onGameMapUpdate?.(internalGameMap)
        setInitialNominees(nominees)
        setInitialWinner(winnerId)
        setSaved(true)
        setInfo('Saved')
        setTimeout(() => setInfo(null), 2000)
        onSave?.()
      }
    } finally {
      setSaving(false)
    }
  }

  function cancel() {
    setNominees(initialNominees)
    setWinnerId(initialWinner)
    setError(null)
    onClose?.()
  }

  function handleClose() {
    setNominees(initialNominees)
    setWinnerId(initialWinner)
    setError(null)
    onClose?.()
  }

  // Auto-seed from user's top-ranked games in this category
  useEffect(() => {
    if (seedList.length > 0) return
    let cancelled = false
    ;(async () => {
      try {
        setAutoSeedsLoading(true)
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return
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

  // Dirty state detection
  const isDirty = JSON.stringify(nominees) !== JSON.stringify(initialNominees)
    || winnerId !== initialWinner

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} collisionDetection={closestCenter}>
      <div className="rounded-2xl border border-gray-200/80 bg-white shadow-sm overflow-hidden">
        {/* ── Header ──────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-gray-100 bg-gray-50/60">
          <div className="flex items-center gap-2 min-w-0">
            <TrophySolid className="w-4 h-4 text-amber-500 shrink-0" />
            <h3 className="font-display text-sm font-semibold text-gray-900 truncate">
              {getCategoryLabel(categoryLabel)}
            </h3>
            <span className="text-[10px] text-gray-400 font-medium shrink-0">{year}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {saving && (
              <span className="text-[10px] text-gray-400 mr-1">Saving...</span>
            )}
            {info && (
              <span className="inline-flex items-center gap-1 text-[10px] text-green-600 font-medium mr-1">
                <CheckIcon className="w-3 h-3" />
                {info}
              </span>
            )}
            {(!saved || isDirty) && (
              <button
                onClick={cancel}
                className="text-[11px] px-2.5 py-1 rounded-md border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 font-medium transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              onClick={save}
              disabled={saving || !isDirty}
              className={cn(
                'text-[11px] px-3 py-1 rounded-md font-medium transition-colors',
                isDirty
                  ? 'bg-brand hover:bg-brand-light text-white shadow-sm'
                  : 'bg-gray-100 text-gray-300 cursor-not-allowed'
              )}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            {onClose && saved && !isDirty && (
              <button
                onClick={handleClose}
                className="text-[11px] px-3 py-1 rounded-md bg-brand hover:bg-brand-light text-white font-medium transition-colors shadow-sm inline-flex items-center gap-1"
              >
                Done
              </button>
            )}
            {onClose && (
              <button
                onClick={handleClose}
                className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                title="Close editor"
                aria-label="Close editor"
              >
                <XMarkIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ── Body ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] xl:grid-cols-[1fr_320px]">
          {/* Left panel: Nominees (winner highlighted inline) */}
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Nominees
                </span>
                <span className="text-[10px] font-medium text-gray-400 tabular-nums">
                  {nominees.length}/{effectiveMax}
                </span>
              </div>
              {!winnerId && nominees.length > 0 && (
                <span className="text-[10px] text-amber-500 font-medium flex items-center gap-1">
                  <TrophyIcon className="w-3 h-3" />
                  Click trophy to set winner
                </span>
              )}
            </div>
            <NomineesDropZone>
              <SortableContext items={nominees} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Array.from({ length: effectiveMax }).map((_, i) => {
                    const id = nominees[i]
                    return (
                      <div key={`${ns}-row-${i}`}>
                        {id ? (
                          <NomineeCard
                            id={id}
                            name={internalGameMap[id]?.name || `#${id}`}
                            thumbnail_url={internalGameMap[id]?.thumbnail_url || null}
                            rating={(internalGameMap[id] as any)?.rating || null}
                            isWinner={id === winnerId}
                            index={i}
                            onSetWinner={() => setWinner(id)}
                            onRemove={() => removeNominee(id)}
                          />
                        ) : (
                          <EmptySlot index={i} />
                        )}
                      </div>
                    )
                  })}
                </div>
              </SortableContext>
            </NomineesDropZone>
            {error && (
              <div className="mt-2 text-[12px] text-red-600 font-medium bg-red-50 px-3 py-1.5 rounded-md">
                {error}
              </div>
            )}
          </div>

          {/* Right panel: Available Games */}
          <div className="border-t lg:border-t-0 lg:border-l border-gray-100 bg-gray-50/30 flex flex-col">
            <div className="px-3 pt-3 pb-1.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Available Games
                </span>
                <span className="text-[10px] font-medium text-gray-400 tabular-nums">
                  {search
                    ? `${results.filter((g) => !nominees.includes(g.id)).length} found`
                    : `${defaultOptions.length} available`}
                </span>
              </div>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  type="text"
                  placeholder="Search all games..."
                  className="w-full text-[12px] pl-7 pr-3 py-1.5 rounded-md border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-brand/40 focus:border-brand/40 transition-shadow"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[500px] lg:max-h-[calc(100vh-280px)]">
              {search ? (
                <>
                  {searching && (
                    <div className="p-4 text-[11px] text-gray-400 text-center">Searching...</div>
                  )}
                  {!searching && results.filter((g) => !nominees.includes(g.id)).length === 0 && (
                    <div className="p-4 text-[11px] text-gray-400 text-center">No matches found</div>
                  )}
                  {results
                    .filter((g) => !nominees.includes(g.id))
                    .map((g) => (
                      <AvailableGameItem key={g.id} g={g} onAdd={() => addNomineeById(g.id)} />
                    ))}
                </>
              ) : defaultOptions.length > 0 ? (
                defaultOptions.map((g) => (
                  <AvailableGameItem key={g.id} g={g} onAdd={() => addNomineeById(g.id)} />
                ))
              ) : autoSeedsLoading ? (
                <div className="p-4 text-[11px] text-gray-400 text-center">Loading...</div>
              ) : (
                <div className="p-6 text-center">
                  <p className="text-[11px] text-gray-400">No additional games available</p>
                  <p className="text-[10px] text-gray-300 mt-1">Use search to find more games</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DndContext>
  )
}
