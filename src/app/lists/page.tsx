'use client'

import { useState, useEffect, useMemo } from 'react'
import PageLayout from '@/components/shared/PageLayout'
import Heading from '@/components/shared/Heading'
import { supabase } from '@/lib/supabase'
import { GameList, GameListWithItems, Profile } from '@/types/supabase'
import ListCard from '@/components/features/lists/ListCard'
import CreateListModal from '@/components/features/lists/CreateListModal'
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
            {!isGuest && (
            <div className="mb-2">
              <h2 className="heading-display text-2xl font-normal tracking-wide text-gray-700 dark:text-gray-300 mb-1">
              My Lists
              </h2>
            </div>
            )}
          {/* <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-2xl">
            {isGuest
              ? 'Browse public community and BGG powered lists. Sign in to build and curate your own collections.'
              : 'Your personal library, wishlist, and custom curated collections. Create, edit, and share public lists.'}
          </p> */}

          {isGuest ? (
            <div className="panel mb-10 flex flex-col md:flex-row md:items-start gap-10 md:gap-20">
              <div className="flex-1">
                <Heading as="h1" size="display" align="left" displayFont className="mb-6">
                  Create your own<br/> Game Lists
                </Heading>
                <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-xl leading-snug">
                  Curate collections of favorites, expansions to try, party picks—anything. Share them or keep them private.
                </p>
                <button className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-full btn-brand text-sm font-medium">
                  Sign Up to Get Started
                </button>
              </div>
              <ol className="flex-1 space-y-10 md:space-y-12 relative">
        <li className="flex items-start gap-5">
          <div className="flex-shrink-0 text-sm font-semibold w-6 h-6 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center mt-1 dark:bg-sky-900/40 dark:text-sky-300">1</div>
                  <div className="flex-1 border-b border-gray-200 dark:border-gray-700 pb-8 last:border-b-0 last:pb-0">
                    <div className="flex items-center gap-2 mb-2">
            <span className="w-5 h-5 rounded bg-sky-600/10 text-sky-600 flex items-center justify-center text-[11px] font-bold">+</span>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">Collect & organize</h3>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-snug max-w-md">Add games you own or want. Library & Wishlist seed your personal catalog automatically.</p>
                  </div>
                </li>
                <li className="flex items-start gap-5">
          <div className="flex-shrink-0 text-sm font-semibold w-6 h-6 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center mt-1 dark:bg-sky-900/40 dark:text-sky-300">2</div>
                  <div className="flex-1 border-b border-gray-200 dark:border-gray-700 pb-8 last:border-b-0 last:pb-0">
                    <div className="flex items-center gap-2 mb-2">
            <span className="w-5 h-5 rounded bg-sky-600/10 text-sky-600 flex items-center justify-center text-[11px] font-bold">★</span>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">Rate & rank</h3>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-snug max-w-md">Rate what you play to enrich list sorting & smart suggestions.</p>
                  </div>
                </li>
                <li className="flex items-start gap-5">
          <div className="flex-shrink-0 text-sm font-semibold w-6 h-6 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center mt-1 dark:bg-sky-900/40 dark:text-sky-300">3</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-5 h-5 rounded bg-amber-500/10 text-amber-600 flex items-center justify-center text-[11px] font-bold">🏆</span>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">Unlock awards</h3>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-snug max-w-md">Your curated lists + play data feed personalized award categories—refine nominees & winners later.</p>
                  </div>
                </li>
              </ol>
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
              <h2 className="heading-display text-2xl font-normal tracking-wide text-gray-700 dark:text-gray-300 mb-1">
                Public Lists
              </h2>
               </div>
            {/* <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-2xl">
              Recently updated public & system generated (BGG) lists.
            </p> */}
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
