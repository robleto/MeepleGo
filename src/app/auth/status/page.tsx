'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface SessInfo {
  present: boolean
  userId?: string
  email?: string
  expires?: string
  fromStorage?: boolean
}

export default function AuthStatusPage() {
  const [sessionInfo, setSessionInfo] = useState<SessInfo | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const { data } = await supabase.auth.getSession()
        if (!mounted) return
        const sess = data.session
        setSessionInfo({
          present: !!sess,
          userId: sess?.user?.id,
          email: sess?.user?.email,
          expires: sess?.expires_at
            ? new Date(sess.expires_at * 1000).toISOString()
            : undefined,
        })
      } catch (e: any) {
        setError(e.message)
      }
    }
    load()

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, sess) => {
      if (!mounted) return
      setSessionInfo({
        present: !!sess,
        userId: sess?.user?.id,
        email: sess?.user?.email,
        expires: sess?.expires_at
          ? new Date(sess.expires_at * 1000).toISOString()
          : undefined,
      })
    })
    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  return (
    <div className="max-w-md mx-auto px-4 py-10 space-y-4 text-sm">
      <h1 className="text-xl font-semibold">Auth Status</h1>
      {error && <p className="text-red-600">{error}</p>}
      {sessionInfo ? (
        <pre className="bg-gray-100 dark:bg-gray-900/40 p-3 rounded overflow-x-auto text-xs">
          {JSON.stringify(sessionInfo, null, 2)}
        </pre>
      ) : (
        <p>Loading…</p>
      )}
      <div className="flex gap-2">
        <button
          onClick={() => supabase.auth.signOut()}
          className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-xs hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          Sign out
        </button>
        <button
          onClick={async () => {
            const { data } = await supabase.auth.getSession()
            setSessionInfo({
              present: !!data.session,
              userId: data.session?.user?.id,
              email: data.session?.user?.email,
              expires: data.session?.expires_at
                ? new Date(data.session.expires_at * 1000).toISOString()
                : undefined,
            })
          }}
          className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-xs hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          Refresh
        </button>
      </div>
      <p className="text-[10px] text-gray-500">
        Remove this page before production. Helpful for verifying that password
        resets actually create a new session.
      </p>
    </div>
  )
}
