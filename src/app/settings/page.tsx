"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace('/login')
      else setLoading(false)
    })
  }, [router])

  if (loading) return <div className="max-w-2xl mx-auto px-4 py-12">Loading…</div>

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Settings</h1>
      <p className="text-gray-600">Account and application settings will go here.</p>
    </div>
  )
}
