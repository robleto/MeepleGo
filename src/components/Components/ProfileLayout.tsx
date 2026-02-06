'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { cn } from '@/utils/helpers'
import PageLayout from '@/components/Components/PageLayout'
import ProfileHeader from '@/components/Components/ProfileHeader'

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

  // Determine active tab from pathname
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

  useEffect(() => {
    loadProfile()
    loadStats()
  }, [userId])

  const loadProfile = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      // Determine which user's profile to load
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
      ] =
        await Promise.all([
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
        gamesPlayed: rankings.length,
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
          <div className="w-8 h-8 border-b-2 rounded-full animate-spin border-primary-600"></div>
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

  const headerAndNav = (
    <div>
      {/* Profile header section with opaque background */}
      <div className="bg-gray-50 dark:bg-gray-950 pt-2 pb-4 sm:pt-4 sm:pb-5 px-4 sm:px-6 lg:px-8">
        <ProfileHeader
          profile={profile}
          stats={{
            gamesOwned: stats.gamesOwned,
            gamesPlayed: stats.gamesPlayed,
            listsCreated: stats.listsCreated,
            followers: stats.followers,
            following: stats.following,
          }}
          isOwnProfile={isOwnProfile}
          showBanner={Boolean(profile?.banner_url)}
        />
      </div>

      {/* Navigation tabs - sticky with opaque bg on scroll */}
      <div className="sticky top-14 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 lg:px-8">
        <nav
          className="flex gap-1 overflow-x-auto scrollbar-hide -mb-px"
          aria-label="Profile tabs"
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key
            return (
              <Link
                key={tab.key}
                href={tab.href}
                className={cn(
                  'unstyled relative py-3 px-3 text-sm font-medium whitespace-nowrap transition-colors duration-150',
                  isActive
                    ? 'text-gray-900 dark:text-gray-100'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                )}
              >
                {tab.label}
                {/* Active indicator bar */}
                {isActive && (
                  <span className="absolute inset-x-0 bottom-0 h-[2.5px] rounded-full bg-gray-900 dark:bg-gray-100" />
                )}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )

  return (
    <PageLayout subHeader={headerAndNav} subHeaderSpacing={false}>
      <div className="space-y-3 -mt-10 sm:-mt-12 lg:-mt-12">
        {children}
      </div>
    </PageLayout>
  )
}
