'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/utils/helpers'
import { supabase } from '@/lib/supabase'
import { fuzzySearchGames } from '@/utils/fuzzySearch'

// --- ForgotPasswordForm: fixes input focus loss on every keystroke ---
interface ForgotPasswordFormProps {
  email: string;
  setEmail: (v: string) => void;
  loading: boolean;
  error: string | null;
  message: string | null;
  onSubmit: (e: React.FormEvent) => void;
  onBackToSignIn: () => void;
  open: boolean; // NEW
}
function ForgotPasswordForm({ email, setEmail, loading, error, message, onSubmit, onBackToSignIn, open }: ForgotPasswordFormProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);
  return (
    <form onSubmit={onSubmit} className="space-y-4 mt-2">
      <div>
        <label className="block text-sm text-gray-700 mb-1">Email</label>
        <input
          ref={inputRef}
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="w-full border border-gray-300 bg-white text-gray-900 rounded-md px-3 py-2 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          placeholder="Enter your email"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-green-600">{message}</p>}
      <button type="submit" disabled={loading} className="w-full inline-flex justify-center items-center px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50">
        {loading ? 'Sending…' : 'Send reset link'}
      </button>
      <div className="text-sm text-gray-600 text-center mt-2">
        Remembered it?{' '}
        <button type="button" onClick={onBackToSignIn} className="text-primary-600 hover:text-primary-700">Back to sign in</button>
      </div>
    </form>
  );
}

import {
  HomeIcon,
  TrophyIcon,
  ChartBarIcon,
  CubeIcon,
  ListBulletIcon,
  UserIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon,
  SunIcon,
  MoonIcon,
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Awards', href: '/awards', icon: TrophyIcon },
  { name: 'Rankings', href: '/rankings', icon: ChartBarIcon },
  { name: 'Games', href: '/games', icon: CubeIcon },
  { name: 'Lists', href: '/lists', icon: ListBulletIcon },
]

const sideActions = [
  { name: 'Add', href: '/add', icon: PlusIcon },
  { name: 'Search', href: '/search', icon: MagnifyingGlassIcon },
  { name: 'Profile', href: '/profile', icon: UserIcon },
]

