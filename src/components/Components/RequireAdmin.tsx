'use client'
import { useEffect, useState, ReactNode } from 'react'
import supabase from '@/lib/supabase'

export default function RequireAdmin({ children }: { children: ReactNode }) {
  const [state, setState] = useState<'loading' | 'forbidden' | 'ok'>('loading')
  useEffect(() => {
    let active = true
    ;(async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        if (active) setState('forbidden')
        return
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .maybeSingle()
      if (!profile?.is_admin) {
        if (active) setState('forbidden')
        return
      }
      if (active) setState('ok')
    })()
    return () => {
      active = false
    }
  }, [])
  if (state === 'loading')
    return (
      <div className="py-16 text-center text-sm text-gray-500">
        Checking access…
      </div>
    )
  if (state === 'forbidden')
    return (
      <div className="py-16 text-center text-sm text-red-600">
        Access denied.
      </div>
    )
  return <>{children}</>
}
