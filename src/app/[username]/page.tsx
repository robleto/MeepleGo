'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import PageLayout from '@/components/Components/PageLayout'
import ProfileLayout from '@/components/Components/ProfileLayout'
import ProfileOverviewContent from '@/components/Profile/ProfileOverviewContent'
import Link from 'next/link'

interface Props {
  params: Promise<{ username: string }>
}

export default function UserProfilePage({ params }: Props) {
  const router = useRouter()
  const [username, setUsername] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    params.then(({ username }) => {
      setUsername(username)
      loadUserByUsername(username)
    })
  }, [params])

  const loadUserByUsername = async (username: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .single()

      if (error || !data) {
        setNotFound(true)
        return
      }

      setUserId(data.id)
    } catch (error) {
      console.error('Error loading user:', error)
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </PageLayout>
    )
  }

  if (notFound || !userId || !username) {
    return (
      <PageLayout>
        <div className="text-center py-12">
          <p className="text-gray-600">User not found</p>
          <Link href="/profile/friends" className="text-sky-600 hover:text-sky-700 text-sm mt-4 inline-block">
            Back to Friends
          </Link>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <ProfileLayout userId={userId} username={username}>
        <ProfileOverviewContent forcedUserId={userId} username={username} />
      </ProfileLayout>
    </PageLayout>
  )
}
