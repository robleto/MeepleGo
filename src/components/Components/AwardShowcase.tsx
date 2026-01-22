'use client'
import Heading from '@/components/Components/Heading'
import WinnerCard from './WinnerCard'
import NomineeGrid from './NomineeGrid'
import type { GameWithRanking } from '@/types'
import { useEffect, useMemo, useState } from 'react'
import AwardCategoryEditor from '@/components/Components/AwardCategoryEditor'
import { supabase } from '@/lib/supabase'
import { CATEGORY_CONFIGS } from '@/lib/awards/deriveUserAwards'

interface AwardShowcaseProps {
  id: string
  title: string
  description?: string
  games: GameWithRanking[]
  className?: string
  editHref?: string
  editLabel?: string
  inlineEditable?: boolean
}

export default function AwardShowcase({
  id,
  title,
  description,
  games,
  className = '',
  editHref,
  editLabel = 'Edit',
  inlineEditable = false,
}: AwardShowcaseProps) {
  if (!games.length) return null

  const winner = games[0]
  const nominees = games.slice(1)

  const [showEditor, setShowEditor] = useState(false)
  const currentYear = new Date().getFullYear()
  const [row, setRow] = useState<any | null>(null)
  const [gameMap, setGameMap] = useState<Record<string, any>>({})
  const seedGamesFromProps = useMemo(
    () =>
      games.map((g) => ({
        id: String(g.id),
        name: g.name,
        thumbnail_url: (g as any).thumbnail_url ?? null,
      })),
    [games]
  )
  const [seedGames, setSeedGames] = useState(seedGamesFromProps)

  useEffect(() => {
    if (!showEditor || !inlineEditable) return
    let cancelled = false
    async function load() {
      // derive category id mapping (editor expects derive ids)
      const categoryMap: Record<string, string> = {
        best: 'best_overall',
        strategy: 'best_strategy',
        family: 'best_family',
        duo: 'best_two_player',
        kids: 'best_kids',
        card: 'best_card_game',
        wargame: 'best_wargame',
        party: 'best_party',
        trivia: 'best_trivia',
        bluffing: 'best_bluffing',
        pnp: 'best_print_play',
        coop: 'best_coop',
        deckbuild: 'best_deck_building',
        solo: 'best_solo',
      }
      const editorCategory = categoryMap[id] || 'best_overall'
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) return
  const res = await fetch(`/api/awards/${currentYear}`)
      const js = await res.json().catch(() => null)
      const found = js?.awards?.find((a: any) => a.category === editorCategory)
      // Build game map from the shown games (for names/thumbnails) as a baseline
      const gm: Record<string, any> = {}
      games.forEach((g) => {
        gm[String(g.id)] = {
          id: String(g.id),
          name: g.name,
          thumbnail_url: (g as any).thumbnail_url ?? null,
          rating: (g as any).ranking ?? (g as any).rating ?? null,
        }
      })
      setGameMap(gm)
      if (!cancelled) setRow(found || { id: `temp-${editorCategory}`, category: editorCategory, nominees: [], winner_id: null })

      // Build a larger seed pool from rankings for immediate options (beyond top 10)
      try {
        const cfg = CATEGORY_CONFIGS.find((c) => c.id === editorCategory)
        const { data: rankings } = await supabase
          .from('rankings')
          .select('game_id, ranking, played_it, games:game_id ( id, name, thumbnail_url, categories, mechanics, min_players, max_players )')
          .eq('user_id', sessionData.session.user.id)
        const filtered = (rankings || [])
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
          .filter((r) => r.game && (r.ranking ?? 0) >= 7 && r.played_it)
        const matches = cfg
          ? filtered.filter((r: any) => cfg.predicate({
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
          : filtered
        matches.sort((a: any, b: any) => (b.ranking ?? 0) - (a.ranking ?? 0))
        const extras = matches
          .slice(0, 60)
          .map((r: any) => ({ 
            id: r.game!.id, 
            name: r.game!.name, 
            thumbnail_url: r.game!.thumbnail_url,
            rating: r.ranking,
          }))
        const seen = new Set(seedGamesFromProps.map((g) => g.id))
        const combined = [...seedGamesFromProps.map(g => ({...g, rating: (games.find(gg => String(gg.id) === g.id) as any)?.ranking ?? null})), ...extras.filter((g: any) => !seen.has(g.id))]
        if (!cancelled) {
          setSeedGames(combined)
          setGameMap((prev) => {
            const next = { ...prev }
            combined.forEach((g) => {
              next[String(g.id)] = {
                id: String(g.id),
                name: g.name,
                thumbnail_url: (g as any).thumbnail_url ?? null,
                rating: (g as any).rating ?? null,
              }
            })
            return next
          })
        }
      } catch {
        // ignore
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [showEditor, inlineEditable, id, games, currentYear])

  const displayGames = useMemo(() => {
    if (!inlineEditable || !row) return games
    const winnerId = row.winner_id ? String(row.winner_id) : null
    const nomineeIds = (row.nominees || []).map((n: any) => String(n))
    const orderedIds = winnerId
      ? [winnerId, ...nomineeIds.filter((id: string) => id !== winnerId)]
      : nomineeIds
    const fallback = (id: string) => ({
      id,
      name: `#${id}`,
      thumbnail_url: null,
      ranking: null,
    })
    return orderedIds
      .map((id: string) => gameMap[id] || seedGames.find((g) => String(g.id) === id) || fallback(id))
      .map((g: any) => ({
        id: g.id,
        name: g.name,
        thumbnail_url: g.thumbnail_url ?? null,
        ranking: g.rating ?? (g as any).ranking ?? null,
      })) as any
  }, [inlineEditable, row, gameMap, seedGames, games])

  const winnerGame = displayGames[0] || winner
  const nomineeGames = displayGames.slice(1)

  return (
    <section
      id={`award-${id}`}
      className={`bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-lg p-5 shadow-sm ${className}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Heading as="h3" size="md" className="mb-2 flex items-center gap-2">
            <span>{title}</span>
            <span className="text-xs font-normal text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
              Top {games.length}
            </span>
          </Heading>
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-w-lg">
              {description}
            </p>
          )}
        </div>
        {inlineEditable ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEditor((s) => !s)}
              className="text-[11px] inline-flex items-center gap-1 px-2 py-1 rounded border bg-white hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700"
            >
              {showEditor ? 'Close' : editLabel}
            </button>
          </div>
        ) : (
          editHref && (
            <a
              href={editHref}
              className="text-[11px] inline-flex items-center gap-1 px-2 py-1 rounded border bg-white hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700"
            >
              {editLabel}
            </a>
          )
        )}
      </div>

      {/* Winner and Nominees or Inline Editor */}
      <div className="space-y-6">
        {inlineEditable && showEditor && row ? (
          <div className="border rounded p-3 bg-white dark:bg-gray-900">
            <AwardCategoryEditor
              year={currentYear}
              row={row}
              categoryLabel={title}
              gameMap={gameMap}
              seedGames={seedGames}
              onChange={(patch) => setRow((r: any) => ({ ...r, ...patch }))}
            />
          </div>
        ) : (
          <>
        {/* Mobile/Tablet: Stacked Layout */}
        <div className="block lg:hidden">
          {/* Winner Section */}
          <div className="flex justify-center md:justify-start mb-6">
            <div className="w-full max-w-xs">
              <WinnerCard game={winnerGame} />
            </div>
          </div>

          {/* Nominees Section - Horizontal Scroll */}
          {nomineeGames.length > 0 && (
            <div>
              <NomineeGrid nominees={nomineeGames} layout="scroll" />
            </div>
          )}
        </div>

        {/* Desktop: Side-by-side with Compact Grid */}
        <div className="hidden lg:block">
          <div className="grid grid-cols-12 gap-8 items-start">
            {/* Winner - Takes 4 columns */}
            <div className="col-span-4">
              <WinnerCard game={winnerGame} />
            </div>

            {/* Nominees - Takes 8 columns with dense grid */}
            <div className="col-span-8">
              {nomineeGames.length > 0 && (
                <NomineeGrid nominees={nomineeGames} layout="grid" />
              )}
            </div>
          </div>
        </div>
          </>
        )}
      </div>
    </section>
  )
}
