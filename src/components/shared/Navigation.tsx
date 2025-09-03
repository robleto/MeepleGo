"use client"

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import NavItem from './NavItem'
import { cn } from '@/utils/helpers'
import { Button } from '@/design-system/elements/Button'
import {
  TrophyIcon,
  ChartBarIcon,
  CubeIcon as GamesIcon,
  ListBulletIcon,
  PlayIcon,
  MoonIcon,
  SunIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  CubeIcon,
  BookmarkIcon,
  HeartIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'

interface NavItem { name: string; href: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }
// Inline quick-add modal for missing game requests
function MissingGameQuickAdd({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [year, setYear] = useState('')
  const [publisher, setPublisher] = useState('')
  const [saving, setSaving] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  async function submit() {
    if (!name.trim()) return
    setSaving(true)
    try {
      await fetch('/api/missing-game-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), year: year? Number(year): null, publisher: publisher.trim()||null })
      }).catch(()=>{})
      setSubmitted(true)
      setTimeout(()=> { setOpen(false); onDone(); }, 1100)
    } finally { setSaving(false) }
  }
  return (
    <>
      <button onClick={()=> setOpen(true)} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition">
        <CubeIcon className="w-4 h-4 text-gray-400" /> Missing Game
      </button>
      {open && (
        <div className="fixed inset-0 z-[250] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4" onClick={()=> setOpen(false)}>
          <div className="bg-white dark:bg-gray-900 w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl p-6 relative" onClick={e=> e.stopPropagation()}>
            <button onClick={()=> setOpen(false)} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" aria-label="Close">×</button>
            <h3 className="text-base font-semibold mb-4">Add Missing Game</h3>
            {!submitted && (
              <div className="space-y-4">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-[11px] uppercase tracking-wide text-gray-500">Name</span>
                  <input value={name} onChange={e=> setName(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500 bg-white/80" placeholder="Game title" />
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="text-[11px] uppercase tracking-wide text-gray-500">Year</span>
                    <input value={year} onChange={e=> setYear(e.target.value)} type="number" className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500 bg-white/80" placeholder="2024" />
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="text-[11px] uppercase tracking-wide text-gray-500">Publisher</span>
                    <input value={publisher} onChange={e=> setPublisher(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500 bg-white/80" placeholder="Publisher" />
                  </label>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button 
                    disabled={saving || !name.trim()} 
                    onClick={submit} 
                    variant="primary" 
                    size="sm"
                    loading={saving}
                  >
                    Submit
                  </Button>
                  <Button 
                    onClick={()=> setOpen(false)} 
                    variant="ghost" 
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
            {submitted && (
              <div className="p-4 border border-green-200 rounded-lg bg-green-50 text-sm text-green-700">Thanks! We'll review and import it soon.</div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
const NAV_ITEMS: NavItem[] = [
  { name: 'Awards', href: '/awards', icon: TrophyIcon },
  { name: 'Games', href: '/games', icon: GamesIcon },
  { name: 'Lists', href: '/lists', icon: ListBulletIcon },
  { name: 'Journal', href: '/plays', icon: PlayIcon },
]

interface SuggestionGame { id: number; name: string; year_published: number | null; thumbnail_url: string | null; rating?: number | null }
interface GroupedSuggestions { exactMatches: SuggestionGame[]; popular: SuggestionGame[]; other: SuggestionGame[] }

function SuggestionItem({ game, active, index, query, onSelect, onHover }: { game: SuggestionGame; active: boolean; index: number; query: string; onSelect: (g: SuggestionGame)=>void; onHover: ()=>void }) {
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
  return (
    <div id={`nav-sugg-${index}`} role="option" aria-selected={active}>
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

function Navigation() {
  let pathname: string;
  let router: any;
  try {
    pathname = usePathname();
    router = useRouter();
  } catch {
    // Fallback for Storybook or other environments without Next.js router
    pathname = '/';
    router = {
      push: () => {},
      replace: () => {},
      back: () => {},
      forward: () => {},
      refresh: () => {},
      prefetch: () => {},
    };
  }
  const [session, setSession] = useState<import('@supabase/supabase-js').Session | null>(null)
  const [profile, setProfile] = useState<{ username?: string; full_name?: string; avatar_url?: string } | null>(null)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [themeMode, setThemeMode] = useState<'system'|'light'|'dark'>(()=>{
    if (typeof window === 'undefined') return 'system'
    return (localStorage.getItem('themeMode') as any) || 'system'
  })
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showAddMenu, setShowAddMenu] = useState(false)
  // Refs for outside click detection of dropdown menus
  const addMenuRef = useRef<HTMLDivElement | null>(null)
  const addButtonRef = useRef<HTMLButtonElement | null>(null)
  const userMenuRef = useRef<HTMLDivElement | null>(null)
  const userButtonRef = useRef<HTMLButtonElement | null>(null)

  // Scroll hide/show
  const [visible, setVisible] = useState(true)
  const [scrolled, setScrolled] = useState(false)
  const lastY = useRef(0)

  // Search state
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

  // Session/profile
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session?.user) {
        supabase.from('profiles').select('username, full_name, avatar_url').eq('id', data.session.user.id).single().then(({ data: p }) => p && setProfile(p))
      }
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
      if (s?.user) {
        supabase.from('profiles').select('username, full_name, avatar_url').eq('id', s.user.id).single().then(({ data: p }) => p && setProfile(p))
      } else setProfile(null)
    })
    return () => { sub?.subscription?.unsubscribe() }
  }, [])

  // Scroll logic
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setScrolled(y > 8)
      const last = lastY.current
      if (y < 8) setVisible(true)
      else if (y > last && y > 120) setVisible(false)
      else if (y < last) setVisible(true)
      lastY.current = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Dark mode init
  useEffect(() => {
    const saved = localStorage.getItem('darkMode')
    if (saved) {
      const val = JSON.parse(saved)
      setIsDarkMode(val)
      document.documentElement.classList.toggle('dark', val)
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true)
      document.documentElement.classList.add('dark')
    }
  }, [])
  const applyTheme = (mode: 'system'|'light'|'dark') => {
    const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const dark = mode === 'dark' || (mode === 'system' && sysDark)
    document.documentElement.classList.toggle('dark', dark)
    setIsDarkMode(dark)
  }
  const setTheme = (mode: 'system'|'light'|'dark') => {
    setThemeMode(mode)
    localStorage.setItem('themeMode', mode)
    applyTheme(mode)
  }
  useEffect(()=>{ if (typeof window !== 'undefined') applyTheme(themeMode) }, [])
  useEffect(()=>{
    if (themeMode==='system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const listener = () => applyTheme('system')
      mq.addEventListener('change', listener)
      return ()=> mq.removeEventListener('change', listener)
    }
  }, [themeMode])

  // Fetch suggestions (debounced, cached, abortable)
  useEffect(() => {
    const raw = query.trim()
    if (!raw) { setGrouped({ exactMatches: [], popular: [], other: [] }); setFlat([]); setShow(false); setActiveIndex(-1); return }
    if (raw.length < 2) { // avoid noisy 1-char searches
      setGrouped({ exactMatches: [], popular: [], other: [] }); setFlat([]); setShow(false); setActiveIndex(-1); return
    }
    const norm = raw.toLowerCase()

    // Serve from cache instantly if available
    if (cacheRef.current[norm]) {
      const data = cacheRef.current[norm]
      const exact = data.filter(g => g.name.toLowerCase() === norm)
      const popular = data.filter(g => g.name.toLowerCase() !== norm && (g.rating||0) >= 7.5).slice(0,8)
      const other = data.filter(g => g.name.toLowerCase() !== norm && (g.rating||0) < 7.5).slice(0,12)
      const flatArr = [...exact, ...popular, ...other]
      setGrouped({ exactMatches: exact, popular, other })
      setFlat(flatArr); setActiveIndex(flatArr.length ? 0 : -1); setShow(true)
      // Continue to refresh in background (stale-while-revalidate)
    }

    const handle = setTimeout(async () => {
      // Abort previous
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
          cacheRef.current[norm] = data
          const exact = data.filter(g => g.name.toLowerCase() === norm)
            .slice(0,3)
          const popular = data.filter(g => g.name.toLowerCase() !== norm && (g.rating||0) >= 7.5).slice(0,6)
          const other = data.filter(g => g.name.toLowerCase() !== norm && (g.rating||0) < 7.5).slice(0,10)
          const flatArr = [...exact, ...popular, ...other]
          setGrouped({ exactMatches: exact, popular, other })
          setFlat(flatArr)
          setActiveIndex(prev => prev === -1 ? (flatArr.length ? 0 : -1) : Math.min(prev, flatArr.length - 1))
          setShow(true)
        }
      } catch (e) {
        if ((e as any)?.name !== 'AbortError') {
          setGrouped({ exactMatches: [], popular: [], other: [] }); setFlat([])
        }
      } finally { setLoading(false) }
    }, 120)
    return () => clearTimeout(handle)
  }, [query])

  // Close on outside click
  useEffect(() => {
    if (!show) return
    const onDown = (e: MouseEvent) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) && inputRef.current && !inputRef.current.contains(e.target as Node)) setShow(false) }
    window.addEventListener('mousedown', onDown)
    return () => window.removeEventListener('mousedown', onDown)
  }, [show])

  const selectGame = (g: SuggestionGame) => {
    setShow(false); setGrouped({ exactMatches: [], popular: [], other: [] }); setFlat([]); setQuery(''); setActiveIndex(-1)
    router.push(`/games?gameId=${g.id}`)
  }

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!show || !flat.length) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => (i + 1) % flat.length) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(i => (i - 1 + flat.length) % flat.length) }
    else if (e.key === 'Enter') { if (activeIndex >=0 && flat[activeIndex]) { e.preventDefault(); selectGame(flat[activeIndex]) } }
    else if (e.key === 'Escape') setShow(false)
  }

  const signOut = async () => { await supabase.auth.signOut(); setShowUserMenu(false); router.refresh() }

  // Close dropdown menus on outside click or Escape
  useEffect(() => {
    if (!showAddMenu && !showUserMenu) return
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (showAddMenu) {
        if (
          addMenuRef.current &&
          !addMenuRef.current.contains(target) &&
          addButtonRef.current &&
          !addButtonRef.current.contains(target)
        ) {
          setShowAddMenu(false)
        }
      }
      if (showUserMenu) {
        if (
          userMenuRef.current &&
          !userMenuRef.current.contains(target) &&
          userButtonRef.current &&
          !userButtonRef.current.contains(target)
        ) {
          setShowUserMenu(false)
        }
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showAddMenu) setShowAddMenu(false)
        if (showUserMenu) setShowUserMenu(false)
      }
    }
    window.addEventListener('mousedown', onPointerDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onPointerDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [showAddMenu, showUserMenu])

  return (
    <nav
      aria-label="Primary navigation"
      className={cn(
        'fixed inset-x-0 top-0 z-50 backdrop-blur-md transition-[transform,background,backdrop-filter] duration-300',
        scrolled ? 'bg-white/80 dark:bg-gray-950/70 shadow-sm border-b border-gray-200/60 dark:border-gray-800/60' : 'bg-white/55 dark:bg-gray-950/55',
        visible ? 'translate-y-0' : '-translate-y-full'
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center gap-4">
          <Link href="/" aria-label="Home" className="flex items-center gap-2 flex-shrink-0 group">
            {/* Brand Logo Image */}
            <img src="/meeplego.svg" alt="MeepleGo" className="h-10 w-10 rounded-xl shadow-sm ring-1 ring-white/50 dark:ring-white/10 object-contain bg-white/90 dark:bg-gray-900/60" />
            <span className="heading-display text-2xl font-semibold tracking-normal leading-none">
              <span className="text-gray-900 dark:text-gray-100">Meeple</span>
              <span className="ml-0.5 text-[#096EC2] dark:text-[#2695E2]">Go</span>
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map(item => {
              const active = pathname === item.href
              return (
                <NavItem
                  key={item.href}
                  name={item.name}
                  href={item.href}
                  icon={item.icon}
                  isActive={active}
                />
              )
            })}
          </div>
          <div className="flex-1 hidden md:block" />
          {/* Search (Airbnb-style pill, compact) - TEMPORARILY COMMENTED OUT 
          <div className="hidden md:flex relative w-full max-w-lg">
            <div className="flex w-full items-center gap-2 rounded-full border border-gray-200 dark:border-gray-700 bg-white/85 dark:bg-gray-900/70 px-4 py-1.5 shadow-sm hover:shadow-md backdrop-blur-sm transition focus-within:ring-2 focus-within:ring-primary-500">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e)=>{ setQuery(e.target.value); if (e.target.value) setShow(true) }}
                onKeyDown={onKey}
                onFocus={()=>{ if (flat.length) setShow(true) }}
                placeholder="Start for games"
                className="flex-1 bg-transparent placeholder-gray-400 dark:placeholder-gray-500 text-sm leading-tight focus:outline-none"
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={show}
                aria-controls="nav-suggestions"
                aria-activedescendant={activeIndex>=0 && show?`nav-sugg-${activeIndex}`:undefined}
              />
              <button
                type="button"
                onClick={()=>{ if(query && flat.length && activeIndex>=0) { selectGame(flat[activeIndex]) } else { inputRef.current?.focus(); setShow(true) } }}
                aria-label="Search"
                className="shrink-0 h-9 w-9 rounded-full bg-primary-600 hover:bg-primary-600/90 active:bg-primary-700 text-white flex items-center justify-center shadow-sm transition"
              >
                <MagnifyingGlassIcon className="h-5 w-5" />
              </button>
            </div>
            {show && (
              <div ref={dropdownRef} id="nav-suggestions" role="listbox" className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl overflow-hidden max-h-[400px] overflow-y-auto z-50 text-sm">
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
                        {grouped.exactMatches.map((g,i)=> <SuggestionItem key={`e-${g.id}`} game={g} active={activeIndex===i} index={i} query={query} onSelect={selectGame} onHover={()=>setActiveIndex(i)} />)}
                      </div>
                    )}
                    {grouped.popular.length > 0 && (
                      <div className="border-b border-gray-100 dark:border-gray-800">
                        <div className="px-6 py-2 bg-gray-50 dark:bg-gray-800/50 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 flex items-center gap-2"><TrophyIcon className="w-3.5 h-3.5" /> Popular</div>
                        {grouped.popular.map((g,i)=>{ const idx = grouped.exactMatches.length + i; return <SuggestionItem key={`p-${g.id}`} game={g} active={activeIndex===idx} index={idx} query={query} onSelect={selectGame} onHover={()=>setActiveIndex(idx)} /> })}
                      </div>
                    )}
                    {grouped.other.length > 0 && (
                      <div>
                        <div className="px-6 py-2 bg-gray-50 dark:bg-gray-800/50 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 flex items-center gap-2"><CubeIcon className="w-3.5 h-3.5" /> Other</div>
                        {grouped.other.map((g,i)=>{ const idx = grouped.exactMatches.length + grouped.popular.length + i; return <SuggestionItem key={`o-${g.id}`} game={g} active={activeIndex===idx} index={idx} query={query} onSelect={selectGame} onHover={()=>setActiveIndex(idx)} /> })}
                      </div>
                    )}
                  </>
                )}
                <div className="border-t border-gray-100 dark:border-gray-800">
                  <div className="px-6 py-2 text-[11px] text-gray-400 dark:text-gray-500">Press Enter to search • ↑↓ navigate</div>
                  <div className="px-6 py-2 text-center">
                    <Link href="/add" onClick={()=>{ setShow(false); setQuery('') }} className="text-xs text-gray-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Can't find your game? Add it here</Link>
                  </div>
                </div>
              </div>
            )}
          </div>
          */}
          
          {/* Actions */}
          <div className="flex items-center gap-2 relative" ref={addMenuRef}>
            <Button
              ref={addButtonRef}
              onClick={()=> setShowAddMenu(o=>!o)}
              variant="ghost"
              size="sm"
              shape="square"
              leftIcon={<PlusIcon className="h-5 w-5" />}
              aria-label="Add"
              aria-haspopup="menu"
              aria-expanded={showAddMenu}
            />
            {showAddMenu && (
              <div className="absolute right-full mr-2 top-0 mt-10 w-60 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl p-2 z-50" role="menu">
                <div className="text-[11px] uppercase tracking-wide font-semibold text-gray-500 dark:text-gray-400 px-2 pb-1">Quick Add</div>
                <button onClick={()=>{ setShowAddMenu(false); router.push('/plays/new') }} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                  <PlayIcon className="w-4 h-4 text-gray-400" /> Log a Play
                </button>
                <button onClick={()=>{ setShowAddMenu(false); router.push('/lists') }} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                  <ListBulletIcon className="w-4 h-4 text-gray-400" /> New List
                </button>
                <MissingGameQuickAdd onDone={()=> setShowAddMenu(false)} />
              </div>
            )}
            <div className="relative">
              {session ? (
                <>
                  <button ref={userButtonRef} onClick={()=>setShowUserMenu(v=>!v)} aria-haspopup="menu" aria-expanded={showUserMenu} className="flex items-center gap-2 rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title={profile?.full_name || profile?.username || session.user.email || 'Profile'}>
                    {profile?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={profile.avatar_url} alt="Profile" className="w-8 h-8 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-700" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-sm font-medium ring-2 ring-gray-200 dark:ring-gray-700">{(profile?.username || profile?.full_name || session.user.email || 'U').charAt(0).toUpperCase()}</div>
                    )}
                    <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300 max-w-24 truncate">{profile?.username || profile?.full_name || 'Profile'}</span>
                  </button>
                  {showUserMenu && (
                    <div ref={userMenuRef} className="absolute right-0 mt-2 w-64 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl py-2 text-sm z-50" role="menu">
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                        <div className="font-medium text-gray-900 dark:text-white truncate">{profile?.full_name || profile?.username || 'User'}</div>
                        <div className="text-gray-500 dark:text-gray-400 truncate text-xs">{session?.user.email}</div>
                      </div>
                      <Link href="/profile" className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"><UserCircleIcon className="h-4 w-4 text-gray-400" /> Profile</Link>
                      <Link href="/rankings" className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"><ChartBarIcon className="h-4 w-4 text-gray-400" /> Rankings</Link>
                      <Link href="/library" className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"><BookmarkIcon className="h-4 w-4 text-green-600" /> Library</Link>
                      <Link href="/wishlist" className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"><HeartIcon className="h-4 w-4 text-pink-600" /> Wishlist</Link>
                      <Link href="/settings" className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"><ListBulletIcon className="h-4 w-4 text-gray-400" /> Settings</Link>
                      <div className="px-4 pt-3 pb-2">
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Theme</div>
                        <div className="grid grid-cols-3 gap-2">
                          {(['system','light','dark'] as const).map(m => (
                            <button key={m} onClick={()=> setTheme(m)} className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-[11px] font-medium border transition ${themeMode===m ? 'border-primary-500 text-primary-600 bg-primary-50' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>{m==='system'?<span className="flex items-center gap-1"><SunIcon className="w-3.5 h-3.5" /><MoonIcon className="w-3.5 h-3.5" /></span>: m==='light'?<SunIcon className="w-4 h-4" />:<MoonIcon className="w-4 h-4" />}</button>
                          ))}
                        </div>
                      </div>
                      <hr className="my-1 border-gray-100 dark:border-gray-800" />
                      <button onClick={signOut} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-red-600 dark:text-red-400"><ArrowRightOnRectangleIcon className="h-4 w-4" /> Sign out</button>
                    </div>
                  )}
                </>
              ) : (
                <Link href="/login">
                  <Button variant="primary" size="sm">
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default React.memo(Navigation)
