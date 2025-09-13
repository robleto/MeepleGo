'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/Components/AuthLayout'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)
    const redirectBase =
      process.env.NEXT_PUBLIC_AUTH_REDIRECT_BASE || window.location.origin
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${redirectBase}/update-password`,
    })
    setLoading(false)
    if (error) return setError(error.message)
    setMessage('If an account exists, you will receive an email shortly.')
  }

  return (
    <AuthLayout
      title="Reset password"
      subtitle="We'll email you a secure link"
      footer={
        <a
          href="/login"
          className="underline hover:text-gray-700 dark:hover:text-gray-300"
        >
          Back to login
        </a>
      }
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
        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-green-600">{message}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex justify-center items-center px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Sending…' : 'Send reset link'}
        </button>
      </form>
    </AuthLayout>
  )
}
