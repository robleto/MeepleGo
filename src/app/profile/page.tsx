'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import PageLayout from '@/components/Components/PageLayout'
import { RankingsContent } from '@/app/rankings/RankingsContent'
import { LibraryContent } from '@/app/library/LibraryContent'
import { WishlistContent } from '@/app/wishlist/WishlistContent'
import PersonalAwardsAuto from '@/components/Components/Awards/PersonalAwardsAuto'
import { ListsContent } from '@/app/lists/ListsContent'
import PlaysClientPage from '@/app/plays/playsClient'
import ForYouOverview from '@/components/Components/ForYouOverview'
import Heading from '@/components/Components/Heading'
import {
  BookmarkIcon,
  CubeIcon,
  StarIcon,
  ListBulletIcon,
  TrophyIcon,
  UserGroupIcon,
  UserPlusIcon,
  UserMinusIcon,
} from '@heroicons/react/24/outline'

interface Profile {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  email: string | null
}

interface Stats {
  gamesOwned: number
  gamesRated: number
  gamesPlayed: number
  avgRating: number
  listsCreated: number
  awardsCreated: number
}

interface ProfileLite {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
}

function ProfilePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabContainerRef = useRef<HTMLDivElement | null>(null)
  const tabHighlighterRef = useRef<HTMLDivElement | null>(null)
  const tabLinkRefs = useRef<Record<string, HTMLAnchorElement | null>>({})
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<Stats>({
    gamesOwned: 0,
    gamesRated: 0,
    gamesPlayed: 0,
    avgRating: 0,
    listsCreated: 0,
    awardsCreated: 0,
  })
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [friendsQuery, setFriendsQuery] = useState('')
  const [friendsLoading, setFriendsLoading] = useState(false)
  const [friendsSearching, setFriendsSearching] = useState(false)
  const [friendsSearchError, setFriendsSearchError] = useState<string | null>(null)
  const [followers, setFollowers] = useState<ProfileLite[]>([])
  const [following, setFollowing] = useState<ProfileLite[]>([])
  const [searchResults, setSearchResults] = useState<ProfileLite[]>([])
  const activeTab = searchParams.get('tab') || 'overview'
  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'games', label: 'Library' },
    { key: 'watchlist', label: 'Watchlist' },
    { key: 'collections', label: 'Collections' },
    { key: 'awards', label: 'Awards' },
    { key: 'rankings', label: 'Rankings' },
    { key: 'lists', label: 'Lists' },
    { key: 'friends', label: 'Friends' },
    { key: 'journal', label: 'Journal' },
    { key: 'stats', label: 'Stats' },
  ]

  const moveTabHighlighterTo = (el: HTMLAnchorElement | null) => {
    const highlighter = tabHighlighterRef.current
    const container = tabContainerRef.current
    if (!highlighter || !container || !el) {
      if (highlighter) highlighter.style.opacity = '0'
      return
    }
    const linkRect = el.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()
    const left = linkRect.left - containerRect.left
    const width = linkRect.width
    highlighter.style.opacity = '1'
    highlighter.style.transform = `translateX(${left}px)`
    highlighter.style.width = `${width}px`
  }

  useEffect(() => {
    loadProfile()
    loadStats()
  }, [])

  useEffect(() => {
    const activeLink = tabLinkRefs.current[activeTab] || null
    requestAnimationFrame(() => moveTabHighlighterTo(activeLink))
    const onResize = () => moveTabHighlighterTo(activeLink)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [activeTab])

  const loadProfile = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      setUserId(session.user.id)

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (error) throw error

      const profileData = {
        ...data,
        email: session.user.email,
      }

      setProfile(profileData)
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
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

  useEffect(() => {
    if (activeTab !== 'friends' || !userId) return
    fetchFollowersAndFollowing(userId)
  }, [activeTab, userId])

  useEffect(() => {
    if (activeTab !== 'friends') return
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
  }, [friendsQuery, activeTab, userId])

  const loadStats = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) return

      // Get stats from various tables
      const [rankingsResult, listsResult, libraryResult, awardsResult] =
        await Promise.all([
        supabase
          .from('rankings')
          .select('ranking, played_it')
          .eq('user_id', session.user.id),
        supabase.from('game_lists').select('id').eq('user_id', session.user.id),
        supabase
          .from('game_list_items')
          .select('game_id, game_lists!inner(name)')
          .eq('game_lists.user_id', session.user.id)
          .eq('game_lists.name', 'Library'),
        supabase.from('awards').select('id').eq('user_id', session.user.id),
      ])

      const rankings = rankingsResult.data || []
      const lists = listsResult.data || []
      const libraryItems = libraryResult.data || []
      const awards = awardsResult.data || []

      const gamesPlayed = rankings.filter((r) => r.played_it).length
      const totalRatings = rankings.filter((r) => r.ranking !== null)
      const avgRating =
        totalRatings.length > 0
          ? totalRatings.reduce((sum, r) => sum + (r.ranking || 0), 0) /
            totalRatings.length
          : 0

      setStats({
        gamesOwned: libraryItems.length,
        gamesRated: totalRatings.length,
        gamesPlayed: rankings.length,
        avgRating: Math.round(avgRating * 10) / 10,
        listsCreated: lists.length,
        awardsCreated: awards.length,
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  if (loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-b-2 rounded-full animate-spin border-primary-600"></div>
        </div>
      </PageLayout>
    )
  }

  if (!profile) {
    return (
      <PageLayout>
        <div className="py-12 text-center">
          <p className="text-gray-600">Failed to load profile</p>
        </div>
      </PageLayout>
    )
  }

  const profileHeader = (
    <div className="space-y-6">
      <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-900">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/settings"
              className="relative flex items-center justify-center w-12 h-12 overflow-hidden bg-gray-200 rounded-full group dark:bg-gray-700"
              aria-label="Edit profile photo"
            >
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt="Profile"
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full text-base font-semibold text-white bg-gradient-to-br from-primary-500 to-primary-600">
                  {(
                    profile.username ||
                    profile.full_name ||
                    profile.email ||
                    'U'
                  )
                    .charAt(0)
                    .toUpperCase()}
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] font-medium text-white">
                Edit
              </div>
            </Link>
            <div>
              <Heading as="h1" size="lg" className="font-medium">
                {profile.username || profile.full_name || 'Your Profile'}
              </Heading>
              <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-1">
                {profile.full_name || '—'}
                <span className="mx-2 text-gray-400">|</span>
                {profile.email}
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-500 mt-1">
                {profile.bio || 'Add your personal statement in Settings.'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:justify-end">
            {[
              {
                iconBg: 'bg-blue-500',
                Icon: BookmarkIcon,
                label: 'Games Owned',
                value: stats.gamesOwned,
              },
              {
                iconBg: 'bg-green-500',
                Icon: CubeIcon,
                label: 'Games Played',
                value: stats.gamesPlayed,
              },
              {
                iconBg: 'bg-yellow-500',
                Icon: StarIcon,
                label: 'Avg Rating',
                value: stats.avgRating || '—',
              },
              {
                iconBg: 'bg-purple-500',
                Icon: ListBulletIcon,
                label: 'Lists Created',
                value: stats.listsCreated,
              },
              {
                iconBg: 'bg-amber-500',
                Icon: TrophyIcon,
                label: 'Awards Created',
                value: stats.awardsCreated,
              },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-xl ${item.iconBg}`}
                >
                  <item.Icon className="w-5 h-5 text-white" />
                </div>
                <div className="leading-tight">
                  <div className="text-base font-semibold text-gray-900 dark:text-white">
                    {item.value}
                  </div>
                  <div className="text-[10px] font-semibold tracking-wider text-gray-500 dark:text-gray-400 uppercase">
                    {item.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        ref={tabContainerRef}
        className="relative rounded-3xl px-2 backdrop-blur-xl shadow-[0_6px_30px_rgba(0,0,0,0.06)] border bg-white/60 dark:bg-black/30 border-gray-200/60 dark:border-white/10"
        onMouseLeave={() => {
          const active = tabLinkRefs.current[activeTab] || null
          moveTabHighlighterTo(active)
        }}
      >
        <div
          ref={tabHighlighterRef}
          className="absolute left-0 rounded-2xl pointer-events-none border transition-all duration-300 ease-out will-change-[transform,width]"
          style={{
            top: 6,
            bottom: 6,
            opacity: 0,
            width: 0,
            transform: 'translate3d(0,0,0)',
            backgroundColor: 'rgba(224, 242, 254, 0.7)',
            borderColor: 'rgba(186, 230, 253, 0.6)',
            boxShadow:
              'inset 0 1px 0 rgba(255,255,255,0.6), 0 6px 12px rgba(0,0,0,0.06)',
          }}
          aria-hidden="true"
        />
        <ul className="relative z-10 flex flex-wrap items-center gap-1 text-xs font-medium font-inter">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key
            return (
              <li key={tab.key}>
                <Link
                  ref={(el) => {
                    tabLinkRefs.current[tab.key] = el
                  }}
                  onMouseEnter={(e) => moveTabHighlighterTo(e.currentTarget)}
                  href={`/profile?tab=${tab.key}`}
                  aria-current={isActive ? 'page' : undefined}
                  className={`block px-4 py-2.5 rounded-xl text-center transition-colors duration-200 ${
                    isActive
                      ? 'text-gray-900 dark:text-gray-100'
                      : 'text-black dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )

  return (
    <PageLayout subHeader={profileHeader}>
      <div className="space-y-6">
        {activeTab === 'overview' && userId && (
          <ForYouOverview
            userId={userId}
            username={profile.username}
          />
        )}

        {activeTab === 'rankings' && (
          <div className="p-6 border rounded-2xl border-gray-200/70 dark:border-white/10 bg-white/80 dark:bg-gray-900/70">
            <RankingsContent embedded />
          </div>
        )}

        {activeTab === 'games' && (
          <div className="p-6 border rounded-2xl border-gray-200/70 dark:border-white/10 bg-white/80 dark:bg-gray-900/70">
            <LibraryContent embedded />
          </div>
        )}

        {activeTab === 'watchlist' && (
          <div className="p-6 border rounded-2xl border-gray-200/70 dark:border-white/10 bg-white/80 dark:bg-gray-900/70">
            <WishlistContent embedded />
          </div>
        )}

        {activeTab === 'awards' && (
          <div className="p-6 border rounded-2xl border-gray-200/70 dark:border-white/10 bg-white/80 dark:bg-gray-900/70">
            <PersonalAwardsAuto />
          </div>
        )}

        {activeTab === 'lists' && (
          <div className="p-6 border rounded-2xl border-gray-200/70 dark:border-white/10 bg-white/80 dark:bg-gray-900/70">
            <ListsContent embedded showDefaults={false} showPublic={false} />
          </div>
        )}

        {activeTab === 'friends' && (
          <div className="p-6 space-y-6 border rounded-2xl border-gray-200/70 dark:border-white/10 bg-white/80 dark:bg-gray-900/70">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Friends
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Find players to follow and see who follows you.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <UserGroupIcon className="w-4 h-4" />
                {following.length} following • {followers.length} followers
              </div>
            </div>

            <div>
              <label className="text-xs tracking-wide text-gray-500 uppercase dark:text-gray-400">
                Search users
              </label>
              <div className="flex items-center gap-2 mt-2">
                <input
                  value={friendsQuery}
                  onChange={(e) => setFriendsQuery(e.target.value)}
                  placeholder="Search by username or name"
                  className="flex-1 px-4 py-2 text-sm bg-white border border-gray-200 rounded-xl dark:border-gray-700 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
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
                      <div className="text-sm text-red-500">
                        {friendsSearchError}
                      </div>
                    )}
                  {searchResults.length === 0 && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      No users found.
                    </div>
                  )}
                  {searchResults.map((p) => {
                    const isFollowing = following.some((f) => f.id === p.id)
                    return (
                      <div
                        key={p.id}
                        className="flex items-center justify-between px-3 py-2 border rounded-xl border-gray-200/70 dark:border-white/10 bg-white/70 dark:bg-gray-900/70"
                      >
                        <div className="flex items-center min-w-0 gap-3">
                          {p.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={p.avatar_url}
                              alt=""
                              className="object-cover w-8 h-8 rounded-full"
                            />
                          ) : (
                            <div className="flex items-center justify-center w-8 h-8 text-xs font-semibold text-gray-500 bg-gray-200 rounded-full dark:bg-gray-800">
                              {(p.username || p.full_name || 'U')
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate dark:text-white">
                              {p.full_name || p.username || 'User'}
                            </div>
                            {p.username && (
                              <div className="text-xs text-gray-500 truncate dark:text-gray-400">
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
              <div className="p-4 border rounded-xl border-gray-200/70 dark:border-white/10 bg-white/70 dark:bg-gray-900/70">
                <div className="mb-3 text-xs tracking-wide text-gray-500 uppercase dark:text-gray-400">
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
                        <div className="flex items-center min-w-0 gap-3">
                          {p.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={p.avatar_url}
                              alt=""
                              className="object-cover rounded-full w-7 h-7"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-[10px] font-semibold text-gray-500">
                              {(p.username || p.full_name || 'U')
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="text-sm text-gray-900 truncate dark:text-white">
                              {p.full_name || p.username || 'User'}
                            </div>
                            {p.username && (
                              <div className="text-xs text-gray-500 truncate dark:text-gray-400">
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

              <div className="p-4 border rounded-xl border-gray-200/70 dark:border-white/10 bg-white/70 dark:bg-gray-900/70">
                <div className="mb-3 text-xs tracking-wide text-gray-500 uppercase dark:text-gray-400">
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
                            className="object-cover rounded-full w-7 h-7"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-[10px] font-semibold text-gray-500">
                            {(p.username || p.full_name || 'U')
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-sm text-gray-900 truncate dark:text-white">
                            {p.full_name || p.username || 'User'}
                          </div>
                          {p.username && (
                            <div className="text-xs text-gray-500 truncate dark:text-gray-400">
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
        )}

        {activeTab === 'journal' && (
          <div className="p-6 border rounded-2xl border-gray-200/70 dark:border-white/10 bg-white/80 dark:bg-gray-900/70">
            <PlaysClientPage />
          </div>
        )}

        {activeTab === 'collections' && (
          <div className="p-8 space-y-3 text-center border rounded-2xl border-gray-200/70 dark:border-white/10 bg-white/80 dark:bg-gray-900/70">
            <div className="text-3xl opacity-40">
              {'\u{1F4E6}'}
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Collections
            </h2>
            <p className="max-w-sm mx-auto text-sm text-gray-400 dark:text-gray-500">
              Organize your games into themed collections. Coming soon.
            </p>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="p-8 space-y-3 text-center border rounded-2xl border-gray-200/70 dark:border-white/10 bg-white/80 dark:bg-gray-900/70">
            <div className="text-3xl opacity-40">
              {'\u{1F4CA}'}
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Stats
            </h2>
            <p className="max-w-sm mx-auto text-sm text-gray-400 dark:text-gray-500">
              Deep insights into your gaming habits and history. Coming soon.
            </p>
          </div>
        )}
      </div>
    </PageLayout>
  )
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <PageLayout>
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-b-2 rounded-full animate-spin border-primary-600"></div>
          </div>
        </PageLayout>
      }
    >
      <ProfilePageContent />
    </Suspense>
  )
}
