'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { trackEvent } from '@/lib/analytics'
import { captureError } from '@/lib/errorTracking'
import AuthLayout from '@/components/Components/AuthLayout'

export default function SignUpPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [validatingCode, setValidatingCode] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)
    
    // Validate invite code first
    setValidatingCode(true)
    const codeValidation = await fetch('/api/auth/validate-invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: inviteCode }),
    })
    const codeResult = await codeValidation.json()
    setValidatingCode(false)
    
    if (!codeResult.valid) {
      setLoading(false)
      return setError(codeResult.error || 'Invalid invite code')
    }
    
    // Track signup start
    trackEvent('signup_start', { method: 'email' })
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          invite_code_used: inviteCode.toUpperCase(),
        },
      },
    })
    
    if (error) {
      captureError(error, { context: 'signup', email })
      setLoading(false)
      return setError(error.message)
    }
    
    if (data.user) {
      // Increment the invite code usage
      await fetch('/api/auth/validate-invite', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: inviteCode }),
      })
      
      setMessage('Check your email to confirm your account.')
    }
    
    setLoading(false)
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start tracking and ranking your collection"
      footer={
        <span>By creating an account you agree to basic usage terms.</span>
      }
    >
      <div className="mb-4 p-3 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          🎲 MeepleGo is currently in private beta. You'll need an invite code to sign up.
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-1">
          <label className="block text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">
            Invite Code
          </label>
          <input
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            required
            placeholder="BETA2025"
            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 uppercase"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Enter your invite code to access the private beta
          </p>
        </div>
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
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-green-600">{message}</p>}
        <button
          type="submit"
          disabled={loading || validatingCode}
          className="w-full inline-flex justify-center items-center px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          {validatingCode ? 'Validating code…' : loading ? 'Creating…' : 'Sign up'}
        </button>
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 pt-1">
          <a
            href="/login"
            className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
          >
            Have an account? Log in
          </a>
        </div>
      </form>
    </AuthLayout>
  )
}
