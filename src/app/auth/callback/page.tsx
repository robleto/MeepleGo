"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null
    // If we already have a session, go home
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.replace('/')
      }
    })
    // Also listen for the sign-in event when Supabase parses the URL hash
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        // small delay to ensure session is written
        timer = setTimeout(() => router.replace('/'), 100)
      }
    })
    return () => {
      sub.subscription.unsubscribe()
      if (timer) clearTimeout(timer)
    }
  }, [router])

  return (
    <div className="max-w-md mx-auto px-4 py-12 text-center text-gray-600">Completing sign-in…</div>
  )
}
