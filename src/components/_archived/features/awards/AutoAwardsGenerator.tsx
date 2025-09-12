"use client";
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Props {
  year: number
  hasServerSession: boolean
  onAwardsGenerated?: () => void
}

export default function AutoAwardsGenerator({ year, hasServerSession, onAwardsGenerated }: Props) {
  const [generating, setGenerating] = useState(false)
  const [attempted, setAttempted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (hasServerSession || attempted) return

    const tryGenerate = async () => {
      setGenerating(true)
      setAttempted(true)
      setError(null)
      
      try {
        // Check if we have client session
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          setError('No client session found')
          return
        }

        // Use rebuild API with bearer token
        const headers: Record<string,string> = {}
        if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`
        
        const res = await fetch(`/api/awards/${year}/rebuild`, { 
          method: 'POST', 
          headers 
        })
        
        const result = await res.json().catch(() => ({ error: 'Invalid response' }))
        
        if (res.ok && result.ok) {
          // Success - trigger page refresh after short delay
          setTimeout(() => window.location.reload(), 500)
        } else {
          setError(result.error || `HTTP ${res.status}`)
        }
      } catch (e: any) {
        setError(e.message || 'Unknown error')
      } finally {
        setGenerating(false)
      }
    }

    // Small delay to avoid race conditions
    const timer = setTimeout(tryGenerate, 100)
    return () => clearTimeout(timer)
  }, [year, hasServerSession, attempted, onAwardsGenerated])

  if (hasServerSession) return null
  
  if (error) {
    return (
      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
        ❌ Auto-generation failed: {error}
        <button 
          onClick={() => { setAttempted(false); setError(null) }}
          className="ml-2 underline hover:no-underline"
        >
          Retry
        </button>
      </div>
    )
  }

  if (generating) {
    return (
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
        ⚡ Auto-generating your {year} awards...
      </div>
    )
  }

  return null
}
