"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackHandlerPage() {
  const router = useRouter()

  useEffect(() => {
    // Supabase attaches access_token etc in the URL hash; get it and then redirect
    supabase.auth.getSession().then(() => {
      router.replace('/')
    })
  }, [router])

  return (
    <div className="max-w-md mx-auto px-4 py-12 text-center text-gray-600">Completing sign-in…</div>
  )
}
