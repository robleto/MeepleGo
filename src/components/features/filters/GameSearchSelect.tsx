'use client'

import React, { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { MagnifyingGlassIcon, TrophyIcon, CubeIcon } from '@heroicons/react/24/outline'
import { cn } from '@/utils/helpers'

interface SuggestionGame { id: string; name: string; year_published: number | null; thumbnail_url: string | null; rating?: number | null }
interface GroupedSuggestions { exactMatches: SuggestionGame[]; popular: SuggestionGame[]; other: SuggestionGame[] }

export interface GameSearchSelectProps {
  onSelect: (game: SuggestionGame) => void
  placeholder?: string
  autoFocus?: boolean
  className?: string
  variant?: 'default' | 'hero'
}

export default function GameSearchSelect({ onSelect, placeholder = 'Search games…', autoFocus, className, variant='default' }: GameSearchSelectProps) {
  const [query, setQuery] = useState('')
  const [grouped, setGrouped] = useState<GroupedSuggestions>({ exactMatches: [], popular: [], other: [] })
  const [flat, setFlat] = useState<SuggestionGame[]>([])
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const dropdownRef = useRef<HTMLDivElement | null>(null)
  const cacheRef = useRef<Record<string, SuggestionGame[]>>({})
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => { if (autoFocus) inputRef.current?.focus() }, [autoFocus])

  useEffect(() => {
    const raw = query.trim()
    if (!raw) { reset(); return }
    if (raw.length < 2) { reset(); return }
    const norm = raw.toLowerCase()
    if (cacheRef.current[norm]) {
      applyData(cacheRef.current[norm], norm)
    }
    const handle = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort()
      const controller = new AbortController()
      abortRef.current = controller
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('games')
          .select('id,name,year_published,thumbnail_url,rating')
          .ilike('name', `%${raw}%`)
          .order('rating', { ascending: false })
          .limit(30)
          .abortSignal(controller.signal as any)
        if (!error && data) {
          cacheRef.current[norm] = data as any
          applyData(data as any, norm)
        }
      } catch (e) {
        if ((e as any)?.name !== 'AbortError') reset()
      } finally { setLoading(false) }
    }, 130)
    return () => clearTimeout(handle)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  function applyData(data: SuggestionGame[], norm: string) {
    const exact = data.filter(g => g.name.toLowerCase() === norm).slice(0,3)
    const popular = data.filter(g => g.name.toLowerCase() !== norm && (g.rating||0) >= 7.5).slice(0,6)
    const other = data.filter(g => g.name.toLowerCase() !== norm && (g.rating||0) < 7.5).slice(0,10)
    const flatArr = [...exact, ...popular, ...other]
    setGrouped({ exactMatches: exact, popular, other })
    setFlat(flatArr)
    setActiveIndex(flatArr.length ? 0 : -1)
    setShow(true)
  }

  function reset() {
    setGrouped({ exactMatches: [], popular: [], other: [] })
    setFlat([])
    setShow(false)
    setActiveIndex(-1)
  }

  // Outside click close
  useEffect(() => {
    if (!show) return
    const onDown = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) && inputRef.current && !inputRef.current.contains(e.target as Node)) setShow(false)
    }
    window.addEventListener('mousedown', onDown)
    return () => window.removeEventListener('mousedown', onDown)
  }, [show])

  const highlight = (name: string) => {
    const tokens = query.toLowerCase().split(/\s+/).filter(t=>t.length>1)
    if(!tokens.length) return name
    const parts: React.ReactNode[] = []
    let i=0
    while (i < name.length) {
      let match: string | null = null
      for (const tk of tokens) { if (name.toLowerCase().startsWith(tk, i)) { match = name.slice(i, i+tk.length); break } }
      if (match) { parts.push(<span key={i} className="bg-yellow-200 dark:bg-yellow-600/40 rounded px-0.5">{match}</span>); i+=match.length } else { parts.push(name[i]); i++ }
    }
    return <>{parts}</>
  }

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!show || !flat.length) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => (i + 1) % flat.length) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(i => (i - 1 + flat.length) % flat.length) }
    else if (e.key === 'Enter') { if (activeIndex >=0 && flat[activeIndex]) { e.preventDefault(); handleSelect(flat[activeIndex]) } }
    else if (e.key === 'Escape') setShow(false)
  }

  function handleSelect(g: SuggestionGame) {
    onSelect(g)
    setQuery('')
    reset()
  }

  const hero = variant==='hero'
  return (
    <div className={cn('relative', className, hero && 'group') }>
      <div className={cn(
        'flex w-full items-center gap-3 rounded-full border bg-white/90 dark:bg-gray-900/70 backdrop-blur-sm transition shadow-sm hover:shadow-md focus-within:ring-2 focus-within:ring-sky-500',
        hero ? 'px-8 py-5 text-lg border-gray-200 dark:border-gray-700' : 'px-4 py-1.5 border-gray-200 dark:border-gray-700'
      )}>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e)=>{ setQuery(e.target.value); if (e.target.value) setShow(true) }}
          onKeyDown={onKey}
          onFocus={()=>{ if (flat.length) setShow(true) }}
          placeholder={placeholder}
          className={cn('flex-1 bg-transparent placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none', hero ? 'text-base leading-tight' : 'text-sm leading-tight')}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={show}
          aria-controls="game-suggestions"
          aria-activedescendant={activeIndex>=0 && show?`game-sugg-${activeIndex}`:undefined}
        />
        <button
          type="button"
          onClick={()=>{ if(query && flat.length && activeIndex>=0) { handleSelect(flat[activeIndex]) } else { inputRef.current?.focus(); setShow(true) } }}
          aria-label="Search"
          className={cn('shrink-0 rounded-full text-white flex items-center justify-center shadow-sm transition bg-sky-600 hover:bg-sky-600/90 active:bg-sky-700', hero ? 'h-14 w-14 text-xl' : 'h-8 w-8')}
        >
          <MagnifyingGlassIcon className={cn(hero ? 'h-7 w-7' : 'h-4.5 w-4.5')} />
        </button>
      </div>
      {show && (
        <div ref={dropdownRef} id="game-suggestions" role="listbox" className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl overflow-hidden max-h-[400px] overflow-y-auto z-50 text-sm">
          {loading && <div className="px-6 py-4 text-gray-500 dark:text-gray-400">Searching…</div>}
          {!loading && !flat.length && (
            <div className="px-6 py-6 text-center">
              <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center"><MagnifyingGlassIcon className="w-5 h-5 text-gray-400" /></div>
              <div className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">No games found</div>
              <div className="text-[11px] text-gray-400 dark:text-gray-500">Try another search term</div>
            </div>
          )}
          {!loading && flat.length > 0 && (
            <>
              {grouped.exactMatches.length > 0 && (
                <div className="border-b border-gray-100 dark:border-gray-800">
                  <div className="px-6 py-2 bg-gray-50 dark:bg-gray-800/50 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Exact Match</div>
                  {grouped.exactMatches.map((g,i)=> (
                    <SuggestionRow key={`e-${g.id}`} game={g} active={activeIndex===i} index={i} query={query} onSelect={handleSelect} onHover={()=>setActiveIndex(i)} highlight={highlight} />
                  ))}
                </div>
              )}
              {grouped.popular.length > 0 && (
                <div className="border-b border-gray-100 dark:border-gray-800">
                  <div className="px-6 py-2 bg-gray-50 dark:bg-gray-800/50 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 flex items-center gap-2"><TrophyIcon className="w-3.5 h-3.5" /> Popular</div>
                  {grouped.popular.map((g,i)=>{ const idx = grouped.exactMatches.length + i; return (
                    <SuggestionRow key={`p-${g.id}`} game={g} active={activeIndex===idx} index={idx} query={query} onSelect={handleSelect} onHover={()=>setActiveIndex(idx)} highlight={highlight} />
                  )})}
                </div>
              )}
              {grouped.other.length > 0 && (
                <div>
                  <div className="px-6 py-2 bg-gray-50 dark:bg-gray-800/50 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 flex items-center gap-2"><CubeIcon className="w-3.5 h-3.5" /> Other</div>
                  {grouped.other.map((g,i)=>{ const idx = grouped.exactMatches.length + grouped.popular.length + i; return (
                    <SuggestionRow key={`o-${g.id}`} game={g} active={activeIndex===idx} index={idx} query={query} onSelect={handleSelect} onHover={()=>setActiveIndex(idx)} highlight={highlight} />
                  )})}
                </div>
              )}
            </>
          )}
          <div className="border-t border-gray-100 dark:border-gray-800 px-6 py-2 text-[11px] text-gray-400 dark:text-gray-500">Enter to select • ↑↓ navigate • Esc close</div>
        </div>
      )}
    </div>
  )
}

function SuggestionRow({ game, active, index, query, onSelect, onHover, highlight }: { game: SuggestionGame; active: boolean; index: number; query: string; onSelect: (g: SuggestionGame)=>void; onHover: ()=>void; highlight:(n:string)=>React.ReactNode }) {
  return (
    <div id={`game-sugg-${index}`} role="option" aria-selected={active}>
      <button
        type="button"
        onMouseEnter={onHover}
        onMouseDown={(e)=>e.preventDefault()}
        onClick={()=>onSelect(game)}
        className={cn('w-full flex items-center gap-4 px-6 py-3 text-left transition-colors', active ? 'bg-primary-50 dark:bg-primary-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-800/60')}
      >
        {game.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={game.thumbnail_url} alt="" className="w-10 h-10 rounded-lg object-cover ring-1 ring-gray-200 dark:ring-gray-700" />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px] font-semibold text-gray-600 dark:text-gray-300">
            {game.name.slice(0,2).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{highlight(game.name)}</div>
          <div className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-2">
            {game.year_published && <span>{game.year_published}</span>}
            {game.rating != null && <span className="font-mono text-gray-400">{Number(game.rating).toFixed(1)}</span>}
          </div>
        </div>
      </button>
    </div>
  )
}
