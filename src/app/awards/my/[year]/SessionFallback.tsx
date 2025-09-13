'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function SessionFallback({ year }: { year: number }) {
  const [hasSession, setHasSession] = useState<boolean | null>(null)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session)
    })
  }, [])
  if (hasSession === null) return null
  if (hasSession) return null
  return (
    <div className="mb-6 p-4 rounded border bg-gray-50 text-sm text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300">
      Log in to generate and edit your personalized {year} awards.{' '}
      <a href={`/login?next=/awards/my/${year}`} className="underline">
        Sign in
      </a>
    </div>
  )
}
