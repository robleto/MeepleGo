"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AuthProvidersTestPage() {
  const [session, setSession] = useState<import('@supabase/supabase-js').Session | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<string>('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => setSession(session))
    return () => sub.subscription.unsubscribe()
  }, [])

  const signInWithOAuth = async (provider: 'google' | 'facebook' | 'github') => {
    setStatus(`Redirecting to ${provider}…`)
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  const testSignup = async () => {
    setStatus('Signing up and sending confirmation email…')
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    setStatus(error ? `Error: ${error.message}` : 'Sent. Check your inbox for the confirmation email.')
  }

  const testLogin = async () => {
    setStatus('Logging in…')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setStatus(error ? `Error: ${error.message}` : 'Logged in (if credentials are valid).')
  }

  const testReset = async () => {
    setStatus('Sending password reset email…')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    })
    setStatus(error ? `Error: ${error.message}` : 'Sent. Check your inbox for the reset email.')
  }

  const signOut = async () => {
    setStatus('Signing out…')
    const { error } = await supabase.auth.signOut()
    setStatus(error ? `Error: ${error.message}` : 'Signed out.')
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">Auth Diagnostics</h1>
      <p className="text-gray-600 mb-6">Quickly test Email and OAuth providers configured in Supabase.</p>

      <div className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="font-medium text-gray-900 mb-3">Current session</div>
          <pre className="text-xs bg-gray-50 p-3 rounded border border-gray-200 overflow-auto">{JSON.stringify(session, null, 2)}</pre>
          {session && (
            <button onClick={signOut} className="mt-3 inline-flex items-center px-3 py-2 rounded-md bg-gray-900 text-white hover:bg-gray-800">Sign out</button>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="font-medium text-gray-900 mb-3">OAuth providers</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button onClick={() => signInWithOAuth('google')} className="px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-50">Continue with Google</button>
            <button onClick={() => signInWithOAuth('facebook')} className="px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-50">Continue with Facebook</button>
            <button onClick={() => signInWithOAuth('github')} className="px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-50">Continue with GitHub</button>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="font-medium text-gray-900 mb-3">Email tests</div>
          <div className="grid grid-cols-1 gap-3">
            <input
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <input
              type="password"
              placeholder="password (for signup/login test)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <div className="flex flex-wrap gap-3">
              <button onClick={testSignup} className="px-3 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700">Send confirm (Sign up)</button>
              <button onClick={testLogin} className="px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-50">Test login</button>
              <button onClick={testReset} className="px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-50">Send reset</button>
            </div>
          </div>
        </div>

        {status && <div className="text-sm text-gray-700">{status}</div>}
      </div>
    </div>
  )
}
