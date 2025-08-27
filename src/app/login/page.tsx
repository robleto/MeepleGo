'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'

function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [magicSending, setMagicSending] = useState(false)
  const [magicSent, setMagicSent] = useState(false)

  // If already authenticated, skip login form
  const searchParams = useSearchParams()
  const nextPath = searchParams.get('next') || '/'
  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      if (data.session) {
        router.replace(nextPath)
      }
    })
    return () => { mounted = false }
  }, [router, nextPath])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setLoading(false)
    if (error) {
      // Provide friendlier guidance for common failures
      if (/invalid login credentials/i.test(error.message)) {
        setError('Invalid login credentials.')
        setInfo('Tips: 1) Make sure you used the most recent reset email link. 2) Email comparison is case-insensitive but password is case-sensitive. 3) If you just changed the password in another browser/profile, hard refresh here. 4) Ensure this environment matches where you reset (dev vs prod project).')
      } else if (/email not confirmed/i.test(error.message)) {
        setError('Email not confirmed.')
        setInfo('Check your inbox for the confirmation email, then try again after confirming.')
      } else {
        setError(error.message)
      }
      // Append HTTP status if available (Supabase AuthError is not strongly typed for status)
      const anyErr = error as unknown as { status?: number }
      if (typeof anyErr.status === 'number') {
        setInfo(prev => (prev ? prev + '\nHTTP status: ' + anyErr.status : 'HTTP status: ' + anyErr.status))
      }
      return
    }
    // If sign-in succeeded but session missing (rare), surface diagnostic
    if (!data.session) {
      setInfo('Sign-in returned without a session. Try clearing cookies/localStorage for this site and retry.')
      return
    }
  router.push(nextPath)
  }

  const sendMagicLink = async () => {
    setError(null)
    setInfo(null)
    setMagicSending(true)
  const redirectBase = process.env.NEXT_PUBLIC_AUTH_REDIRECT_BASE || window.location.origin
  const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: false, emailRedirectTo: `${redirectBase}/auth/callback` } })
    setMagicSending(false)
    if (error) {
      setError(error.message)
      setInfo('Magic link failed. If this email is not registered in this Supabase project you will always see invalid credentials.')
    } else {
      setMagicSent(true)
      setInfo('Magic link sent (if the email exists). Check inbox/spam. If no email arrives, the user likely does not exist in this project or SMTP settings are off.')
    }
  }

  return (
    <AuthLayout
      title="Log in"
      subtitle="Access your board game dashboards and rankings"
      footer={<span>Protected by Supabase Auth • <a href="/reset-password" className="underline hover:text-gray-700 dark:hover:text-gray-300">Reset password</a></span>}
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-1">
          <label className="block text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(p => !p)}
              className="absolute inset-y-0 right-0 px-3 flex items-center text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {info && <p className="text-[11px] leading-snug text-gray-600 dark:text-gray-400 whitespace-pre-line">{info}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex justify-center items-center px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Logging in…' : 'Log in'}
        </button>
        <div className="flex items-center justify-between text-xs pt-1">
          <button type="button" onClick={sendMagicLink} disabled={!email || magicSending || magicSent} className="underline disabled:opacity-40">
            {magicSent ? 'Magic link sent' : magicSending ? 'Sending…' : 'Send magic link'}
          </button>
          <span className="text-[10px] text-gray-500">Diagnostic: tests email existence</span>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 pt-1">
          <a href="/signup" className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">Create account</a>
          <a href="/reset-password" className="hover:text-gray-800 dark:hover:text-gray-200">Forgot password?</a>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 rounded bg-gray-50 dark:bg-gray-900/40 p-2 border border-dashed border-gray-300 dark:border-gray-700 text-[10px] text-gray-500 dark:text-gray-400">
            Dev: Supabase URL host → {(() => { try { return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || '').host } catch { return 'n/a' } })()}
          </div>
        )}
      </form>
    </AuthLayout>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}
