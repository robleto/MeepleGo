'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useCallback } from 'react'
import { cn } from '@/utils/helpers'
import { supabase } from '@/lib/supabase'
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

export default function Navigation() {
  const pathname = usePathname()
  const router = useRouter()

  // Auth state
  const [session, setSession] = useState<import('@supabase/supabase-js').Session | null>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)

  // Desktop auth modals
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showSignupModal, setShowSignupModal] = useState(false)
  const [showForgotModal, setShowForgotModal] = useState(false)

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
    window.addEventListener('keydown', onEsc)
    return () => {
      sub?.subscription?.unsubscribe()
      window.removeEventListener('keydown', onEsc)
    }
  }, [])

  // Top-nav advanced search state
  const [navSearch, setNavSearch] = useState('')
  const [navSuggestions, setNavSuggestions] = useState<Array<{ id: number; name: string; year_published: number | null; thumbnail_url: string | null }>>([])
  const [showNavSuggestions, setShowNavSuggestions] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Keep input in sync with URL search param when on /games
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && pathname?.startsWith('/games')) {
        const params = new URLSearchParams(window.location.search)
        const q = params.get('search') || ''
        setNavSearch(q)
      }
    } catch {}
  }, [pathname])

  const fetchSuggestions = async (value: string) => {
    if (!value) {
      setNavSuggestions([])
      return
    }
    const { data, error } = await supabase
      .from('games')
      .select('id, name, year_published, thumbnail_url')
      .ilike('name', `%${value}%`)
      .limit(7)
    if (!error && data) setNavSuggestions(data as any)
    else setNavSuggestions([])
  }

  const onNavChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setNavSearch(value)
    setShowNavSuggestions(!!value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!value) {
      setNavSuggestions([])
      return
    }
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 200)
  }

  const onSelectSuggestion = (id: number) => {
    setShowNavSuggestions(false)
    setNavSuggestions([])
    router.push(`/games?gameId=${id}`)
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = navSearch.trim()
    router.push(q ? `/games?search=${encodeURIComponent(q)}` : '/games')
    setShowNavSuggestions(false)
  }

  const signInWithOAuth = async (provider: 'google' | 'facebook' | 'github') => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  const onForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotError(null)
    setForgotMessage(null)
    setForgotLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/update-password`,
    })
    setForgotLoading(false)
    if (error) setForgotError(error.message)
    else setForgotMessage('If an account exists, you will receive an email shortly.')
  }

  // Persistent modals (always mounted) to avoid focus loss on re-render
  const ModalShell = ({ open, title, onClose, children, id }: { open: boolean; title: string; onClose: () => void; children: React.ReactNode; id: string }) => (
    <div
      aria-hidden={!open}
      className={`fixed inset-0 z-[100] transition-opacity duration-150 ${open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        className="relative mx-auto mt-20 w-full max-w-md rounded-xl shadow-2xl border border-gray-200 bg-white text-gray-900 focus:outline-none"
      >
        <div className="flex items-center justify-between px-6 pt-5">
          <h3 id={`${id}-title`} className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-md hover:bg-gray-100" aria-label="Close modal">
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="px-6 pb-6 pt-4">{children}</div>
      </div>
    </div>
  )

  const OAuthButtons = () => (
    <div className="space-y-3">
      <button onClick={() => signInWithOAuth('google')} className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-md border border-gray-300 bg-white hover:bg-gray-50">
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white text-gray-900 text-xs font-bold border border-gray-300">G</span>
        <span className="text-sm font-medium text-gray-900">Continue with Google</span>
      </button>
      <button onClick={() => signInWithOAuth('facebook')} className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-md border border-gray-300 bg-white hover:bg-gray-50">
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold">f</span>
        <span className="text-sm font-medium text-gray-900">Continue with Facebook</span>
      </button>
      <button onClick={() => signInWithOAuth('github')} className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-md border border-gray-300 bg-white hover:bg-gray-50">
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-900 text-white text-xs font-bold">GH</span>
        <span className="text-sm font-medium text-gray-900">Continue with Github</span>
      </button>
      <div className="flex items-center gap-3 my-2">
        <div className="h-px flex-1 bg-gray-200" />
        <div className="text-xs uppercase tracking-wide text-gray-500">Or continue with email</div>
        <div className="h-px flex-1 bg-gray-200" />
      </div>
    </div>
  )

  // New isolated LoginModal component
  const LoginModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPwd, setShowPwd] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const emailRef = useRef<HTMLInputElement | null>(null)
    useEffect(() => { if (open && emailRef.current) emailRef.current.focus() }, [open])

    const submit = async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)
      setLoading(true)
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      setLoading(false)
      if (error) setError(error.message)
      else {
        onClose()
        setEmail('')
        setPassword('')
        router.refresh()
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

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 gap-4">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <CubeIcon className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">MeepleGo</span>
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
                    'flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
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
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  aria-label="Search games"
                  placeholder="Search games"
                  value={navSearch}
                  onChange={onNavChange}
                  onFocus={() => setShowNavSuggestions(!!navSearch)}
                  onBlur={() => setTimeout(() => setShowNavSuggestions(false), 150)}
                  className={`pl-10 pr-3 py-2 border border-gray-300 rounded-md  text-sm font-medium leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 ${
                    navSearch.length > 0 || showNavSuggestions ? 'w-96' : 'w-56'
                  }`}
                />
              </div>
            </form>

            {showNavSuggestions && (
              <ul className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
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
                  <Link href="/login" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-800">Log in</Link>
                  <Link href="/signup" className="px-3 py-2 text-sm font-medium rounded-md bg-primary-600 text-white hover:bg-primary-700">Sign up</Link>
                </div>
                {/* Desktop: open modals */}
                <div className="hidden md:flex items-center gap-2">
                  <button onClick={() => { setShowSignupModal(false); setShowLoginModal(true) }} className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-800">Log in</button>
                  <button onClick={() => { setShowLoginModal(false); setShowSignupModal(true) }} className="px-3 py-2 text-sm font-medium rounded-md bg-primary-600 text-white hover:bg-primary-700">Sign up</button>
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
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                    <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">My Profile</Link>
                    <Link href="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Settings</Link>
                    <button
                      onClick={async () => { await supabase.auth.signOut(); setShowUserMenu(false); router.refresh() }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
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
      <div className="md:hidden border-t border-gray-200">
        <div className="px-4 py-3 relative">
          <form onSubmit={onSubmit} className="w-full">
            <div className="relative transition-all duration-300">
              <div className="absolute inset-y-0 left-0 pl-3 flex  text-sm font-medium items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                aria-label="Search games"
                placeholder="Search games"
                value={navSearch}
                onChange={onNavChange}
                onFocus={() => setShowNavSuggestions(!!navSearch)}
                onBlur={() => setTimeout(() => setShowNavSuggestions(false), 150)}
                className={`pl-10 pr-3 py-2 border border-gray-300  text-sm font-medium rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 ${
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
                  'flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium',
                  isActive
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
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
        <form onSubmit={onForgotSubmit} className="space-y-4 mt-2" key="forgot-form">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full border border-gray-300 bg-white text-gray-900 rounded-md px-3 py-2 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter your email"
            />
          </div>
          {forgotError && <p className="text-sm text-red-600">{forgotError}</p>}
          {forgotMessage && <p className="text-sm text-green-600">{forgotMessage}</p>}
          <button type="submit" disabled={forgotLoading} className="w-full inline-flex justify-center items-center px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50">
            {forgotLoading ? 'Sending…' : 'Send reset link'}
          </button>
          <div className="text-sm text-gray-600 text-center mt-2">
            Remembered it?{' '}
            <button type="button" onClick={() => { setShowForgotModal(false); setShowLoginModal(true) }} className="text-primary-600 hover:text-primary-700">Back to sign in</button>
          </div>
        </form>
      </ModalShell>
    </nav>
  )
}
