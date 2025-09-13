'use client'
import { useState, useTransition } from 'react'
import { supabase } from '@/lib/supabase'

export default function AwardsRebuildButtons({
  year,
  staleOnly,
}: {
  year: number
  staleOnly?: boolean
}) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const trigger = async (onlyStale: boolean) => {
    setLoading(true)
    setMessage(null)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const headers: Record<string, string> = {}
      if (session?.access_token)
        headers['Authorization'] = `Bearer ${session.access_token}`
      const res = await fetch(
        `/api/awards/${year}/rebuild${onlyStale ? '?staleOnly=1' : ''}`,
        { method: 'POST', headers }
      )
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        setMessage(json?.error || 'Error')
      } else {
        setMessage(onlyStale ? 'Stale awards refreshed' : 'Rebuilt all awards')
        // Soft refresh page (server components)
        startTransition(() => {
          // relying on router refresh via location reload for simplicity
          window.location.reload()
        })
      }
    } catch (e: any) {
      setMessage(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex gap-2 items-center">
      {staleOnly && (
        <button
          disabled={loading}
          onClick={() => trigger(true)}
          className="px-2.5 py-1 rounded bg-amber-600 text-white text-xs hover:bg-amber-500 disabled:opacity-50"
        >
          {loading ? '…' : 'Refresh Stale Only'}
        </button>
      )}
      <button
        disabled={loading}
        onClick={() => trigger(false)}
        className="px-2.5 py-1 rounded bg-gray-800 text-white text-xs hover:bg-gray-700 disabled:opacity-50"
      >
        {loading ? '…' : 'Rebuild All'}
      </button>
      {message && <span className="text-[11px] text-gray-500">{message}</span>}
    </div>
  )
}
