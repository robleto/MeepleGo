'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { trackEvent } from '@/lib/analytics'
import { captureError } from '@/lib/errorTracking'

function HandleInner() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  // Only allow E2E mode via build-time env var (not URL params, which users can set)
  const isE2E = process.env.NEXT_PUBLIC_E2E_MODE === '1'

  useEffect(() => {
    const run = async () => {
      try {
        // Look for explicit errors first
        const urlParams = new URLSearchParams(window.location.search)
        const hashParams = new URLSearchParams(
          window.location.hash.substring(1)
        )
        const urlError = urlParams.get('error') || hashParams.get('error')
        const errorDescription =
          urlParams.get('error_description') ||
          hashParams.get('error_description')
        if (process.env.NODE_ENV === 'development') {
          // Helpful dev logging
          if (urlError)
            console.error('URL Auth error:', urlError, errorDescription)
        }
        if (urlError) {
          setError(errorDescription || urlError)
          captureError(new Error(errorDescription || urlError), {
            context: 'auth_callback',
            error: urlError,
          })
          setTimeout(
            () =>
              router.replace(
                '/login?error=' +
                  encodeURIComponent(errorDescription || urlError)
              ),
            1500
          )
          return
        }

        // Prefer PKCE code exchange when present (modern Supabase email links)
        const code = urlParams.get('code')
        if (code && !isE2E) {
          const { error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code)
          if (exchangeError) {
            setError(exchangeError.message)
            captureError(exchangeError, {
              context: 'auth_callback_exchange_code',
            })
            setTimeout(
              () =>
                router.replace(
                  '/login?error=' + encodeURIComponent(exchangeError.message)
                ),
              1500
            )
            return
          }
        }

        if (!isE2E) {
          // Give Supabase time to detect and persist the session (from hash or code exchange)
          let sessionData:
            | Awaited<ReturnType<typeof supabase.auth.getSession>>['data']
            | null = null
          let sessionError: any = null
          for (let i = 0; i < 4; i++) {
            const res = await supabase.auth.getSession()
            sessionData = res.data
            sessionError = res.error
            if (sessionData?.session) break
            await new Promise((r) => setTimeout(r, 200))
          }

          if (sessionError) {
            if (process.env.NODE_ENV === 'development')
              console.error('Session error:', sessionError)
            setError(sessionError.message)
            captureError(sessionError, { context: 'auth_callback_session' })
            setTimeout(
              () =>
                router.replace(
                  '/login?error=' + encodeURIComponent(sessionError.message)
                ),
              1500
            )
            return
          }

          if (!sessionData?.session) {
            setError('Session not found after callback')
            captureError(new Error('Session not found after callback'), {
              context: 'auth_callback_no_session',
            })
            setTimeout(
              () =>
                router.replace(
                  '/login?error=' + encodeURIComponent('Session not found')
                ),
              1500
            )
            return
          }
        }

        // Determine flow: recovery vs. login
        const type = urlParams.get('type') || hashParams.get('type')
        
        // Track successful callback
        trackEvent('callback_success', {
          type: type || 'login',
        })
        if (type === 'recovery') {
          router.replace('/update-password')
          return
        }

        const next = urlParams.get('next') || hashParams.get('next')
        router.replace(next || '/')
      } catch (err) {
        if (process.env.NODE_ENV === 'development')
          console.error('Unexpected auth error:', err)
        setError('Unexpected error during auth processing')
        captureError(
          err instanceof Error ? err : new Error('Unexpected auth error'),
          { context: 'auth_callback_exception' }
        )
        setTimeout(
          () =>
            router.replace(
              '/login?error=' + encodeURIComponent('Authentication failed')
            ),
          1500
        )
      }
    }
    const t = setTimeout(run, 50)
    return () => clearTimeout(t)
  }, [router])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center">
        <div>
          <h1 className="text-lg font-semibold text-red-600">
            Authentication Error
          </h1>
          <p className="text-gray-600 mt-2 text-sm">{error}</p>
          <p className="text-gray-500 text-xs mt-2">Redirecting…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center text-center text-gray-700">
      <div>
        <h1 className="text-lg font-semibold">Completing authentication…</h1>
        <p className="text-gray-600 mt-2 text-sm">
          Please wait while we verify your session.
        </p>
      </div>
    </div>
  )
}

export default function AuthCallbackHandlePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen grid place-items-center">Loading…</div>
      }
    >
      <HandleInner />
    </Suspense>
  )
}
