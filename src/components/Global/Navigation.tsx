'use client'

import React, { useEffect, useRef, useState } from 'react'
import Portal from '@/components/Elements/Portal'
import Overlay from '@/components/Elements/Overlay'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import NavItem from '../Elements/NavItem'
import { cn } from '@/utils/helpers'
import { Button } from '../Elements/Button'
import Logo from '../Foundations/Logo'
import dynamic from 'next/dynamic'
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
  XMarkIcon,
  PlusIcon,
  ChatBubbleLeftIcon,
} from '@heroicons/react/24/outline'

// Dynamic imports for heavy components
const PlayLogEditor = dynamic(
  () => import('@/components/Components/PlayLogEditor'),
  {
    loading: () => (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    ),
  }
)

interface NavLinkItem {
  name: string
  href: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}
const NAV_ITEMS: NavLinkItem[] = [
  { name: 'Awards', href: '/awards', icon: TrophyIcon },
  { name: 'Games', href: '/games', icon: GamesIcon },
  { name: 'Lists', href: '/lists', icon: ListBulletIcon },
  { name: 'Journal', href: '/plays', icon: PlayIcon },
]

interface SuggestionGame {
  id: number
  name: string
  year_published: number | null
  thumbnail_url: string | null
  rating?: number | null
}
interface GroupedSuggestions {
  exactMatches: SuggestionGame[]
  popular: SuggestionGame[]
  other: SuggestionGame[]
}

function SuggestionItem({
  game,
  active,
  index,
  query,
  onSelect,
  onHover,
}: {
  game: SuggestionGame
  active: boolean
  index: number
  query: string
  onSelect: (g: SuggestionGame) => void
  onHover: () => void
}) {
  const highlight = (name: string) => {
    const tokens = query
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 1)
    if (!tokens.length) return name
    const parts: React.ReactNode[] = []
    let i = 0
    while (i < name.length) {
      let match: string | null = null
      for (const tk of tokens) {
        if (name.toLowerCase().startsWith(tk, i)) {
          match = name.slice(i, i + tk.length)
          break
        }
      }
      if (match) {
        parts.push(
          <span
            key={i}
            className="bg-yellow-200 dark:bg-yellow-600/40 rounded px-0.5"
          >
            {match}
          </span>
        )
        i += match.length
      } else {
        parts.push(name[i])
        i++
      }
    }
    return <>{parts}</>
  }
  return (
    <button
      id={`nav-sugg-${index}`}
      role="option"
      aria-selected={active}
      type="button"
      onMouseEnter={onHover}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => onSelect(game)}
      className={cn(
        'w-full flex items-center gap-4 px-6 py-3 text-left transition-colors',
        active
          ? 'bg-primary-50 dark:bg-primary-900/30'
          : 'hover:bg-gray-50 dark:hover:bg-gray-800/60'
      )}
    >
        {game.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={game.thumbnail_url}
            alt=""
            className="w-10 h-10 rounded-lg object-cover ring-1 ring-gray-200 dark:ring-gray-700"
          />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px] font-semibold text-gray-600 dark:text-gray-300">
            {game.name.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {highlight(game.name)}
          </div>
          <div className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-2">
            {game.year_published && <span>{game.year_published}</span>}
            {game.rating != null && (
              <span className="font-mono text-gray-400">
                {Number(game.rating).toFixed(1)}
              </span>
            )}
          </div>
        </div>
    </button>
  )
}

