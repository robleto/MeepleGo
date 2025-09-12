'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function PersonalAwardsCTA() {
  const [status, setStatus] = useState<'loading'|'authed'|'anon'>('loading')
  const [year] = useState(()=> new Date().getFullYear())

  useEffect(()=> {
    let mounted = true
    supabase.auth.getSession().then(({ data })=> {
      if (!mounted) return
      setStatus(data.session ? 'authed' : 'anon')
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session)=> {
      setStatus(session ? 'authed' : 'anon')
    })
    return ()=> { mounted = false; sub.subscription.unsubscribe() }
  }, [])

  if (status==='loading') return <div className="text-xs text-gray-400">Checking session…</div>
  if (status==='authed') return (
    <a href={`/awards/my/${year}`} className="px-4 py-2 rounded-md bg-primary-600 text-white text-sm hover:bg-primary-500">View My {year} Awards</a>
  )
  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-sm text-gray-500 max-w-xl text-center">Log in to generate your own yearly awards based on the games you've rated and customize nominees and winners.</p>
      <a href="/login?next=/awards" className="px-4 py-2 rounded-md bg-primary-600 text-white text-sm hover:bg-primary-500">Log in to Start</a>
    </div>
  )
}
