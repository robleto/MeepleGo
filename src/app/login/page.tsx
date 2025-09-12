'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/Components/AuthLayout'

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
  const [resendPending, setResendPending] = useState(false)
  const redirectBase = process.env.NEXT_PUBLIC_AUTH_REDIRECT_BASE || (typeof window !== 'undefined' ? window.location.origin : '')
  const [status, setStatus] = useState<'idle'|'auth-check'|'submitting'|'redirecting'|'magic-sent'>('idle')

  // If already authenticated, skip login form
  const searchParams = useSearchParams()
  const nextPath = searchParams.get('next') || '/'
  useEffect(() => {
    let mounted = true
    setStatus('auth-check')
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      if (data.session) {
        setStatus('redirecting')
        router.replace(nextPath)
      } else {
        setStatus('idle')
      }
    })
    return () => { mounted = false }
  }, [router, nextPath])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
  setLoading(true)
  setStatus('submitting')
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setLoading(false)
    if (error) {
      // Provide friendlier guidance for common failures
      if (/invalid login credentials/i.test(error.message)) {
        setError('Invalid login credentials.')
        setInfo('Tips: 1) Make sure you used the most recent reset email link. 2) Email comparison is case-insensitive but password is case-sensitive. 3) If you just changed the password in another browser/profile, hard refresh here. 4) Ensure this environment matches where you reset (dev vs prod project).')
      } else if (/email not confirmed/i.test(error.message)) {
        setError('Email not confirmed.')
        setInfo('Check your inbox for the confirmation email, then try again after confirming. You can also resend it below.')
      } else {
        setError(error.message)
      }
      // Append HTTP status if available (Supabase AuthError is not strongly typed for status)
      const anyErr = error as unknown as { status?: number }
      if (typeof anyErr.status === 'number') {
        setInfo(prev => (prev ? prev + '\nHTTP status: ' + anyErr.status : 'HTTP status: ' + anyErr.status))
      }
      setStatus('idle')
      return
    }
    // If sign-in succeeded but session missing (rare), surface diagnostic
    if (!data.session) {
      setInfo('Sign-in returned without a session. Try clearing cookies/localStorage for this site and retry.')
      setStatus('idle')
      return
    }
    setStatus('redirecting')
    router.push(nextPath)
  }

  const sendMagicLink = async () => {
    setError(null)
    setInfo(null)
    setMagicSending(true)
    setStatus('submitting')
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: false, emailRedirectTo: `${redirectBase}/auth/callback` } })
    setMagicSending(false)
    if (error) {
      setError(error.message)
      setInfo('Magic link failed. If this email is not registered in this Supabase project you will always see invalid credentials.')
      setStatus('idle')
    } else {
      setMagicSent(true)
      setInfo('Magic link sent (if the email exists). Check inbox/spam. If no email arrives, the user likely does not exist in this project or SMTP settings are off.')
      setStatus('magic-sent')
    }
  }

  const resendConfirmation = async () => {
  setResendPending(true)
    setError(null)
    setInfo(null)
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim(), options: { emailRedirectTo: `${redirectBase}/auth/callback` } })
      if (error) {
        setError(error.message)
      } else {
        setInfo('If the account exists and is unconfirmed, a new confirmation email was sent.')
      }
    } finally {
      setResendPending(false)
    }
  }

  return (
    <AuthLayout
      title="Log in"
      subtitle="Access your board game dashboards and rankings"
      footer={<span>Protected by Supabase Auth • <a href="/reset-password" className="underline hover:text-gray-700 dark:hover:text-gray-300">Reset password</a></span>}
    >
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
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
            aria-describedby={error? 'auth-error' : info? 'auth-info' : undefined}
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
              aria-describedby={error? 'auth-error' : undefined}
            />
            <button
              type="button"
              onClick={() => setShowPassword(p => !p)}
              className="absolute inset-y-0 right-0 px-3 flex items-center text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 rounded"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              <span className="sr-only">{showPassword ? 'Hide password' : 'Show password'}</span>
              {showPassword ? (
                <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.5a10.522 10.522 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
              ) : (
                <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.644C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .638C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              )}
            </button>
          </div>
        </div>
        <div aria-live="polite" className="space-y-2">
          {error && <p id="auth-error" className="text-sm text-red-600">{error}</p>}
          {info && <p id="auth-info" className="text-[11px] leading-snug text-gray-600 dark:text-gray-400 whitespace-pre-line">{info}</p>}
          {status === 'submitting' && !error && <p className="text-[11px] text-primary-600 flex items-center gap-2"><span className="w-3 h-3 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" /> Authenticating…</p>}
          {status === 'redirecting' && <p className="text-[11px] text-primary-600">Redirecting…</p>}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex justify-center items-center gap-2 px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          {loading && <span className="w-4 h-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />}
          {loading ? 'Logging in…' : 'Log in'}
        </button>
        {error === 'Email not confirmed.' && (
          <div className="flex items-center justify-between text-xs pt-1">
            <button type="button" onClick={resendConfirmation} disabled={!email || resendPending} className="underline disabled:opacity-40">{resendPending ? 'Resending…' : 'Resend confirmation email'}</button>
            <span className="text-[10px] text-gray-500">Uses Supabase resend()</span>
          </div>
        )}
        <div className="flex items-center justify-between text-xs pt-1">
          <button type="button" onClick={sendMagicLink} disabled={!email || magicSending || magicSent} className="underline disabled:opacity-40">
            {magicSent ? 'Magic link sent' : magicSending ? 'Sending…' : 'Send magic link'}
          </button>
          <span className="text-[10px] text-gray-500">{!email ? 'Enter email to enable' : magicSent ? 'Check your inbox' : 'Password-less option'}</span>
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