function Navigation() {
  // Always call hooks unconditionally.
  const pathname = usePathname() || '/'
  const router = useRouter()
  const [session, setSession] = useState<
    import('@supabase/supabase-js').Session | null
  >(null)
  const [profile, setProfile] = useState<{
    username?: string
    full_name?: string
    avatar_url?: string
  } | null>(null)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [themeMode, setThemeMode] = useState<'system' | 'light' | 'dark'>(
    () => {
      if (typeof window === 'undefined') return 'system'
      return (localStorage.getItem('themeMode') as any) || 'system'
    }
  )
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showAddMenu, setShowAddMenu] = useState(false)
  // Refs for outside click detection of dropdown menus
  const addMenuRef = useRef<HTMLDivElement | null>(null)
  const addButtonRef = useRef<HTMLButtonElement | null>(null)
  const userMenuRef = useRef<HTMLDivElement | null>(null)
  const userButtonRef = useRef<HTMLButtonElement | null>(null)

  // Modal states
  const [showPlayLogModal, setShowPlayLogModal] = useState(false)
  const [showCreateListModal, setShowCreateListModal] = useState(false)
  const [showAddGameModal, setShowAddGameModal] = useState(false)
  const [selectedGameForPlayLog, setSelectedGameForPlayLog] = useState<{
    id: string
    name: string
  } | null>(null)

  // Create list form state
  const [listName, setListName] = useState('')
  const [isCreatingList, setIsCreatingList] = useState(false)

  // Add game form state
  const [gameName, setGameName] = useState('')
  const [gameYear, setGameYear] = useState('')
  const [gamePublisher, setGamePublisher] = useState('')
  const [isSubmittingGame, setIsSubmittingGame] = useState(false)
  const [gameSubmitted, setGameSubmitted] = useState(false)

  // Create list function
  const handleCreateList = async () => {
    if (!listName.trim() || isCreatingList) return

    setIsCreatingList(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase.from('lists').insert({
        name: listName.trim(),
        user_id: user.id,
        is_public: false,
      })

      if (!error) {
        setListName('')
        setShowCreateListModal(false)
        router.refresh()
      }
    } catch (error) {
      console.error('Error creating list:', error)
    } finally {
      setIsCreatingList(false)
    }
  }

  // Add game function
  const handleAddGame = async () => {
    if (!gameName.trim() || isSubmittingGame) return

    setIsSubmittingGame(true)
    try {
      await fetch('/api/missing-game-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: gameName.trim(),
          year: gameYear ? Number(gameYear) : null,
          publisher: gamePublisher.trim() || null,
        }),
      }).catch(() => {})
      setGameSubmitted(true)
      setTimeout(() => {
        setShowAddGameModal(false)
        setGameName('')
        setGameYear('')
        setGamePublisher('')
        setGameSubmitted(false)
      }, 1100)
    } finally {
      setIsSubmittingGame(false)
    }
  }

  // Scroll hide/show
  const [visible, setVisible] = useState(true)
  const [scrolled, setScrolled] = useState(false)
  const lastY = useRef(0)

  // Search state
  const [query, setQuery] = useState('')
  const [grouped, setGrouped] = useState<GroupedSuggestions>({
    exactMatches: [],
    popular: [],
    other: [],
  })
  const [flat, setFlat] = useState<SuggestionGame[]>([])
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const dropdownRef = useRef<HTMLDivElement | null>(null)
  const cacheRef = useRef<Record<string, SuggestionGame[]>>({})
  const abortRef = useRef<AbortController | null>(null)

  // Moving highlighter refs/state
  const navContainerRef = useRef<HTMLDivElement | null>(null)
  const highlighterRef = useRef<HTMLDivElement | null>(null)
  const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({})

  const moveHighlighterTo = (el: HTMLAnchorElement | null) => {
    const highlighter = highlighterRef.current
    const container = navContainerRef.current
    if (!highlighter || !container || !el) {
      if (highlighter) highlighter.style.opacity = '0'
      return
    }
    const cRect = container.getBoundingClientRect()
    const r = el.getBoundingClientRect()
    const left = r.left - cRect.left
    const width = r.width
    // Slight vertical inset for a pill look
    highlighter.style.opacity = '1'
    highlighter.style.transform = `translateX(${left}px)`
    highlighter.style.width = `${width}px`
  }

  // Update on route changes to the active link
  useEffect(() => {
    const activeLink = linkRefs.current[pathname]
    // Delay until after layout so refs have sizes
    requestAnimationFrame(() => moveHighlighterTo(activeLink || null))
  }, [pathname])

  // Session/profile
  useEffect(() => {
    ;(async () => {
      try {
        const { data } = await supabase.auth.getSession()
        setSession(data.session)
        if (data.session?.user) {
          supabase
            .from('profiles')
            .select('username, full_name, avatar_url')
            .eq('id', data.session.user.id)
            .single()
            .then(({ data: p }) => p && setProfile(p))
        }
      } catch {
        /* noop */
      }
    })()
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
      if (s?.user) {
        supabase
          .from('profiles')
          .select('username, full_name, avatar_url')
          .eq('id', s.user.id)
          .single()
          .then(({ data: p }) => p && setProfile(p))
      } else setProfile(null)
    })
    return () => {
      sub?.subscription?.unsubscribe()
    }
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
  const applyTheme = (mode: 'system' | 'light' | 'dark') => {
    const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const dark = mode === 'dark' || (mode === 'system' && sysDark)
    document.documentElement.classList.toggle('dark', dark)
    setIsDarkMode(dark)
  }
  const setTheme = (mode: 'system' | 'light' | 'dark') => {
    setThemeMode(mode)
    localStorage.setItem('themeMode', mode)
    applyTheme(mode)
  }
  useEffect(() => {
    if (typeof window !== 'undefined') applyTheme(themeMode)
  }, [])
  useEffect(() => {
    if (themeMode === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const listener = () => applyTheme('system')
      mq.addEventListener('change', listener)
      return () => mq.removeEventListener('change', listener)
    }
  }, [themeMode])

  // Fetch suggestions (debounced, cached, abortable)
  useEffect(() => {
    const raw = query.trim()
    if (!raw) {
      setGrouped({ exactMatches: [], popular: [], other: [] })
      setFlat([])
      setShow(false)
      setActiveIndex(-1)
      return
    }
    if (raw.length < 2) {
      // avoid noisy 1-char searches
      setGrouped({ exactMatches: [], popular: [], other: [] })
      setFlat([])
      setShow(false)
      setActiveIndex(-1)
      return
    }
    const norm = raw.toLowerCase()

    // Serve from cache instantly if available
    if (cacheRef.current[norm]) {
      const data = cacheRef.current[norm]
      const exact = data.filter((g) => g.name.toLowerCase() === norm)
      const popular = data
        .filter((g) => g.name.toLowerCase() !== norm && (g.rating || 0) >= 7.5)
        .slice(0, 8)
      const other = data
        .filter((g) => g.name.toLowerCase() !== norm && (g.rating || 0) < 7.5)
        .slice(0, 12)
      const flatArr = [...exact, ...popular, ...other]
      setGrouped({ exactMatches: exact, popular, other })
      setFlat(flatArr)
      setActiveIndex(flatArr.length ? 0 : -1)
      setShow(true)
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
          const exact = data
            .filter((g) => g.name.toLowerCase() === norm)
            .slice(0, 3)
          const popular = data
            .filter(
              (g) => g.name.toLowerCase() !== norm && (g.rating || 0) >= 7.5
            )
            .slice(0, 6)
          const other = data
            .filter(
              (g) => g.name.toLowerCase() !== norm && (g.rating || 0) < 7.5
            )
            .slice(0, 10)
          const flatArr = [...exact, ...popular, ...other]
          setGrouped({ exactMatches: exact, popular, other })
          setFlat(flatArr)
          setActiveIndex((prev) =>
            prev === -1
              ? flatArr.length
                ? 0
                : -1
              : Math.min(prev, flatArr.length - 1)
          )
          setShow(true)
        }
      } catch (e) {
        if ((e as any)?.name !== 'AbortError') {
          setGrouped({ exactMatches: [], popular: [], other: [] })
          setFlat([])
        }
      } finally {
        setLoading(false)
      }
    }, 120)
    return () => clearTimeout(handle)
  }, [query])

  // Close on outside click
  useEffect(() => {
    if (!show) return
    const onDown = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      )
        setShow(false)
    }
    window.addEventListener('mousedown', onDown)
    return () => window.removeEventListener('mousedown', onDown)
  }, [show])

  const selectGame = (g: SuggestionGame) => {
    setShow(false)
    setGrouped({ exactMatches: [], popular: [], other: [] })
    setFlat([])
    setQuery('')
    setActiveIndex(-1)
    router.push(`/games?gameId=${g.id}`)
  }

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!show || !flat.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => (i + 1) % flat.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => (i - 1 + flat.length) % flat.length)
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && flat[activeIndex]) {
        e.preventDefault()
        selectGame(flat[activeIndex])
      }
    } else if (e.key === 'Escape') setShow(false)
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setShowUserMenu(false)
    router.refresh()
  }

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
        'fixed inset-x-0 top-0 z-50 transition-[transform] duration-300',
        visible ? 'translate-y-0' : '-translate-y-full'
      )}
    >
      {/* Background layer to ensure sticky nav has a visible backdrop over content */}
      <div
        aria-hidden
        className={cn(
          'absolute inset-0 pointer-events-none border-b z-0',
          'backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:supports-[backdrop-filter]:bg-gray-900/60',
          'bg-white/90 dark:bg-gray-900/90',
          'border-gray-200/70 dark:border-white/10'
        )}
      />
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center gap-4">
          <Logo size="lg" href="/" className="flex-shrink-0" />

          {/* Reawarding-style nav container */}
          <div className="hidden md:block min-w-0">
            <div
              ref={navContainerRef}
              className="relative rounded-2xl px-2 backdrop-blur-xl shadow-[0_6px_30px_rgba(0,0,0,0.06)] border bg-white/60 dark:bg-black/30 border-gray-200/60 dark:border-white/10"
              onMouseLeave={() => {
                const active = linkRefs.current[pathname] || null
                moveHighlighterTo(active)
              }}
            >
              {/* Animated highlighter */}
              <div
                ref={highlighterRef}
                className="absolute left-0 rounded-xl pointer-events-none border transition-all duration-300 ease-out will-change-[transform,width]"
                style={{
                  top: 6,
                  bottom: 6,
                  opacity: 0,
                  width: 0,
                  transform: 'translate3d(0,0,0)',
                  backgroundColor: 'rgba(224, 242, 254, 0.7)', // sky-100 with subtle opacity
                  borderColor: 'rgba(186, 230, 253, 0.6)', // sky-200 border for definition
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6), 0 6px 12px rgba(0,0,0,0.06)'
                }}
                aria-hidden="true"
              />
              <ul className="flex items-center font-medium text-xs font-inter relative z-10">
                {NAV_ITEMS.map((item) => {
                  const active = pathname === item.href
                  return (
                    <li key={item.href}>
                      <Link
                        ref={(el) => {
                          linkRefs.current[item.href] = el
                        }}
                        onMouseEnter={(e) => moveHighlighterTo(e.currentTarget)}
                        className={cn(
                          'block px-4 py-2.5 relative transition-colors duration-200 rounded-lg text-center',
                          active
                            ? 'text-gray-900 dark:text-gray-100'
                            : 'text-black dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                        )}
                        href={item.href}
                      >
                        {item.name}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
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
              onClick={() => setShowAddMenu((o) => !o)}
              variant="ghost"
              size="sm"
              shape="square"
              leftIcon={<PlusIcon className="h-5 w-5" />}
              aria-label="Add"
              aria-haspopup="menu"
              aria-expanded={showAddMenu}
            />
            {showAddMenu && (
              <div
                className="absolute right-full mr-2 top-0 mt-10 w-60 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl p-2 z-50"
                role="menu"
              >
                <div className="text-[11px] uppercase tracking-wide font-semibold text-gray-500 dark:text-gray-400 px-2 pb-1">
                  Quick Add
                </div>
                <button
                  onClick={() => {
                    setShowAddMenu(false)
                    setShowPlayLogModal(true)
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  <PlayIcon className="w-4 h-4 text-gray-400" /> Log a Play
                </button>
                <button
                  onClick={() => {
                    setShowAddMenu(false)
                    setShowCreateListModal(true)
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  <ListBulletIcon className="w-4 h-4 text-gray-400" /> New List
                </button>
                <button
                  onClick={() => {
                    setShowAddGameModal(true)
                    setShowAddMenu(false)
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  <CubeIcon className="w-4 h-4 text-gray-400" /> Missing Game
                </button>
              </div>
            )}
            <div className="relative">
              {session ? (
                <>
                  <button
                    ref={userButtonRef}
                    onClick={() => setShowUserMenu((v) => !v)}
                    aria-haspopup="menu"
                    aria-expanded={showUserMenu}
                    className="flex items-center gap-2 rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    title={
                      profile?.full_name ||
                      profile?.username ||
                      session.user.email ||
                      'Profile'
                    }
                  >
                    {profile?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={profile.avatar_url}
                        alt="Profile"
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-700"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-sm font-medium ring-2 ring-gray-200 dark:ring-gray-700">
                        {(
                          profile?.username ||
                          profile?.full_name ||
                          session.user.email ||
                          'U'
                        )
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                    )}
                    <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300 max-w-24 truncate">
                      {profile?.username || profile?.full_name || 'Profile'}
                    </span>
                  </button>
                  {showUserMenu && (
                    <div
                      ref={userMenuRef}
                      className="absolute right-0 mt-2 w-64 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl py-2 text-sm z-50"
                      role="menu"
                    >
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                        <div className="font-medium text-gray-900 dark:text-white truncate">
                          {profile?.full_name || profile?.username || 'User'}
                        </div>
                        <div className="text-gray-500 dark:text-gray-400 truncate text-xs">
                          {session?.user.email}
                        </div>
                      </div>
                      <Link
                        href="/profile"
                        className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <UserCircleIcon className="h-4 w-4 text-gray-400" />{' '}
                        Profile
                      </Link>
                      <Link
                        href="/rankings"
                        className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <ChartBarIcon className="h-4 w-4 text-gray-400" />{' '}
                        Rankings
                      </Link>
                      <Link
                        href="/library"
                        className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <BookmarkIcon className="h-4 w-4 text-green-600" />{' '}
                        Library
                      </Link>
                      <Link
                        href="/wishlist"
                        className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <HeartIcon className="h-4 w-4 text-pink-600" /> Wishlist
                      </Link>
                      <Link
                        href="/settings"
                        className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <ListBulletIcon className="h-4 w-4 text-gray-400" />{' '}
                        Settings
                      </Link>
                      <a
                        href="mailto:feedback@meeplego.com?subject=MeepleGo%20Feedback"
                        className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <ChatBubbleLeftIcon className="h-4 w-4 text-blue-600" />{' '}
                        Send Feedback
                      </a>
                      <div className="px-4 pt-3 pb-2">
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
                          Theme
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {(['system', 'light', 'dark'] as const).map((m) => (
                            <button
                              key={m}
                              onClick={() => setTheme(m)}
                              className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-[11px] font-medium border transition ${themeMode === m ? 'border-primary-500 text-primary-600 bg-primary-50' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300'}`}
                            >
                              {m === 'system' ? (
                                <span className="flex items-center gap-1">
                                  <SunIcon className="w-3.5 h-3.5" />
                                  <MoonIcon className="w-3.5 h-3.5" />
                                </span>
                              ) : m === 'light' ? (
                                <SunIcon className="w-4 h-4" />
                              ) : (
                                <MoonIcon className="w-4 h-4" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                      <hr className="my-1 border-gray-100 dark:border-gray-800" />
                      <button
                        onClick={signOut}
                        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-red-600 dark:text-red-400"
                      >
                        <ArrowRightOnRectangleIcon className="h-4 w-4" /> Sign
                        out
                      </button>
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

      {/* Play Log Modal */}
      <Portal>
        <Overlay
          visible={showPlayLogModal}
          variant="blur"
          clickToClose={false}
          zIndex={200}
          className="p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowPlayLogModal(false)
            }
          }}
        >
          <div
            className="bg-white dark:bg-gray-900 w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold">Log Your Play</h3>
              <button
                onClick={() => setShowPlayLogModal(false)}
                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Close"
              >
                <XMarkIcon className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            {/* Body */}
            <div className="p-6 flex-1 overflow-y-auto">
              {selectedGameForPlayLog ? (
                <PlayLogEditor
                  gameId={selectedGameForPlayLog.id}
                  gameName={selectedGameForPlayLog.name}
                  openForm
                  autoFocus
                  onCreated={() => {
                    setShowPlayLogModal(false)
                    setSelectedGameForPlayLog(null)
                  }}
                />
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-600 text-sm mb-4">
                    Search for a game to log a play:
                  </p>
                  <input
                    type="text"
                    placeholder="Search for a game..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    autoFocus
                  />
                  <div className="flex justify-end pt-4">
                    <button
                      onClick={() => setShowPlayLogModal(false)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Overlay>
      </Portal>

      {/* Create List Modal */}
      <Portal>
        <Overlay
          visible={showCreateListModal}
          variant="blur"
          clickToClose={false}
          zIndex={400}
          className="p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCreateListModal(false)
              setListName('')
            }
          }}
        >
          <div
            className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Create New List
                </h3>
                <button
                  onClick={() => setShowCreateListModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Quick Create Form */}
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="listName"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    List Name
                  </label>
                  <input
                    id="listName"
                    type="text"
                    value={listName}
                    onChange={(e) => setListName(e.target.value)}
                    placeholder="My Awesome Games"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleCreateList()
                      }
                    }}
                    autoFocus
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowCreateListModal(false)
                      setListName('')
                    }}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                    disabled={isCreatingList}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateList}
                    disabled={!listName.trim() || isCreatingList}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreatingList ? 'Creating...' : 'Create List'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Overlay>
      </Portal>

      {/* Add Game Modal */}
      <Portal>
        <Overlay
          visible={showAddGameModal}
          variant="blur"
          clickToClose={false}
          zIndex={500}
          className="p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddGameModal(false)
              setGameName('')
              setGameYear('')
              setGamePublisher('')
              setGameSubmitted(false)
            }
          }}
        >
          <div
            className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Add Missing Game
                </h3>
                <button
                  onClick={() => {
                    setShowAddGameModal(false)
                    setGameName('')
                    setGameYear('')
                    setGamePublisher('')
                    setGameSubmitted(false)
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Form Content */}
              {!gameSubmitted ? (
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="gameName"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Game Name
                    </label>
                    <input
                      id="gameName"
                      type="text"
                      value={gameName}
                      onChange={(e) => setGameName(e.target.value)}
                      placeholder="Game title"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAddGame()
                        }
                      }}
                      autoFocus
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="gameYear"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        Year
                      </label>
                      <input
                        id="gameYear"
                        type="number"
                        value={gameYear}
                        onChange={(e) => setGameYear(e.target.value)}
                        placeholder="2024"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="gamePublisher"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        Publisher
                      </label>
                      <input
                        id="gamePublisher"
                        type="text"
                        value={gamePublisher}
                        onChange={(e) => setGamePublisher(e.target.value)}
                        placeholder="Publisher"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        setShowAddGameModal(false)
                        setGameName('')
                        setGameYear('')
                        setGamePublisher('')
                        setGameSubmitted(false)
                      }}
                      className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                      disabled={isSubmittingGame}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddGame}
                      disabled={!gameName.trim() || isSubmittingGame}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmittingGame ? 'Submitting...' : 'Submit'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 border border-green-200 rounded-lg bg-green-50 text-sm text-green-700">
                  Thanks! We'll review and import it soon.
                </div>
              )}
            </div>
          </div>
        </Overlay>
      </Portal>
    </nav>
  )
}

export default React.memo(Navigation)
