'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  UserGroupIcon,
  UserPlusIcon,
  UserMinusIcon,
} from '@heroicons/react/24/outline'

interface ProfileLite {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
}

interface ProfileFriendsSectionProps {
  userId: string
}

export default function ProfileFriendsSection({
  userId,
}: ProfileFriendsSectionProps) {
  const [friendsQuery, setFriendsQuery] = useState('')
  const [friendsLoading, setFriendsLoading] = useState(false)
  const [friendsSearching, setFriendsSearching] = useState(false)
  const [friendsSearchError, setFriendsSearchError] = useState<string | null>(null)
  const [followers, setFollowers] = useState<ProfileLite[]>([])
  const [following, setFollowing] = useState<ProfileLite[]>([])
  const [searchResults, setSearchResults] = useState<ProfileLite[]>([])

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
    if (userId === targetId) return
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
    await supabase
      .from('user_follows')
      .delete()
      .eq('follower_id', userId)
      .eq('following_id', targetId)
    await fetchFollowersAndFollowing(userId)
  }

  useEffect(() => {
    if (!userId) return
    fetchFollowersAndFollowing(userId)
  }, [userId])

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
    <div className="rounded-2xl border border-gray-200/70 dark:border-white/10 bg-white/80 dark:bg-gray-900/70 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Friends
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Find players to follow and see who follows you.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <UserGroupIcon className="h-4 w-4" />
          {following.length} following • {followers.length} followers
        </div>
      </div>

      <div>
        <label className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Search users
        </label>
        <div className="mt-2 flex items-center gap-2">
          <input
            value={friendsQuery}
            onChange={(e) => setFriendsQuery(e.target.value)}
            placeholder="Search by username or name"
            className="flex-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
        {friendsQuery && (
          <div className="mt-3 space-y-2">
            {friendsSearching && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Searching…
              </div>
            )}
            {friendsSearchError && (
              <div className="text-sm text-red-500">{friendsSearchError}</div>
            )}
            {searchResults.length === 0 && !friendsSearching && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                No users found.
              </div>
            )}
            {searchResults.map((p) => {
              const isFollowing = following.some((f) => f.id === p.id)
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-xl border border-gray-200/70 dark:border-white/10 bg-white/70 dark:bg-gray-900/70 px-3 py-2"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {p.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.avatar_url}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-xs font-semibold text-gray-500">
                        {(p.username || p.full_name || 'U')
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {p.full_name || p.username || 'User'}
                      </div>
                      {p.username && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          @{p.username}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      isFollowing ? unfollowUser(p.id) : followUser(p.id)
                    }
                    className={
                      isFollowing
                        ? 'inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                        : 'inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700'
                    }
                  >
                    {isFollowing ? (
                      <>
                        <UserMinusIcon className="h-3.5 w-3.5" />
                        Unfollow
                      </>
                    ) : (
                      <>
                        <UserPlusIcon className="h-3.5 w-3.5" />
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

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-gray-200/70 dark:border-white/10 bg-white/70 dark:bg-gray-900/70 p-4">
          <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">
            Following
          </div>
          {friendsLoading && following.length === 0 ? (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Loading…
            </div>
          ) : following.length === 0 ? (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              You aren’t following anyone yet.
            </div>
          ) : (
            <div className="space-y-2">
              {following.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {p.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.avatar_url}
                        alt=""
                        className="w-7 h-7 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-[10px] font-semibold text-gray-500">
                        {(p.username || p.full_name || 'U')
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-sm text-gray-900 dark:text-white truncate">
                        {p.full_name || p.username || 'User'}
                      </div>
                      {p.username && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          @{p.username}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => unfollowUser(p.id)}
                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700"
                  >
                    Unfollow
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-gray-200/70 dark:border-white/10 bg-white/70 dark:bg-gray-900/70 p-4">
          <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">
            Followers
          </div>
          {friendsLoading && followers.length === 0 ? (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Loading…
            </div>
          ) : followers.length === 0 ? (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              No followers yet.
            </div>
          ) : (
            <div className="space-y-2">
              {followers.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  {p.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.avatar_url}
                      alt=""
                      className="w-7 h-7 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-[10px] font-semibold text-gray-500">
                      {(p.username || p.full_name || 'U')
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-sm text-gray-900 dark:text-white truncate">
                      {p.full_name || p.username || 'User'}
                    </div>
                    {p.username && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        @{p.username}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
