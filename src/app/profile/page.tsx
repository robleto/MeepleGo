'use client'

import { useEffect, useState } from 'react'
import ProfileLayout from '@/components/Components/ProfileLayout'
import ForYouOverview from '@/components/Components/ForYouOverview'
import { supabase } from '@/lib/supabase'

export default function ProfileOverviewPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!session?.user?.id) {
          if (!cancelled) setLoading(false)
          return
        }
        const uid = session.user.id
        if (!cancelled) setUserId(uid)

        const { data } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', uid)
          .maybeSingle()
        if (!cancelled) setUsername(data?.username ?? null)
      } catch (error) {
        console.error('Error loading profile overview:', error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <ProfileLayout userId={userId ?? undefined} username={username ?? undefined}>
      {loading ? (
        <div className="py-10 text-center text-sm text-gray-500">Loading…</div>
      ) : userId ? (
        <ForYouOverview userId={userId} username={username} />
      ) : (
        <div className="py-10 text-center text-sm text-gray-500">
          Sign in to view your profile.
        </div>
      )}
    </ProfileLayout>
  )
}
