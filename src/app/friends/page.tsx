'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import PageLayout from '@/components/Components/PageLayout'
import SectionHeader from '@/components/Components/SectionHeader'
import {
  UserGroupIcon,
  UserMinusIcon,
  UserPlusIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'

interface ProfileLite {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
}

export function FriendsContent({
  embedded = false,
  forcedUserId,
  username,
}: {
  embedded?: boolean
  forcedUserId?: string
  username?: string
}) {
  const Wrapper = embedded
    ? (({ children }: { children: ReactNode }) => <>{children}</>)
    : PageLayout
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [followers, setFollowers] = useState<ProfileLite[]>([])
  const [following, setFollowing] = useState<ProfileLite[]>([])
  const [searchResults, setSearchResults] = useState<ProfileLite[]>([])
  const [friendsQuery, setFriendsQuery] = useState('')
  const [friendsLoading, setFriendsLoading] = useState(false)
  const [friendsSearching, setFriendsSearching] = useState(false)
  const [friendsSearchError, setFriendsSearchError] = useState<string | null>(null)

  useEffect(() => {
    loadUser()
  }, [forcedUserId])

  const loadUser = async () => {
    try {
      if (forcedUserId) {
        // Viewing another user's friends
        setUserId(forcedUserId)
        await fetchFollowersAndFollowing(forcedUserId)
        return
      }
      
      // Viewing own friends
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      setUserId(session.user.id)
      await fetchFollowersAndFollowing(session.user.id)
    } catch (error) {
      console.error('Error loading user:', error)
    }
  }

  const fetchFollowersAndFollowing = async (uid: string) => {
    setFriendsLoading(true)
    try {
      const { data: followingRows, error: followingError } = await supabase
        .from('user_follows')
        .select(
          'following_id, following:profiles!user_follows_following_fkey(id, username, full_name, avatar_url)'
        )
        .eq('follower_id', uid)

      const { data: followerRows, error: followerError } = await supabase
        .from('user_follows')
        .select(
          'follower_id, follower:profiles!user_follows_follower_fkey(id, username, full_name, avatar_url)'
        )
        .eq('following_id', uid)

      if (followingError || followerError) {
        console.error('Error loading friends:', followingError || followerError)
      }

      const followingProfiles = (followingRows || [])
        .map((row: any) => row.following)
        .filter(Boolean)
      const followerProfiles = (followerRows || [])
        .map((row: any) => row.follower)
        .filter(Boolean)

      setFollowing(followingProfiles)
      setFollowers(followerProfiles)
    } finally {
      setFriendsLoading(false)
    }
  }

  const followUser = async (targetId: string) => {
    if (!userId || userId === targetId) return
    const { error } = await supabase.from('user_follows').upsert(
      {
        follower_id: userId,
        following_id: targetId,
      },
      {
        onConflict: 'follower_id,following_id',
        ignoreDuplicates: true,
      }
    )
    if (error) {
      console.error('Error following user:', error)
    }
    await fetchFollowersAndFollowing(userId)
  }

  const unfollowUser = async (targetId: string) => {
    if (!userId) return
    await supabase
      .from('user_follows')
      .delete()
      .eq('follower_id', userId)
      .eq('following_id', targetId)
    await fetchFollowersAndFollowing(userId)
  }

  // Search users with debounce
  useEffect(() => {
    const q = friendsQuery.trim()
    if (!q) {
      setSearchResults([])
      setFriendsSearchError(null)
      setFriendsSearching(false)
      return
    }
    let cancelled = false
    const handle = setTimeout(async () => {
      setFriendsSearching(true)
      setFriendsSearchError(null)
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .or(`username.ilike.%${q}%,full_name.ilike.%${q}%,email.ilike.%${q}%`)
        .limit(12)

      if (cancelled) return
      if (error) {
        setSearchResults([])
        setFriendsSearchError('Search is unavailable. Try again in a moment.')
        setFriendsSearching(false)
        return
      }
      const cleaned = (data || []).filter((p) => p.id !== userId)
      setSearchResults(cleaned as ProfileLite[])
      setFriendsSearching(false)
    }, 200)

    return () => {
      cancelled = true
      clearTimeout(handle)
    }
  }, [friendsQuery, userId])

  return (
    <Wrapper>
      <SectionHeader
        title={username ? `${username}'s Friends` : 'Friends'}
        rightSlot={
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <UserGroupIcon className="h-4 w-4" />
            {following.length} following • {followers.length} followers
          </div>
        }
      />

      {/* Search Section - only show when viewing own friends */}
      {!forcedUserId && (
        <div className="rounded-2xl border border-gray-200/70 bg-white/80 p-6 mb-6">
          <div className="mb-3">
            <label className="text-xs uppercase tracking-wide text-gray-500 mb-2 block">
              Search users
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                value={friendsQuery}
                onChange={(e) => setFriendsQuery(e.target.value)}
                placeholder="Search by username or name"
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {friendsQuery && (
            <div className="mt-4 space-y-2">
              {friendsSearching && (
                <div className="text-sm text-gray-500 text-center py-4">
                  Searching…
                </div>
              )}
              {friendsSearchError && (
                <div className="text-sm text-red-500 text-center py-4">
                  {friendsSearchError}
                </div>
              )}
              {!friendsSearching && !friendsSearchError && searchResults.length === 0 && (
                <div className="text-sm text-gray-500 text-center py-4">
                  No users found.
                </div>
              )}
              {searchResults.map((p) => {
                const isFollowing = following.some((f) => f.id === p.id)
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-xl border border-gray-200/70 bg-white/70 px-4 py-3"
                  >
                    <Link 
                      href={p.username ? `/${p.username}` : '#'}
                      className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-80 transition-opacity"
                    >
                      {p.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.avatar_url}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-500">
                          {(p.username || p.full_name || 'U')
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {p.full_name || p.username || 'User'}
                        </div>
                        {p.username && (
                          <div className="text-xs text-gray-500 truncate">
                            @{p.username}
                        </div>
                      )}
                    </div>
                  </Link>
                  <button
                    onClick={() =>
                      isFollowing ? unfollowUser(p.id) : followUser(p.id)
                    }
                    className={
                      isFollowing
                        ? 'inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50'
                        : 'inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700'
                    }
                  >
                    {isFollowing ? (
                      <>
                        <UserMinusIcon className="h-4 w-4" />
                        Unfollow
                      </>
                    ) : (
                      <>
                        <UserPlusIcon className="h-4 w-4" />
                        Follow
                      </>
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        )}
        </div>
      )}

      {/* Zero State */}
      {!friendsLoading && following.length === 0 && followers.length === 0 && !friendsQuery && (
        <div className="rounded-2xl border border-gray-200/70 bg-white/80 p-12 text-center">
          <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No friends yet
          </h3>
          <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
            You haven't connected with any players yet. Search above to find friends to follow.
          </p>
        </div>
      )}

      {/* Following and Followers Lists */}
      {(following.length > 0 || followers.length > 0) && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Following */}
          <div className="rounded-2xl border border-gray-200/70 bg-white/80 p-6">
            <div className="text-xs uppercase tracking-wide text-gray-500 mb-4">
              Following ({following.length})
            </div>
            {friendsLoading && following.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-8">
                Loading…
              </div>
            ) : following.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-8">
                You aren't following anyone yet.
              </div>
            ) : (
              <div className="space-y-2">
                {following.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors"
                  >
                    <Link
                      href={p.username ? `/${p.username}` : '#'}
                      className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-80 transition-opacity"
                    >
                      {p.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.avatar_url}
                          alt=""
                          className="w-9 h-9 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-500">
                          {(p.username || p.full_name || 'U')
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {p.full_name || p.username || 'User'}
                        </div>
                        {p.username && (
                          <div className="text-xs text-gray-500 truncate">
                            @{p.username}
                          </div>
                        )}
                      </div>
                    </Link>
                    <button
                      onClick={() => unfollowUser(p.id)}
                      className="text-xs text-gray-500 hover:text-gray-700 font-medium"
                    >
                      Unfollow
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Followers */}
          <div className="rounded-2xl border border-gray-200/70 bg-white/80 p-6">
            <div className="text-xs uppercase tracking-wide text-gray-500 mb-4">
              Followers ({followers.length})
            </div>
            {friendsLoading && followers.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-8">
                Loading…
              </div>
            ) : followers.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-8">
                No followers yet.
              </div>
            ) : (
              <div className="space-y-2">
                {followers.map((p) => (
                  <Link
                    key={p.id}
                    href={p.username ? `/${p.username}` : '#'}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors"
                  >
                    {p.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.avatar_url}
                        alt=""
                        className="w-9 h-9 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-500">
                        {(p.username || p.full_name || 'U')
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {p.full_name || p.username || 'User'}
                      </div>
                      {p.username && (
                        <div className="text-xs text-gray-500 truncate">
                          @{p.username}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Wrapper>
  )
}

export default function FriendsPage() {
  return <FriendsContent />
}
