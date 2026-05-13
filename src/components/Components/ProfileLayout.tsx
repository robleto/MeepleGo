'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { cn } from '@/utils/helpers'
import Heading from '@/components/Components/Heading'
import PageLayout from '@/components/Components/PageLayout'

interface Profile {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  banner_url?: string | null
  bio: string | null
  email?: string | null
}

interface Stats {
  gamesOwned: number
  gamesRated: number
  gamesPlayed: number
  avgRating: number
  listsCreated: number
  wishlistItems: number
  followers: number
  following: number
}

interface ProfileLayoutProps {
  children: ReactNode
  userId?: string // If viewing someone else's profile
  username?: string // For display in header
}

export default function ProfileLayout({
  children,
  userId,
  username,
}: ProfileLayoutProps) {
  const pathname = usePathname()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<Stats>({
    gamesOwned: 0,
    gamesRated: 0,
    gamesPlayed: 0,
    avgRating: 0,
    listsCreated: 0,
    wishlistItems: 0,
    followers: 0,
    following: 0,
  })
  const [loading, setLoading] = useState(true)
  const [isOwnProfile, setIsOwnProfile] = useState(false)

  const tabContainerRef = useRef<HTMLDivElement | null>(null)
  const tabHighlighterRef = useRef<HTMLDivElement | null>(null)
  const tabLinkRefs = useRef<Record<string, HTMLAnchorElement | null>>({})

  const baseUrl = username ? `/${username}` : '/profile'

  const tabs = [
    { key: 'overview', label: 'Overview', href: baseUrl },
    { key: 'activity', label: 'Activity', href: `${baseUrl}/activity` },
    { key: 'games', label: 'Games', href: `${baseUrl}/games` },
    { key: 'journal', label: 'Journal', href: `${baseUrl}/journal` },
    { key: 'rankings', label: 'Rankings', href: `${baseUrl}/rankings` },
    { key: 'lists', label: 'Lists', href: `${baseUrl}/lists` },
    { key: 'awards', label: 'Awards', href: `${baseUrl}/awards` },
    { key: 'friends', label: 'Friends', href: `${baseUrl}/friends` },
    { key: 'stats', label: 'Stats', href: `${baseUrl}/stats` },
  ]

  const getActiveTab = () => {
    if (pathname.endsWith('/activity')) return 'activity'
    if (pathname.endsWith('/games')) return 'games'
    if (pathname.endsWith('/journal')) return 'journal'
    if (pathname.endsWith('/rankings')) return 'rankings'
    if (pathname.endsWith('/lists')) return 'lists'
    if (pathname.endsWith('/awards')) return 'awards'
    if (pathname.endsWith('/friends')) return 'friends'
    if (pathname.endsWith('/stats')) return 'stats'
    return 'overview'
  }

  const activeTab = getActiveTab()

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
  }, [userId])

  useEffect(() => {
    const activeLink = tabLinkRefs.current[activeTab] || null
    requestAnimationFrame(() => moveTabHighlighterTo(activeLink))
    const onResize = () => moveTabHighlighterTo(activeLink)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [activeTab, loading])

  const loadProfile = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const targetUserId = userId || session?.user?.id
      if (!targetUserId) {
        setLoading(false)
        return
      }

      setIsOwnProfile(session?.user?.id === targetUserId)

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetUserId)
        .single()

      if (error) throw error

      const profileData: Profile = {
        ...data,
        email: isOwnProfile ? session?.user?.email : undefined,
      }

      setProfile(profileData)
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const targetUserId = userId || session?.user?.id
      if (!targetUserId) return

      const [
        rankingsResult,
        listsResult,
        libraryResult,
        wishlistResult,
        followingResult,
        followersResult,
      ] = await Promise.all([
        supabase
          .from('rankings')
          .select('ranking, played_it')
          .eq('user_id', targetUserId),
        supabase.from('game_lists').select('id').eq('user_id', targetUserId),
        supabase
          .from('game_list_items')
          .select('game_id, game_lists!inner(name)')
          .eq('game_lists.user_id', targetUserId)
          .eq('game_lists.name', 'Library'),
        supabase
          .from('game_list_items')
          .select('game_id, game_lists!inner(name)')
          .eq('game_lists.user_id', targetUserId)
          .eq('game_lists.name', 'Wishlist'),
        supabase
          .from('user_follows')
          .select('id', { count: 'exact', head: true })
          .eq('follower_id', targetUserId),
        supabase
          .from('user_follows')
          .select('id', { count: 'exact', head: true })
          .eq('following_id', targetUserId),
      ])

      const rankings = rankingsResult.data || []
      const lists = listsResult.data || []
      const libraryItems = libraryResult.data || []
      const wishlistItems = wishlistResult.data || []
      const followingCount = followingResult.count || 0
      const followersCount = followersResult.count || 0

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
        gamesPlayed,
        avgRating: Math.round(avgRating * 10) / 10,
        listsCreated: lists.length,
        wishlistItems: wishlistItems.length,
        followers: followersCount,
        following: followingCount,
      })
    } catch (error) {
      console.error('Error loading stats:', error)
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

  if (!profile) {
    return (
      <PageLayout>
        <div className="py-12 text-center">
          <p className="text-gray-600">Profile not found</p>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className="space-y-3">
      {/* Profile Header */}
      <div className="bg-white sm:rounded-2xl sm:shadow-sm sm:border sm:border-gray-100 p-3 sm:p-4">
        <div className="sm:flex sm:items-center sm:gap-6">
          {/* Left: Avatar + Name */}
          <div className="sm:flex-1 sm:min-w-0">
            <div className="flex items-center gap-3">
              <Link
                href={isOwnProfile ? '/settings' : '#'}
                className={cn(
                  'group relative h-12 w-12 aspect-square rounded-full overflow-hidden bg-gray-200 flex items-center justify-center flex-shrink-0',
                  isOwnProfile ? 'cursor-pointer' : 'cursor-default'
                )}
                aria-label={isOwnProfile ? 'Edit profile photo' : 'Profile photo'}
              >
                {profile.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatar_url}
                    alt="Profile"
                    className="w-full h-full aspect-square object-cover"
                  />
                ) : (
                  <div className="w-full h-full aspect-square bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-lg sm:text-xl font-semibold">
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
                {isOwnProfile && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-medium text-white">
                    Edit
                  </div>
                )}
              </Link>
              <div className="flex-1 min-w-0">
                <Heading
                  as="h1"
                  size="lg"
                  className="font-medium truncate text-lg sm:text-2xl"
                >
                  {profile.username || profile.full_name || 'User Profile'}
                </Heading>
                {profile.full_name && (
                  <p className="text-xs sm:text-sm text-gray-600 mt-0.5 truncate">
                    {profile.full_name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right (Desktop) / Below (Mobile): Stats */}
          <div className="mt-3 sm:mt-0 grid grid-cols-4 gap-2 sm:flex sm:items-baseline sm:gap-6 sm:flex-shrink-0">
            {[
              { label: 'Owned', value: stats.gamesOwned },
              { label: 'Played', value: stats.gamesPlayed },
              { label: 'Avg Rating', value: stats.avgRating || '—', emphasis: true },
              { label: 'Lists', value: stats.listsCreated },
            ].map((item) => (
              <div key={item.label} className="text-center sm:text-left">
                <div
                  className={cn(
                    'text-lg sm:text-xl font-semibold tabular-nums leading-none',
                    item.emphasis ? 'text-brand' : 'text-gray-900'
                  )}
                >
                  {item.value}
                </div>
                <div className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wide mt-1">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation - Sliding glass highlighter */}
      <div className="relative -mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto scrollbar-hide">
        <div
          ref={tabContainerRef}
          className="relative inline-flex rounded-3xl px-2 backdrop-blur-xl shadow-[0_6px_30px_rgba(0,0,0,0.06)] border bg-white/60 border-gray-200/60 min-w-max"
          onMouseLeave={() => moveTabHighlighterTo(tabLinkRefs.current[activeTab] || null)}
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
          <ul className="flex items-center font-medium text-xs gap-1 relative z-10">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key
              return (
                <li key={tab.key}>
                  <Link
                    ref={(el) => { tabLinkRefs.current[tab.key] = el }}
                    onMouseEnter={(e) => moveTabHighlighterTo(e.currentTarget)}
                    href={tab.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'unstyled block px-4 py-2.5 rounded-xl text-center whitespace-nowrap transition-colors duration-200',
                      isActive
                        ? '!text-gray-900'
                        : '!text-gray-600 hover:!text-gray-900'
                    )}
                  >
                    {tab.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      {/* Page Content */}
      {children}
      </div>
    </PageLayout>
  )
}
