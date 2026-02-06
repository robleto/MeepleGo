'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import PageLayout from '@/components/Components/PageLayout'
import ProfileLayout from '@/components/Components/ProfileLayout'
import PlaysClientPage from '@/app/plays/playsClient'

interface Props {
  params: Promise<{ username: string }>
}

export default function UserJournalPage({ params }: Props) {
  const [username, setUsername] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    params.then(({ username }) => {
      setUsername(username)
      loadUserByUsername(username)
    })
  }, [params])

  const loadUserByUsername = async (username: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single()

    if (data) setUserId(data.id)
    setLoading(false)
  }

  if (loading || !userId || !username) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <ProfileLayout userId={userId} username={username}>
        <div className="mt-6">
          <PlaysClientPage forcedUserId={userId} readOnly embedded />
        </div>
      </ProfileLayout>
    </PageLayout>
  )
}
