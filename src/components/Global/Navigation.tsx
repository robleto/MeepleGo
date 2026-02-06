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
  BookmarkIcon,
  HeartIcon,
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
  { label: 'Library', href: '/profile/library', Icon: BookmarkIcon },
  { label: 'Wishlist', href: '/profile/wishlist', Icon: HeartIcon },
  { label: 'Rankings', href: '/profile/rankings', Icon: ChartBarIcon },
  { label: 'Lists', href: '/profile/lists', Icon: ListBulletIcon },
  { label: 'Awards', href: '/profile/awards', Icon: TrophyIcon },
  { label: 'Journal', href: '/profile/plays', Icon: PencilSquareIcon },
  { label: 'Friends', href: '/profile/friends', Icon: UserGroupIcon },
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
              setGameName('')
              setGameYear('')
              setGamePublisher('')
              setGameSubmitted(false)
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
                    setGameName('')
                    setGameYear('')
                    setGamePublisher('')
                    setGameSubmitted(false)
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
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
                      className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Game Name
                    </label>
                    <input
                      id="gameName"
                      type="text"
                      value={gameName}
                      onChange={(e) => setGameName(e.target.value)}
                      placeholder="Game title"
                      className="w-full px-3 py-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-500 dark:placeholder-gray-400"
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
                        className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Year
                      </label>
                      <input
                        id="gameYear"
                        type="number"
                        value={gameYear}
                        onChange={(e) => setGameYear(e.target.value)}
                        placeholder="2024"
                        className="w-full px-3 py-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-500 dark:placeholder-gray-400"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="gamePublisher"
                        className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Publisher
                      </label>
                      <input
                        id="gamePublisher"
                        type="text"
                        value={gamePublisher}
                        onChange={(e) => setGamePublisher(e.target.value)}
                        placeholder="Publisher"
                        className="w-full px-3 py-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-500 dark:placeholder-gray-400"
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
                      className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                      disabled={isSubmittingGame}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddGame}
                      disabled={!gameName.trim() || isSubmittingGame}
                      className="px-4 py-2 text-white rounded-lg bg-primary-600 hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmittingGame ? 'Submitting...' : 'Submit'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 text-sm text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800 rounded-lg bg-green-50 dark:bg-green-900/30">
                  Thanks! We'll review and import it soon.
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
