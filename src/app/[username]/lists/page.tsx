'use client'

import { Suspense, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import PageLayout from '@/components/Components/PageLayout'
import ProfileLayout from '@/components/Components/ProfileLayout'
import { ListsContent } from '@/app/lists/ListsContent'

interface Props {
  params: Promise<{ username: string }>
}

export default function UserListsPage({ params }: Props) {
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
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-[40vh]">
              <div className="animate-pulse text-sm text-gray-400">Loading lists…</div>
            </div>
          }
        >
          <ListsContent embedded forcedUserId={userId} username={username} />
        </Suspense>
      </ProfileLayout>
    </PageLayout>
  )
}