function NavigationComponent() {
  const pathname = usePathname()
  const router = useRouter()

  // Auth state
  const [session, setSession] = useState<import('@supabase/supabase-js').Session | null>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)

  // Scroll state for hiding/showing nav and background
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [hasScrolled, setHasScrolled] = useState(false)

  // Desktop auth modals
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showSignupModal, setShowSignupModal] = useState(false)
  const [showForgotModal, setShowForgotModal] = useState(false)

  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Memoized modal close handlers to prevent modal remount
  const handleCloseLoginModal = useCallback(() => setShowLoginModal(false), [])
  const handleCloseSignupModal = useCallback(() => setShowSignupModal(false), [])
  const handleCloseForgotModal = useCallback(() => setShowForgotModal(false), [])

  // Forgot form
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotError, setForgotError] = useState<string | null>(null)
  const [forgotMessage, setForgotMessage] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        // Close any open modals on sign in
        setShowLoginModal(false)
        setShowSignupModal(false)
        setShowForgotModal(false)
      }
    })
    
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowLoginModal(false)
        setShowSignupModal(false)
        setShowForgotModal(false)
      }
    }

    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // Track if we've scrolled for background styling
      setHasScrolled(currentScrollY > 10)
      
      // Always show nav when at top of page
      if (currentScrollY < 10) {
        setIsVisible(true)
      } 
      // Hide nav when scrolling down, show when scrolling up
      else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false)
      } else if (currentScrollY < lastScrollY) {
        setIsVisible(true)
      }
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('keydown', onEsc)
    window.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      sub?.subscription?.unsubscribe()
      window.removeEventListener('keydown', onEsc)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [lastScrollY])

  // Top-nav advanced search state
  const navSearchRef = useRef('')
  const [navSearch, setNavSearch] = useState('')
  const [navSuggestions, setNavSuggestions] = useState<Array<{ id: number; name: string; year_published: number | null; thumbnail_url: string | null }>>([])
  const [showNavSuggestions, setShowNavSuggestions] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const desktopSearchRef = useRef<HTMLInputElement | null>(null)
  const mobileSearchRef = useRef<HTMLInputElement | null>(null)

  // Keep input in sync with URL search param when on /games
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && pathname?.startsWith('/games')) {
        const params = new URLSearchParams(window.location.search)
        const q = params.get('search') || ''
        navSearchRef.current = q
        setNavSearch(q)
        if (desktopSearchRef.current) desktopSearchRef.current.value = q
        if (mobileSearchRef.current) mobileSearchRef.current.value = q
      }
    } catch {}
  }, [pathname])

  // Dark mode state management
  "use client"

  import React, { useEffect, useState, useRef, useCallback } from 'react'
  import Link from 'next/link'
  import { usePathname, useRouter } from 'next/navigation'
  import { supabase } from '@/lib/supabase'
  import { cn } from '@/utils/helpers'
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
  } from '@heroicons/react/24/outline'

  interface NavItem {
    name: string
    href: string
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  }

  const NAV_ITEMS: NavItem[] = [
    { name: 'Awards', href: '/awards', icon: TrophyIcon },
    { name: 'Rankings', href: '/rankings', icon: ChartBarIcon },
    { name: 'Games', href: '/games', icon: GamesIcon },
    { name: 'Plays', href: '/plays', icon: PlayIcon },
    { name: 'Lists', href: '/lists', icon: ListBulletIcon },
  ]

  // Suggestion Item (grouped search)
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
    const pathname = usePathname()
    const router = useRouter()
    const [session, setSession] = useState<import('@supabase/supabase-js').Session | null>(null)
    const [profile, setProfile] = useState<{ username?: string; full_name?: string; avatar_url?: string } | null>(null)
    const [isDarkMode, setIsDarkMode] = useState(false)
    const [showUserMenu, setShowUserMenu] = useState(false)

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
    const toggleDark = () => {
      const next = !isDarkMode
      setIsDarkMode(next)
      localStorage.setItem('darkMode', JSON.stringify(next))
      document.documentElement.classList.toggle('dark', next)
    }

    // Fetch suggestions (debounced)
    useEffect(() => {
      if (!query.trim()) { setGrouped({ exactMatches: [], popular: [], other: [] }); setFlat([]); setShow(false); setActiveIndex(-1); return }
      const handle = setTimeout(async () => {
        setLoading(true)
        try {
          const { data, error } = await supabase
            .from('games')
            .select('id,name,year_published,thumbnail_url,rating')
            .ilike('name', `%${query.trim()}%`)
            .order('rating', { ascending: false })
            .limit(40)
          if (!error && data) {
            const exact = data.filter(g => g.name.toLowerCase() === query.trim().toLowerCase())
            const popular = data.filter(g => g.name.toLowerCase() !== query.trim().toLowerCase() && (g.rating||0) >= 7.5).slice(0,8)
            const other = data.filter(g => g.name.toLowerCase() !== query.trim().toLowerCase() && (g.rating||0) < 7.5).slice(0,12)
            setGrouped({ exactMatches: exact, popular, other })
            const flatArr = [...exact, ...popular, ...other]
            setFlat(flatArr)
            setActiveIndex(flatArr.length ? 0 : -1)
            setShow(true)
          } else { setGrouped({ exactMatches: [], popular: [], other: [] }); setFlat([]); setShow(false) }
        } finally { setLoading(false) }
      }, 220)
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
            <Link href="/" aria-label="Home" className="flex items-center gap-2 flex-shrink-0">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 text-white font-bold shadow-sm ring-1 ring-white/30 dark:ring-white/10">MG</span>
              <span className="font-semibold text-sm tracking-tight text-gray-800 dark:text-gray-200">MeepleGo</span>
            </Link>
            <div className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map(item => {
                const active = pathname === item.href
                return (
                  <Link key={item.href} href={item.href} className={cn('group relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors', active ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white')}> 
                    <span className={cn('absolute inset-0 rounded-full -z-10 transition-all', active ? 'bg-primary-500/15 dark:bg-primary-400/20 ring-1 ring-primary-500/30 dark:ring-primary-400/30' : 'group-hover:bg-gray-200/60 dark:group-hover:bg-gray-700/50')} />
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </div>
            <div className="flex-1 hidden md:block" />
            {/* Search */}
            <div className="hidden md:block relative w-full max-w-sm">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e)=>{ setQuery(e.target.value); if (e.target.value) setShow(true) }}
                onKeyDown={onKey}
                onFocus={()=>{ if (flat.length) setShow(true) }}
                placeholder="Search games…"
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/70 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm backdrop-blur-sm"
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={show}
                aria-controls="nav-suggestions"
                aria-activedescendant={activeIndex>=0 && show?`nav-sugg-${activeIndex}`:undefined}
              />
              {show && (
                <div ref={dropdownRef} id="nav-suggestions" role="listbox" className="absolute left-0 right-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden max-h-[420px] overflow-y-auto z-50 text-sm">
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
            {/* Actions */}
            <div className="flex items-center gap-2">
              <button onClick={toggleDark} aria-label="Toggle dark mode" className="ui-btn-ghost ui-btn-sm rounded-full h-9 w-9 flex items-center justify-center">
                {isDarkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
              </button>
              <div className="relative">
                {session ? (
                  <>
                    <button onClick={()=>setShowUserMenu(v=>!v)} aria-haspopup="menu" aria-expanded={showUserMenu} className="flex items-center gap-2 rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title={profile?.full_name || profile?.username || session.user.email || 'Profile'}>
                      {profile?.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={profile.avatar_url} alt="Profile" className="w-8 h-8 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-700" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-sm font-medium ring-2 ring-gray-200 dark:ring-gray-700">{(profile?.username || profile?.full_name || session.user.email || 'U').charAt(0).toUpperCase()}</div>
                      )}
                      <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300 max-w-24 truncate">{profile?.username || profile?.full_name || 'Profile'}</span>
                    </button>
                    {showUserMenu && (
                      <div className="absolute right-0 mt-2 w-56 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg py-2 text-sm z-50">
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                          <div className="font-medium text-gray-900 dark:text-white truncate">{profile?.full_name || profile?.username || 'User'}</div>
                          <div className="text-gray-500 dark:text-gray-400 truncate text-xs">{session.user.email}</div>
                        </div>
                        <Link href="/profile" className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"><UserCircleIcon className="h-4 w-4 text-gray-400" /> My Profile</Link>
                        <Link href="/settings" className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Settings</Link>
                        <hr className="my-1 border-gray-100 dark:border-gray-800" />
                        <button onClick={signOut} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-red-600 dark:text-red-400"><ArrowRightOnRectangleIcon className="h-4 w-4" /> Sign out</button>
                      </div>
                    )}
                  </>
                ) : (
                  <Link href="/login" className="ui-btn ui-btn-primary ui-btn-sm rounded-lg px-4 py-2 font-medium shadow-sm">Sign In</Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  export default React.memo(Navigation)
      }
    }

    return (
      <ModalShell open={open} onClose={onClose} title="Welcome back" id="login-modal">
        <OAuthButtons />
        <form onSubmit={submit} className="space-y-4 mt-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Email</label>
            <div className="relative">
              <input
                ref={emailRef}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full border border-gray-300 bg-white text-gray-900 rounded-md px-3 py-2 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter your email"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                name="password"
                autoComplete="current-password"
                className="w-full border border-gray-300 bg-white text-gray-900 rounded-md px-3 py-2 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 pr-10"
                placeholder="Enter your password"
              />
              <button type="button" onClick={() => setShowPwd((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                {showPwd ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex items-center justify-between text-sm">
            <button type="button" onClick={() => { onClose(); setShowForgotModal(true) }} className="text-primary-600 hover:text-primary-700">Forgot password?</button>
          </div>
          <button type="submit" disabled={loading} className="w-full inline-flex justify-center items-center px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50">
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
          <div className="text-sm text-gray-600 text-center mt-2">
            Don't have an account?{' '}
            <button type="button" onClick={() => { onClose(); setShowSignupModal(true) }} className="text-primary-600 hover:text-primary-700">Sign up</button>
          </div>
        </form>
      </ModalShell>
    )
  }

  // Signup form (moved to isolated component to prevent focus loss)
  const SignupModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPwd, setShowPwd] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [message, setMessage] = useState<string | null>(null)
    const emailRef = useRef<HTMLInputElement | null>(null)

    useEffect(() => { if (open && emailRef.current) emailRef.current.focus() }, [open])

    const submit = async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)
      setMessage(null)
      setLoading(true)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      setLoading(false)
      if (error) setError(error.message)
      else if (data.user) setMessage('Check your email to confirm your account.')
    }

    return (
      <ModalShell open={open} onClose={onClose} title="Create your account" id="signup-modal">
        <OAuthButtons />
        <form onSubmit={submit} className="space-y-4 mt-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Email</label>
            <input
              ref={emailRef}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full border border-gray-300 bg-white text-gray-900 rounded-md px-3 py-2 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter your email"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                name="new-password"
                autoComplete="new-password"
                className="w-full border border-gray-300 bg-white text-gray-900 rounded-md px-3 py-2 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 pr-10"
                placeholder="Enter your password"
              />
              <button type="button" onClick={() => setShowPwd((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                {showPwd ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {message && <p className="text-sm text-green-600">{message}</p>}
          <button type="submit" disabled={loading} className="w-full inline-flex justify-center items-center px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50">
            {loading ? 'Creating account…' : 'Sign up'}
          </button>
          <div className="text-sm text-gray-600 text-center mt-2">
            Already have an account?{' '}
            <button type="button" onClick={() => { onClose(); setShowLoginModal(true) }} className="text-primary-600 hover:text-primary-700">Log in</button>
          </div>
        </form>
      </ModalShell>
    )
  }

  // Select a suggestion (navigate to specific game)
  const onSelectSuggestion = useCallback((id: number) => {
    setShowNavSuggestions(false)
    setNavSuggestions([])
    router.push(`/games?gameId=${id}`)
  }, [router])

  // Submit full search query
  const onSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    const q = navSearch.trim()
    router.push(q ? `/games?search=${encodeURIComponent(q)}` : '/games')
    setShowNavSuggestions(false)
  }, [navSearch, router])

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out bg-white dark:bg-gray-900 shadow-lg border-b border-gray-200 dark:border-gray-700 ${
      isVisible ? 'translate-y-0' : '-translate-y-full'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 gap-4">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <CubeIcon className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">MeepleGo</span>
            </Link>
          </div>

          {/* Main Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-300',
                    isActive
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>

          {/* Top Nav Advanced Search (desktop) */}
          <div className="hidden md:flex items-center flex-1 max-w-md relative">
            <form onSubmit={onSubmit} className="w-full">
              <div className="relative transition-all duration-300">
                <div className="absolute inset-y-0 left-0 pl-3  text-sm font-medium flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  ref={desktopSearchRef}
                  type="text"
                  aria-label="Search games"
                  placeholder="Search games"
                  value={navSearch}
                  autoComplete="off"
                  onChange={onNavChange}
                  onBlur={() => { setTimeout(() => setShowNavSuggestions(false), 150) }}
                  className={`pl-10 pr-3 py-2 border rounded-md text-sm font-medium leading-5 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white focus:placeholder-gray-400 dark:focus:placeholder-gray-300 ${
                    navSearch.length > 0 || showNavSuggestions ? 'w-96' : 'w-56'
                  }`}
                />
              </div>
            </form>

            {showNavSuggestions && (
              <ul className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                {navSuggestions.map((g, i) => (
                  <li
                    key={g.id}
                    className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 ${i % 2 === 1 ? 'bg-gray-50 hover:bg-gray-100' : 'bg-white hover:bg-gray-50'}`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => onSelectSuggestion(g.id)}
                  >
                    <div className="flex items-center gap-3">
                      {g.thumbnail_url && (
                        <img src={g.thumbnail_url} alt={g.name} className="w-8 h-8 rounded object-cover" />
                      )}
                      <div>
                        <div className="font-medium text-gray-900">{g.name}</div>
                        {g.year_published && (
                          <div className="text-xs text-gray-500">({g.year_published})</div>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
                <li className="px-4 py-3 text-xs text-gray-500 border-t border-gray-200 bg-gray-50">
                  Can't find your game? <a href="/help/add-game" className="text-primary-600 underline hover:text-primary-800">Learn how to add it</a>
                </li>
              </ul>
            )}
          </div>

          {/* Side Actions */}
          <div className="flex items-center space-x-4">
            {!session ? (
              <>
                {/* Mobile: route to pages */}
                <div className="flex items-center gap-2 md:hidden">
                  <Link href="/login" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white">Log in</Link>
                  <Link href="/signup" className="px-3 py-2 text-sm font-medium rounded-md bg-primary-600 text-white hover:bg-primary-700">Sign up</Link>
                </div>
                {/* Desktop: open modals */}
                <div className="hidden md:flex items-center gap-2">
                  <button 
                    onClick={() => { setShowSignupModal(false); setShowLoginModal(true) }} 
                    className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white"
                  >
                    Log in
                  </button>
                  <button 
                    onClick={() => { setShowLoginModal(false); setShowSignupModal(true) }} 
                    className="px-3 py-2 text-sm font-medium rounded-md bg-primary-600 text-white hover:bg-primary-700"
                  >
                    Sign up
                  </button>
                </div>
              </>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu((s) => !s)}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-50"
                  aria-haspopup="menu"
                  aria-expanded={showUserMenu}
                >
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-gray-600" />
                  </div>
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg z-50">
                    <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">My Profile</Link>
                    <Link href="/library" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">My Library</Link>
                    <Link href="/wishlist" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">My Wishlist</Link>
                    <Link href="/settings" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">Settings</Link>
                    <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>
                    <button
                      onClick={toggleDarkMode}
                      className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <span>Dark mode</span>
                      <div className="flex items-center">
                        {isDarkMode ? (
                          <MoonIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        ) : (
                          <SunIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        )}
                      </div>
                    </button>
                    <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>
                    <button
                      onClick={async () => { await supabase.auth.signOut(); setShowUserMenu(false); router.refresh() }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="px-4 py-3 relative">
          <form onSubmit={onSubmit} className="w-full">
            <div className="relative transition-all duration-300">
              <div className="absolute inset-y-0 left-0 pl-3 flex  text-sm font-medium items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                ref={mobileSearchRef}
                type="text"
                aria-label="Search games"
                placeholder="Search games"
                value={navSearch}
                autoComplete="off"
                onChange={onNavChange}
                onBlur={() => { setTimeout(() => setShowNavSuggestions(false), 150) }}
                className={`pl-10 pr-3 py-2 border text-sm font-medium rounded-md leading-5 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white focus:placeholder-gray-400 dark:focus:placeholder-gray-300 ${
                  navSearch.length > 0 || showNavSuggestions ? 'w-full' : 'w-64'
                }`}
              />
            </div>
          </form>

          {showNavSuggestions && (
            <ul className="absolute left-4 right-4 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
              {navSuggestions.map((g, i) => (
                <li
                  key={g.id}
                  className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 ${i % 2 === 1 ? 'bg-gray-50 hover:bg-gray-100' : 'bg-white hover:bg-gray-50'}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onSelectSuggestion(g.id)}
                >
                  <div className="flex items-center gap-3">
                    {g.thumbnail_url && (
                      <img src={g.thumbnail_url} alt={g.name} className="w-8 h-8 rounded object-cover" />
                    )}
                    <div>
                      <div className="font-medium text-gray-900">{g.name}</div>
                      {g.year_published && (
                        <div className="text-xs text-gray-500">({g.year_published})</div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
              <li className="px-4 py-3 text-xs text-gray-500 border-t border-gray-200 bg-gray-50">
                Can't find your game? <a href="/help/add-game" className="text-primary-600 underline hover:text-primary-800">Learn how to add it</a>
              </li>
            </ul>
          )}
        </div>

        <div className="px-2 pt-2 pb-3 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors duration-300',
                  isActive
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Login Modal (now isolated) */}
      <LoginModal open={showLoginModal} onClose={handleCloseLoginModal} />

      {/* Signup Modal */}
      <SignupModal open={showSignupModal} onClose={handleCloseSignupModal} />

      {/* Forgot Password Modal */}
      <ModalShell open={showForgotModal} onClose={handleCloseForgotModal} title="Reset your password" id="forgot-modal">
        <ForgotPasswordForm
          open={showForgotModal}
          email={forgotEmail}
          setEmail={setForgotEmail}
          loading={forgotLoading}
          error={forgotError}
          message={forgotMessage}
          onSubmit={onForgotSubmit}
          onBackToSignIn={() => { setShowForgotModal(false); setShowLoginModal(true) }}
        />
      </ModalShell>
    </nav>
  )
}

// Wrap original export with React.memo preserving name for devtools
const _Navigation = NavigationComponent
const MemoNavigation = React.memo(_Navigation)
export default MemoNavigation
