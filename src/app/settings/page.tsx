'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  // Density must be declared before any conditional return to keep hook order stable
  const [density, setDensity] = useState<string>('expanded')

  // Load stored density preference once on mount (client only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('listDensity')
      if (stored && stored !== density) setDensity(stored)
    }
    // we intentionally leave density out to avoid triggering if user changes it later
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace('/login')
      else setLoading(false)
    })
  }, [router])

  if (loading)
    return <div className="max-w-2xl mx-auto px-4 py-12">Loading…</div>
  const updateDensity = (val: string) => {
    setDensity(val)
    localStorage.setItem('listDensity', val)
    window.dispatchEvent(
      new CustomEvent('list-density-change', { detail: val })
    )
  }
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-10">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600 text-sm">
          Update how MeepleGo appears and behaves for your account.
        </p>
      </div>
      <section className="space-y-4">
        <h2 className="text-lg font-medium text-gray-900">List Density</h2>
        <p className="text-xs text-gray-500 max-w-prose">
          Choose how much information is shown for each game in list view. You
          can still open the detail modal for full context.
        </p>
        <div className="grid sm:grid-cols-3 gap-3">
          <button
            onClick={() => updateDensity('expanded')}
            className={`rounded-lg border p-4 text-left text-sm transition ${density === 'expanded' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}
          >
            Rich Detail
            <div className="text-[11px] text-gray-500 mt-1">
              Full tagline + meta
            </div>
          </button>
          <button
            onClick={() => updateDensity('balanced')}
            className={`rounded-lg border p-4 text-left text-sm transition ${density === 'balanced' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}
          >
            Balanced
            <div className="text-[11px] text-gray-500 mt-1">Meta only</div>
          </button>
          <button
            onClick={() => updateDensity('compact')}
            className={`rounded-lg border p-4 text-left text-sm transition ${density === 'compact' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}
          >
            Ultra Compact
            <div className="text-[11px] text-gray-500 mt-1">
              Year beside name
            </div>
          </button>
        </div>
      </section>
    </div>
  )
}
