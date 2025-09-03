"use client"
import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'
import AwardsLoggedOutHero from './AwardsLoggedOutHero'

// Client-side gate to ensure the logged-out hero never persists when a user session exists.
export default function HeroAuthGate({ serverLoggedIn }: { serverLoggedIn: boolean }) {
  const [loggedIn, setLoggedIn] = useState(serverLoggedIn)

  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !anon) return null
    return createClient(url, anon)
  }, [])

  useEffect(() => {
    let mounted = true
    if (!supabase) return
    // Fetch session once on mount
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      if (data.session) setLoggedIn(true)
    })
    // Listen for auth state changes to update immediately after login/logout
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      setLoggedIn(!!session)
    })
    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [supabase])

  if (loggedIn) return null
  return <AwardsLoggedOutHero />
}
