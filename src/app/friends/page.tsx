'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import PageLayout from '@/components/Components/PageLayout'
import SectionHeader from '@/components/Components/SectionHeader'
import PillTabs from '@/components/Components/PillTabs'
import SearchandFilters from '@/components/Components/SearchandFilters'
import {
  UserGroupIcon,
  UserMinusIcon,
  UserPlusIcon,
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
  const [friendsQuery, setFriendsQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'following' | 'followers'>(
    'following'
  )
  const [friendsLoading, setFriendsLoading] = useState(false)

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

  const filteredFollowing = useMemo(() => {
    if (!friendsQuery.trim()) return following
    const q = friendsQuery.trim().toLowerCase()
    return following.filter((p) =>
      `${p.username ?? ''} ${p.full_name ?? ''}`.toLowerCase().includes(q)
    )
  }, [following, friendsQuery])

  const filteredFollowers = useMemo(() => {
    if (!friendsQuery.trim()) return followers
    const q = friendsQuery.trim().toLowerCase()
    return followers.filter((p) =>
      `${p.username ?? ''} ${p.full_name ?? ''}`.toLowerCase().includes(q)
    )
  }, [followers, friendsQuery])

  return (
    <Wrapper>
      <div className="space-y-6 pt-4 sm:pt-6">
        <div className="flex flex-col gap-2 sm:gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1 min-w-0">
            <PillTabs
              items={[
                { key: 'following', label: `Following (${following.length})` },
                { key: 'followers', label: `Followers (${followers.length})` },
              ]}
              activeKey={activeTab}
              onChange={(key) => setActiveTab(key as any)}
            />
          </div>
          <div className="flex flex-wrap items-center w-full gap-2 sm:gap-3 sm:justify-end sm:w-auto">
            <SearchandFilters
              value={friendsQuery}
              onChange={setFriendsQuery}
              onSearch={setFriendsQuery}
              placeholder="Search people…"
              showFiltersButton={false}
              className="w-full mx-0 max-w-none sm:w-auto"
            />
          </div>
        </div>

        <div className="sr-only">
          <SectionHeader
            title={username ? `${username}'s Friends` : 'Friends'}
            rightSlot={
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <UserGroupIcon className="h-4 w-4" />
                {following.length} following • {followers.length} followers
              </div>
            }
          />
        </div>


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
        <div className="space-y-6 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
          <div>
            {activeTab === 'following' ? (
              <div className="rounded-2xl border border-gray-200/70 bg-white/80 p-6">
                <div className="text-xs uppercase tracking-wide text-gray-500 mb-4">
                  Following ({filteredFollowing.length})
                </div>
                {friendsLoading && following.length === 0 ? (
                  <div className="text-sm text-gray-500 text-center py-8">
                    Loading…
                  </div>
                ) : filteredFollowing.length === 0 ? (
                  <div className="text-sm text-gray-500 text-center py-8">
                    You aren't following anyone yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredFollowing.map((p) => (
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
                          className="group inline-flex items-center justify-center rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                        >
                          <span className="group-hover:hidden">Following</span>
                          <span className="hidden group-hover:inline text-red-600">
                            Unfollow
                          </span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-200/70 bg-white/80 p-6">
                <div className="text-xs uppercase tracking-wide text-gray-500 mb-4">
                  Followers ({filteredFollowers.length})
                </div>
                {friendsLoading && followers.length === 0 ? (
                  <div className="text-sm text-gray-500 text-center py-8">
                    Loading…
                  </div>
                ) : filteredFollowers.length === 0 ? (
                  <div className="text-sm text-gray-500 text-center py-8">
                    No followers yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredFollowers.map((p) => {
                      const isFollowing = following.some((f) => f.id === p.id)
                      return (
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
                          {isFollowing ? (
                            <button
                              onClick={() => unfollowUser(p.id)}
                              className="group inline-flex items-center justify-center rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                            >
                              <span className="group-hover:hidden">Following</span>
                              <span className="hidden group-hover:inline text-red-600">
                                Unfollow
                              </span>
                            </button>
                          ) : (
                            <button
                              onClick={() => followUser(p.id)}
                              className="inline-flex items-center justify-center rounded-full bg-sky-600 px-3 py-1 text-xs font-semibold text-white hover:bg-sky-700"
                            >
                              Follow Back
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="hidden lg:block rounded-2xl border border-dashed border-gray-200 bg-gray-50/70 p-6 text-sm text-gray-500">
            Recommendations coming soon — friends of friends, local players, and popular community members.
          </div>
        </div>
      )}
      </div>
    </Wrapper>
  )
}

export default function FriendsPage() {
  return <FriendsContent />
}
