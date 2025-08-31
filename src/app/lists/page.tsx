'use client'

import { useState, useEffect, useMemo } from 'react'
import PageLayout from '@/components/PageLayout'
import Heading from '@/components/Heading'
import { supabase } from '@/lib/supabase'
import { GameList, GameListWithItems, Profile } from '@/types/supabase'
import ListCard from '@/components/lists/ListCard'
import CreateListModal from '@/components/lists/CreateListModal'
import { PlusIcon } from '@heroicons/react/24/outline'

export default function ListsPage() {
  const [userLists, setUserLists] = useState<GameListWithItems[]>([])
  const [publicLists, setPublicLists] = useState<GameListWithItems[]>([])
  const [loading, setLoading] = useState(true)
  const [isGuest, setIsGuest] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  const fetchProfile = async (uid: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id,is_admin')
      .eq('id', uid)
      .maybeSingle()
    if (!error && data) setIsAdmin(Boolean((data as any).is_admin))
  }

  const fetchLists = async () => {
    setLoading(true)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        setIsGuest(true)
        setUserId(null)
        // Still fetch public lists for guests
        await fetchPublicLists()
        return
      }

      setIsGuest(false)
      setUserId(session.user.id)
      await Promise.all([
        fetchUserLists(session.user.id),
        fetchPublicLists(),
        fetchProfile(session.user.id),
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLists()
  }, [])

  const fetchUserLists = async (userId: string) => {
    const { data, error } = await supabase
      .from('game_lists')
      .select(
        `
        *,
        game_list_items(
          *,
          game:games(*)
        )
      `
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching user lists:', error)
      return
    }

    setUserLists(data || [])
  }

  const fetchPublicLists = async () => {
    const { data, error } = await supabase
      .from('game_lists')
      .select(
        `
        *,
        game_list_items(
          *,
          game:games(*)
        )
      `
      )
      .eq('is_public', true)
      .order('updated_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('Error fetching public lists:', error)
      return
    }

    setPublicLists(data || [])
  }

  const defaultLists = useMemo(() => {
    return userLists.filter((list) =>
      ['library', 'wishlist'].includes(list.list_type)
    )
  }, [userLists])

  const customLists = useMemo(() => {
    return userLists.filter((list) => list.list_type === 'custom')
  }, [userLists])

  // If admin, treat public lists as editable (show within "My Lists" as well for convenience)
  const adminEditablePublic = useMemo(() => {
    if (!isAdmin) return []
    return publicLists.filter(
      (pl) => !userLists.find((ul) => ul.id === pl.id) // avoid duplicates
    )
  }, [isAdmin, publicLists, userLists])

  const handleCreateList = async (listData: {
    name: string
    description?: string
    is_public: boolean
  }) => {
    if (!userId) return

    const { data, error } = await supabase
      .from('game_lists')
      .insert({
        user_id: userId,
        name: listData.name,
        description: listData.description,
        is_public: listData.is_public,
        list_type: 'custom',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating list:', error)
      return
    }

    // Refresh lists
    await fetchUserLists(userId)
    setShowCreateModal(false)
  }

  if (loading) {
    return (
      <PageLayout>
        <div className="py-20 text-center text-gray-500 dark:text-gray-400">
          Loading lists...
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className="space-y-8">
        {/* My Lists Section */}
        <div>
          <div className="mb-2">
            <h1 className="text-lg font-semibold tracking-wide text-gray-400 uppercase">
              {isGuest ? 'Discover Lists' : 'My Lists'}
            </h1>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-2xl">
            {isGuest
              ? 'Browse public community and BGG powered lists. Sign in to build and curate your own collections.'
              : 'Your personal library, wishlist, and custom curated collections. Create, edit, and share public lists.'}
          </p>

          {isGuest ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
              <Heading as="h2" size="md" className="mb-2">
                Create Your Own Lists
              </Heading>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Sign up to create custom game lists, organize your collection,
                and share with friends.
              </p>
              <button className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 transition-colors">
                Sign Up to Get Started
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {/* Default Lists (Library & Wishlist) */}
              {defaultLists.map((list) => (
                <ListCard
                  key={list.id}
                  list={list}
                  onUpdate={() => fetchUserLists(userId!)}
                />
              ))}

              {/* Custom Lists */}
              {customLists.map((list) => (
                <ListCard
                  key={list.id}
                  list={list}
                  onUpdate={() => fetchUserLists(userId!)}
                />
              ))}

              {/* Admin additional editable public lists */}
              {adminEditablePublic.map((list) => (
                <ListCard
                  key={list.id}
                  list={list}
                  onUpdate={() => {
                    fetchPublicLists()
                    if (userId) fetchUserLists(userId)
                  }}
                />
              ))}

              {/* Create New List Card */}
              <div
                onClick={() => setShowCreateModal(true)}
                className="bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 hover:border-gray-400 dark:hover:border-gray-500 transition-colors cursor-pointer group"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-300 dark:group-hover:bg-gray-600 transition-colors">
                    <PlusIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                  </div>
                  <Heading as="h3" size="sm" className="mb-2">
                    Create New List
                  </Heading>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Organize your games into custom collections
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Public Lists Section */}
  {publicLists.length > 0 && (
          <div>
            <div className="mb-2">
              <h2 className="text-md font-semibold tracking-wide text-gray-400 uppercase">Public Lists</h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-2xl">
              Recently updated public & system generated (BGG) lists.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {publicLists.map((list) => (
                <ListCard
                  key={list.id}
                  list={list}
      isPublic={true}
                  onUpdate={fetchPublicLists}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create List Modal */}
      {showCreateModal && (
        <CreateListModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={async () => {
            if (userId) await fetchUserLists(userId)
            setShowCreateModal(false)
          }}
        />
      )}
    </PageLayout>
  )
}
