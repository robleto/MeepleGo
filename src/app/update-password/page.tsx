'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { trackEvent } from '@/lib/analytics'
import { captureError } from '@/lib/errorTracking'
import AuthLayout from '@/components/Components/AuthLayout'
import Alert from '@/components/Components/Alert'
import { useAuthErrorMessage } from '@/hooks/useAuthErrorMessage'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const friendlyError = useAuthErrorMessage(error)

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()
      if (error) {
        if (process.env.NODE_ENV === 'development')
          console.error('Session error:', error)
        setError('Invalid or expired reset link. Please try again.')
        return
      }
      if (!session) {
        setError('No active session found. Please use a valid reset link.')
        return
      }
    }

    checkSession()
  }, [])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) {
      captureError(error, { context: 'update_password' })
      return setError(error.message)
    }
    
    // Track password updated
    trackEvent('password_updated')
    
    setMessage('Your password has been updated.')
    setTimeout(() => router.push('/login'), 1500)
  }

  return (
    <AuthLayout
      title="Choose a new password"
      subtitle="Set a strong password you haven't used before"
      footer={
        <a
          href="/login"
          className="underline hover:text-gray-700 dark:hover:text-gray-300"
        >
          Return to login
        </a>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-1">
          <label className="block text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">
            New password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        {friendlyError && (
          <Alert variant="error" role="alert">
            {friendlyError}
          </Alert>
        )}
        {message && (
          <Alert variant="success" role="status">
            {message}
          </Alert>
        )}
        <button
          type="submit"
          disabled={loading || !!message}
          className="w-full inline-flex justify-center items-center px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </AuthLayout>
  )
}
