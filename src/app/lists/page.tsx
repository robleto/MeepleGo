'use client'

import { useState, useEffect, useMemo } from 'react'
import PageLayout from '@/components/PageLayout'
import { supabase } from '@/lib/supabase'
import { GameList, GameListWithItems } from '@/types/supabase'
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

  useEffect(() => {
    fetchLists()
  }, [])

  const fetchLists = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setIsGuest(true)
        setUserId(null)
        // Still fetch public lists for guests
        await fetchPublicLists()
        return
      }

      setIsGuest(false)
      setUserId(session.user.id)
      
      // Fetch user's own lists (including default library/wishlist)
      await Promise.all([
        fetchUserLists(session.user.id),
        fetchPublicLists()
      ])
      
    } finally {
      setLoading(false)
    }
  }

  const fetchUserLists = async (userId: string) => {
    const { data, error } = await supabase
      .from('game_lists')
      .select(`
        *,
        game_list_items(
          *,
          game:games(*)
        )
      `)
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
      .select(`
        *,
        game_list_items(
          *,
          game:games(*)
        )
      `)
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
    return userLists.filter(list => ['library', 'wishlist'].includes(list.list_type))
  }, [userLists])

  const customLists = useMemo(() => {
    return userLists.filter(list => list.list_type === 'custom')
  }, [userLists])

  const handleCreateList = async (listData: { name: string; description?: string; is_public: boolean }) => {
    if (!userId) return

    const { data, error } = await supabase
      .from('game_lists')
      .insert({
        user_id: userId,
        name: listData.name,
        description: listData.description,
        is_public: listData.is_public,
        list_type: 'custom'
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            {isGuest ? 'Discover Lists' : 'My Lists'}
          </h1>
          
          {isGuest ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Create Your Own Lists
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Sign up to create custom game lists, organize your collection, and share with friends.
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
              
              {/* Create New List Card */}
              <div 
                onClick={() => setShowCreateModal(true)}
                className="bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 hover:border-gray-400 dark:hover:border-gray-500 transition-colors cursor-pointer group"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-300 dark:group-hover:bg-gray-600 transition-colors">
                    <PlusIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Create New List
                  </h3>
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
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Public Lists
            </h2>
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
