'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { cn, getGameUrl } from '@/utils/helpers'
import { Logo } from '../Foundations/Logo'
import Portal from '@/components/Elements/Portal'
import Overlay from '@/components/Elements/Overlay'
import { Button } from '../Elements/Button'
import NavigationAddMenu from './NavigationAddMenu'
import NavigationSearchPill from './NavigationSearchPill'
import NavigationUserMenu from './NavigationUserMenu'
import type {
  GroupedSuggestions,
  SuggestionGame,
  ProfileMenuItem,
} from './navigationTypes'
import {
  TrophyIcon,
  ChartBarIcon,
  CubeIcon as GamesIcon,
  ListBulletIcon,
  PencilSquareIcon,
  UserCircleIcon,
  XMarkIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'

interface NavLinkItem {
  name: string
  href: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}
const NAV_ITEMS: NavLinkItem[] = [
  { name: 'Games', href: '/games', icon: GamesIcon },
  { name: 'Lists', href: '/lists', icon: ListBulletIcon },
  { name: 'Awards', href: '/awards', icon: TrophyIcon },
]
const PROFILE_MENU_ITEMS: ProfileMenuItem[] = [
  { label: 'Overview', href: '/profile', Icon: UserCircleIcon },
  { label: 'Activity', href: '/profile/activity', Icon: PencilSquareIcon },
  { label: 'Games', href: '/profile/games', Icon: GamesIcon },
  { label: 'Journal', href: '/profile/journal', Icon: PencilSquareIcon },
  { label: 'Rankings', href: '/profile/rankings', Icon: ChartBarIcon },
  { label: 'Lists', href: '/profile/lists', Icon: ListBulletIcon },
  { label: 'Awards', href: '/profile/awards', Icon: TrophyIcon },
  { label: 'Friends', href: '/profile/friends', Icon: UserGroupIcon },
  { label: 'Stats', href: '/profile/stats', Icon: ChartBarIcon },
]

function Navigation() {
  // Always call hooks unconditionally.
  const pathname = usePathname() || '/'
  const router = useRouter()
  const isProfilePage = pathname.startsWith('/profile')
  const [isMounted, setIsMounted] = useState(false)
  const [session, setSession] = useState<
    import('@supabase/supabase-js').Session | null
  >(null)
  const [profile, setProfile] = useState<{
    username?: string
    full_name?: string
    avatar_url?: string
  } | null>(null)
  const [themeMode, setThemeMode] = useState<'system' | 'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'system'
    const saved = localStorage.getItem('themeMode')
    return saved === 'light' || saved === 'dark' || saved === 'system'
      ? saved
      : 'system'
  })
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showAddMenu, setShowAddMenu] = useState(false)
  // Refs for outside click detection of dropdown menus
  const addMenuRef = useRef<HTMLDivElement>(null!)
  const addButtonRef = useRef<HTMLButtonElement>(null!)
  const userMenuRef = useRef<HTMLDivElement>(null!)
  const userButtonRef = useRef<HTMLButtonElement>(null!)
  const mobileUserMenuRef = useRef<HTMLDivElement>(null!)

  const userInitials = (
    profile?.username ||
    profile?.full_name ||
    session?.user?.email ||
    'U'
  )
    .charAt(0)
    .toUpperCase()

  // Modal states
  const [showCreateListModal, setShowCreateListModal] = useState(false)
  const [showAddGameModal, setShowAddGameModal] = useState(false)

  // Create list form state
  const [listName, setListName] = useState('')
  const [isCreatingList, setIsCreatingList] = useState(false)

  // Add game form state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchYear, setSearchYear] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<
    Array<{
      bgg_id: number
      name: string
      year_published?: number | null
      type?: string | null
      thumbnail_url?: string | null
    }>
  >([])
  const [selectedToAdd, setSelectedToAdd] = useState<number | null>(null)
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [addedGame, setAddedGame] = useState<{ id: string; name: string } | null>(
    null
  )
  const [addedExisting, setAddedExisting] = useState(false)

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

  const resetAddGameState = useCallback(() => {
    setSearchQuery('')
    setSearchYear('')
    setSearching(false)
    setSearchResults([])
    setSelectedToAdd(null)
    setAdding(false)
    setAddError(null)
    setAddedGame(null)
    setAddedExisting(false)
  }, [])

  const handleSearchAgain = useCallback(() => {
    setAddedGame(null)
    setAddedExisting(false)
    setAddError(null)
    setSelectedToAdd(null)
    setAdding(false)
  }, [])

  // Add game search
  const handleSearch = async () => {
    if (!searchQuery.trim() || searching) return

    setSearching(true)
    setAddError(null)
    setSearchResults([])
    setAddedGame(null)
    setAddedExisting(false)

    try {
      const params = new URLSearchParams({
        query: searchQuery.trim(),
      })
      if (searchYear.trim()) {
        params.set('year', searchYear.trim())
      }

      const response = await fetch(`/api/bgg/search?${params.toString()}`)
      const payload = await response.json().catch(() => null)
      if (!response.ok || !payload?.ok) {
        setAddError(payload?.error || 'Search failed. Please try again.')
        return
      }

      setSearchResults(payload.results || [])
    } catch (error) {
      console.error('Search error:', error)
      setAddError('Search failed. Please try again.')
    } finally {
      setSearching(false)
    }
  }

  const handleAddFromResult = async (result: {
    bgg_id: number
    name: string
  }) => {
    if (adding) return
    setAdding(true)
    setSelectedToAdd(result.bgg_id)
    setAddError(null)
    setAddedGame(null)
    setAddedExisting(false)

    try {
      const response = await fetch(`/api/bgg/thing?id=${result.bgg_id}`)
      const payload = await response.json().catch(() => null)
      if (!response.ok || !payload?.ok || !payload?.game) {
        setAddError(payload?.error || 'Could not load game details.')
        return
      }

      const game = payload.game as {
        bgg_id: number
        name: string
        year_published?: number | null
        description?: string | null
        image_url?: string | null
        thumbnail_url?: string | null
        min_players?: number | null
        max_players?: number | null
        playtime_minutes?: number | null
        categories?: string[] | null
        mechanics?: string[] | null
        designer?: string[] | null
        artists?: string[] | null
        publisher?: string | null
        weight?: number | null
        rating?: number | null
        num_ratings?: number | null
        bgg_type?: string | null
      }

      const cachedAt = new Date().toISOString()

      const { data: existing, error: existingError } = await supabase
        .from('games')
        .select(
          'id, name, bgg_id, year_published, image_url, thumbnail_url, categories, mechanics, min_players, max_players, playtime_minutes, publisher, description, rating, num_ratings'
        )
        .eq('bgg_id', game.bgg_id)
        .maybeSingle()

      if (existingError) throw existingError

      if (existing) {
        const updatePayload: Record<string, any> = {
          cached_at: cachedAt,
          is_active: true,
        }

        const fillIfEmpty = (field: string, value: any) => {
          if (value == null) return
          const current = (existing as any)[field]
          const emptyArray = Array.isArray(current) && current.length === 0
          const emptyString =
            typeof current === 'string' && current.trim().length === 0
          if (current == null || emptyArray || emptyString) {
            updatePayload[field] = value
          }
        }

        fillIfEmpty('name', game.name)
        fillIfEmpty('year_published', game.year_published)
        fillIfEmpty('image_url', game.image_url)
        fillIfEmpty('thumbnail_url', game.thumbnail_url)
        fillIfEmpty('min_players', game.min_players)
        fillIfEmpty('max_players', game.max_players)
        fillIfEmpty('playtime_minutes', game.playtime_minutes)
        fillIfEmpty('categories', game.categories)
        fillIfEmpty('mechanics', game.mechanics)
        fillIfEmpty('publisher', game.publisher)
        fillIfEmpty('description', game.description)
        fillIfEmpty('rating', game.rating)
        fillIfEmpty('num_ratings', game.num_ratings)
        fillIfEmpty('designer', game.designer)
        fillIfEmpty('artists', game.artists)
        fillIfEmpty('weight', game.weight)
        fillIfEmpty('bgg_type', game.bgg_type)

        await supabase
          .from('games')
          .update(updatePayload as any)
          .eq('id', existing.id)

        setAddedGame({ id: existing.id, name: existing.name || game.name })
        setAddedExisting(true)
        return
      }

      const insertPayload: Record<string, any> = {
        bgg_id: game.bgg_id,
        name: game.name,
        year_published: game.year_published ?? null,
        description: game.description ?? null,
        image_url: game.image_url ?? null,
        thumbnail_url: game.thumbnail_url ?? null,
        min_players: game.min_players ?? null,
        max_players: game.max_players ?? null,
        playtime_minutes: game.playtime_minutes ?? null,
        categories: game.categories ?? null,
        mechanics: game.mechanics ?? null,
        publisher: game.publisher ?? null,
        rating: game.rating ?? null,
        num_ratings: game.num_ratings ?? null,
        designer: game.designer ?? null,
        artists: game.artists ?? null,
        weight: game.weight ?? null,
        bgg_type: game.bgg_type ?? null,
        cached_at: cachedAt,
        is_active: true,
      }

      const { data: inserted, error: insertError } = await supabase
        .from('games')
        .insert(insertPayload as any)
        .select('id, name')
        .single()

      if (insertError) {
        const { data: fallback } = await supabase
          .from('games')
          .select('id, name')
          .eq('bgg_id', game.bgg_id)
          .maybeSingle()
        if (fallback) {
          setAddedGame({ id: fallback.id, name: fallback.name })
          setAddedExisting(true)
          return
        }
        throw insertError
      }

      setAddedGame({ id: inserted.id, name: inserted.name })
    } catch (error) {
      console.error('Add game error:', error)
      setAddError('Could not add the game. Please try again.')
    } finally {
      setAdding(false)
      setSelectedToAdd(null)
    }
  }

  useEffect(() => {
    if (!showAddGameModal) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowAddGameModal(false)
        resetAddGameState()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showAddGameModal, resetAddGameState])

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
  const [searchOpen, setSearchOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null!)
  const dropdownRef = useRef<HTMLDivElement>(null!)
  const cacheRef = useRef<Record<string, SuggestionGame[]>>({})
  const abortRef = useRef<AbortController | null>(null)

  // Nav highlighting is handled with a simple active underline.

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

  // Mount guard
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Legacy theme migration (darkMode -> themeMode)
  useEffect(() => {
    const savedTheme = localStorage.getItem('themeMode')
    if (!savedTheme) {
      const legacy = localStorage.getItem('darkMode')
      if (legacy !== null) {
        const val = JSON.parse(legacy)
        const next = val ? 'dark' : 'light'
        setThemeMode(next)
        localStorage.setItem('themeMode', next)
      }
    }
  }, [])

  const applyTheme = useCallback((mode: 'system' | 'light' | 'dark') => {
    if (typeof window === 'undefined') return
    const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const dark = mode === 'dark' || (mode === 'system' && sysDark)
    console.log('[applyTheme] mode:', mode, 'sysDark:', sysDark, 'dark:', dark)
    console.log('[applyTheme] classList before:', document.documentElement.classList.toString())
    document.documentElement.classList.toggle('dark', dark)
    console.log('[applyTheme] classList after:', document.documentElement.classList.toString())
  }, [])
  const setTheme = useCallback((mode: 'system' | 'light' | 'dark') => {
    console.log('[setTheme] called with mode:', mode)
    setThemeMode(mode)
    if (typeof window !== 'undefined') {
      localStorage.setItem('themeMode', mode)
      console.log('[setTheme] saved to localStorage:', localStorage.getItem('themeMode'))
    }
    applyTheme(mode)
  }, [applyTheme])
  useEffect(() => {
    applyTheme(themeMode)
  }, [themeMode, applyTheme])
  useEffect(() => {
    if (themeMode === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const listener = () => applyTheme('system')
      mq.addEventListener('change', listener)
      return () => mq.removeEventListener('change', listener)
    }
  }, [themeMode, applyTheme])

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
    setSearchOpen(false)
    router.push(getGameUrl({ id: g.id, name: g.name }))
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
        const clickedDesktopMenu =
          userMenuRef.current && userMenuRef.current.contains(target)
        const clickedMobileMenu =
          mobileUserMenuRef.current &&
          mobileUserMenuRef.current.contains(target)
        const clickedButton =
          userButtonRef.current && userButtonRef.current.contains(target)

        if (!clickedDesktopMenu && !clickedMobileMenu && !clickedButton) {
          setShowUserMenu(false)
        }
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showAddMenu) setShowAddMenu(false)
        if (showUserMenu) setShowUserMenu(false)
        if (searchOpen) setSearchOpen(false)
      }
    }
    window.addEventListener('mousedown', onPointerDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onPointerDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [showAddMenu, showUserMenu, searchOpen])

  useEffect(() => {
    if (searchOpen) {
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [searchOpen])

  return (
    <>
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
          'absolute inset-0 pointer-events-none z-0 transition-all duration-300',
          scrolled
            ? 'bg-white dark:bg-gray-900 shadow-[0_6px_20px_rgba(15,23,42,0.12)] dark:shadow-[0_6px_20px_rgba(0,0,0,0.3)]'
            : 'bg-transparent'
        )}
      />
      <div className="relative z-10 px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 h-14">
          <Logo
            size="lg"
            href="/"
            showText={!isProfilePage}
            className="flex-shrink-0"
          />

          {/* Centered nav links */}
          {!isProfilePage && (
            <div className="hidden min-w-0 md:flex flex-1 justify-center">
              <ul className="flex items-center gap-8 text-xs font-medium font-inter">
                {NAV_ITEMS.map((item) => {
                  const active = pathname === item.href
                  const Icon = item.icon
                  return (
                    <li key={item.href}>
                      <Link
                        className={cn(
                          'flex items-center gap-2.5 px-1.5 py-2 transition-colors duration-200 border-b-2',
                          active
                            ? 'text-gray-900 dark:text-gray-100 border-gray-900 dark:border-gray-100'
                            : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-gray-100'
                        )}
                        href={item.href}
                      >
                        <Icon className="w-[18px] h-[18px]" />
                        {item.name}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          {isProfilePage && <div className="flex-1" />}

          {/* Actions */}
          {isMounted && (
            <div className="relative flex items-center gap-2">
              <NavigationAddMenu
                showAddMenu={showAddMenu}
                setShowAddMenu={setShowAddMenu}
                addMenuRef={addMenuRef}
                addButtonRef={addButtonRef}
                onLogPlay={() => router.push('/plays/new')}
                onCreateList={() => setShowCreateListModal(true)}
                onAddGame={() => setShowAddGameModal(true)}
              />
              <NavigationSearchPill
                searchOpen={searchOpen}
                setSearchOpen={setSearchOpen}
                query={query}
                setQuery={setQuery}
                show={show}
                setShow={setShow}
                grouped={grouped}
                flat={flat}
                loading={loading}
                activeIndex={activeIndex}
                setActiveIndex={setActiveIndex}
                inputRef={inputRef}
                dropdownRef={dropdownRef}
                onKey={onKey}
                selectGame={selectGame}
              />
              {session ? (
                <NavigationUserMenu
                  session={session}
                  profile={profile}
                  showUserMenu={showUserMenu}
                  setShowUserMenu={setShowUserMenu}
                  userButtonRef={userButtonRef}
                  userMenuRef={userMenuRef}
                  mobileUserMenuRef={mobileUserMenuRef}
                  userInitials={userInitials}
                  onSignOut={signOut}
                  onSetTheme={setTheme}
                  themeMode={themeMode}
                  profileMenuItems={PROFILE_MENU_ITEMS}
                />
              ) : (
                <Link href="/login">
                  <Button variant="primary" size="sm">
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

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
            className="relative w-full max-w-md bg-white dark:bg-gray-900 shadow-xl rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Create New List
                </h3>
                <button
                  onClick={() => setShowCreateListModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Quick Create Form */}
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="listName"
                    className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    List Name
                  </label>
                  <input
                    id="listName"
                    type="text"
                    value={listName}
                    onChange={(e) => setListName(e.target.value)}
                    placeholder="My Awesome Games"
                    className="w-full px-3 py-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-500 dark:placeholder-gray-400"
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
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                    disabled={isCreatingList}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateList}
                    disabled={!listName.trim() || isCreatingList}
                    className="px-4 py-2 text-white rounded-lg bg-primary-600 hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
              resetAddGameState()
            }
          }}
        >
          <div
            className="relative w-full max-w-md bg-white dark:bg-gray-900 shadow-xl rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Add Missing Game
                </h3>
                <button
                  onClick={() => {
                    setShowAddGameModal(false)
                    resetAddGameState()
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Form Content */}
              {!addedGame ? (
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="gameName"
                      className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Game Name
                    </label>
                    <input
                      id="gameName"
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Game title"
                      className="w-full px-3 py-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-500 dark:placeholder-gray-400"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSearch()
                        }
                      }}
                      autoFocus
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="gameYear"
                        className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Year
                      </label>
                      <input
                        id="gameYear"
                        type="number"
                        value={searchYear}
                        onChange={(e) => setSearchYear(e.target.value)}
                        placeholder="2024"
                        className="w-full px-3 py-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-500 dark:placeholder-gray-400"
                      />
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    BGG XML lookup (temporary)
                  </p>

                  {addError && (
                    <div className="p-3 text-sm text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/30">
                      {addError}
                    </div>
                  )}

                  <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
                    {searching ? (
                      <div className="px-3 py-4 text-sm text-gray-600 dark:text-gray-300">
                        Searching…
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                        No results yet. Try a search.
                      </div>
                    ) : (
                      searchResults.map((result) => {
                        const typeLabel =
                          result.type === 'boardgameexpansion'
                            ? 'Expansion'
                            : result.type === 'boardgame'
                              ? 'Board Game'
                              : result.type || null
                        const metaParts = [
                          result.year_published
                            ? String(result.year_published)
                            : null,
                          typeLabel,
                          `BGG ${result.bgg_id}`,
                        ].filter(Boolean)

                        return (
                          <div
                            key={result.bgg_id}
                            className="flex items-center gap-3 px-3 py-3"
                          >
                            {result.thumbnail_url ? (
                              <img
                                src={result.thumbnail_url}
                                alt=""
                                className="w-10 h-10 rounded object-cover bg-gray-100 dark:bg-gray-800"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs text-gray-500">
                                BGG
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                {result.name}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {metaParts.length
                                  ? metaParts.join(' • ')
                                  : 'Metadata unavailable'}
                              </div>
                            </div>
                            <button
                              onClick={() => handleAddFromResult(result)}
                              disabled={adding || searching}
                              className="px-3 py-1.5 text-sm text-white rounded-lg bg-primary-600 hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {adding && selectedToAdd === result.bgg_id
                                ? 'Adding...'
                                : 'Add'}
                            </button>
                          </div>
                        )
                      })
                    )}
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={handleSearchAgain}
                      className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                    >
                      Search again
                    </button>
                    <button
                      onClick={() => {
                        setShowAddGameModal(false)
                        resetAddGameState()
                      }}
                      className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                      disabled={searching || adding}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSearch}
                      disabled={!searchQuery.trim() || searching || adding}
                      className="px-4 py-2 text-white rounded-lg bg-primary-600 hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {searching ? 'Searching...' : 'Search'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 text-sm text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800 rounded-lg bg-green-50 dark:bg-green-900/30">
                    {addedExisting ? 'Already in MeepleGo.' : 'Added ✓'}
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        setShowAddGameModal(false)
                        resetAddGameState()
                      }}
                      className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => {
                        const url = getGameUrl({
                          id: addedGame.id,
                          name: addedGame.name,
                        })
                        setShowAddGameModal(false)
                        resetAddGameState()
                        router.push(url)
                      }}
                      className="px-4 py-2 text-white rounded-lg bg-primary-600 hover:bg-primary-700 focus:ring-2 focus:ring-primary-500"
                    >
                      View game
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Overlay>
      </Portal>
    </nav>

      {/* Mobile Bottom Navigation - Only render on client to avoid hydration mismatch */}
      {isMounted && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 md:hidden">
          <div className="flex items-center justify-around h-16 px-2">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[60px]',
                  active
                    ? 'text-primary-600'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                )}
              >
                <Icon className="w-6 h-6" />
                <span className="text-[10px] font-medium">{item.name}</span>
              </Link>
            )
          })}
          {session ? (
            <button
              onClick={() => setShowUserMenu((v) => !v)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[60px]',
                showUserMenu ? 'text-primary-600' : 'text-gray-600 dark:text-gray-400'
              )}
            >
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Profile"
                  className="object-cover w-6 h-6 rounded-full ring-2 ring-gray-200 dark:ring-gray-700"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-[10px] font-medium ring-2 ring-gray-200 dark:ring-gray-700">
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
              <span className="text-[10px] font-medium">Profile</span>
            </button>
          ) : (
            <Link
              href="/login"
              className="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 min-w-[60px]"
            >
              <UserCircleIcon className="w-6 h-6" />
              <span className="text-[10px] font-medium">Sign In</span>
            </Link>
          )}
        </div>
      </div>
      )}
    </>
  )
}

export default React.memo(Navigation)
