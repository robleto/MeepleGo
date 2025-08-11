"use client"

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackHandlerPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Supabase attaches access_token etc in the URL hash; get it and then redirect
    supabase.auth.getSession().then(() => {
      // Check if there's a next parameter (for password reset flow)
      const next = searchParams.get('next')
      if (next) {
        router.replace(next)
      } else {
        router.replace('/')
      }
    })
  }, [router, searchParams])

  return (
    <div className="max-w-md mx-auto px-4 py-12 text-center text-gray-600">Completing sign-in…</div>
  )
}
