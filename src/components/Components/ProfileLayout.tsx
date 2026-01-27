'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Heading from '@/components/Components/Heading'
import {
  BookmarkIcon,
  CubeIcon,
  StarIcon,
  ListBulletIcon,
  TrophyIcon,
  ChartBarIcon,
  PencilSquareIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'

interface Profile {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
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
  })
  const [loading, setLoading] = useState(true)
  const [isOwnProfile, setIsOwnProfile] = useState(false)

  const baseUrl = username ? `/${username}` : '/profile'
  
  const tabs = [
    { key: 'overview', label: 'Overview', href: baseUrl },
    { key: 'activity', label: 'Activity', href: `${baseUrl}/activity` },
    { key: 'library', label: 'Library', href: `${baseUrl}/library` },
    { key: 'wishlist', label: 'Wishlist', href: `${baseUrl}/wishlist` },
    { key: 'rankings', label: 'Rankings', href: `${baseUrl}/rankings` },
    { key: 'lists', label: 'Lists', href: `${baseUrl}/lists` },
    { key: 'awards', label: 'Awards', href: `${baseUrl}/awards` },
    { key: 'plays', label: 'Journal', href: `${baseUrl}/plays` },
    { key: 'friends', label: 'Friends', href: `${baseUrl}/friends` },
    { key: 'stats', label: 'Stats', href: `${baseUrl}/stats` },
  ]

  // Determine active tab from pathname
  const getActiveTab = () => {
    if (pathname.endsWith('/activity')) return 'activity'
    if (pathname.endsWith('/library')) return 'library'
    if (pathname.endsWith('/wishlist')) return 'wishlist'
    if (pathname.endsWith('/rankings')) return 'rankings'
    if (pathname.endsWith('/lists')) return 'lists'
    if (pathname.endsWith('/awards')) return 'awards'
    if (pathname.endsWith('/plays')) return 'plays'
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

      const [rankingsResult, listsResult, libraryResult, wishlistResult] =
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
        ])

      const rankings = rankingsResult.data || []
      const lists = listsResult.data || []
      const libraryItems = libraryResult.data || []
      const wishlistItems = wishlistResult.data || []

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
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Profile not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Profile Header - Ultra-Compact Mobile */}
      <div className="bg-white sm:rounded-2xl sm:shadow-sm sm:border sm:border-gray-100 sm:dark:border-gray-800 p-3 sm:p-4">
        <div className="flex items-center gap-3 mb-3">
          <Link
            href={isOwnProfile ? '/settings' : '#'}
            className={`group relative h-12 w-12 sm:h-16 sm:w-16 rounded-xl sm:rounded-2xl overflow-hidden bg-gray-200 flex items-center justify-center flex-shrink-0 ${
              isOwnProfile ? 'cursor-pointer' : 'cursor-default'
            }`}
            aria-label={isOwnProfile ? 'Edit profile photo' : 'Profile photo'}
          >
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-lg sm:text-xl font-semibold">
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
            <Heading as="h1" size="lg" className="font-semibold truncate text-lg sm:text-2xl">
              {profile.username || profile.full_name || 'User Profile'}
            </Heading>
            {profile.full_name && (
              <p className="text-xs sm:text-sm text-gray-600 mt-0.5 truncate">
                {profile.full_name}
              </p>
            )}
            {profile.bio && (
              <p className="hidden sm:block text-sm text-gray-600 mt-2 line-clamp-2">
                {profile.bio}
              </p>
            )}
            {!profile.bio && isOwnProfile && (
              <Link
                href="/settings"
                className="hidden sm:inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 mt-2 transition-colors"
              >
                <PencilSquareIcon className="h-4 w-4" />
                Add bio
              </Link>
            )}
          </div>
        </div>

        {/* Stats Grid - Ultra-Compact Mobile */}
        <div className="grid grid-cols-4 sm:grid-cols-2 gap-2 sm:gap-3">
          {[
            {
              iconBg: 'bg-blue-500',
              Icon: BookmarkIcon,
              label: 'Owned',
              value: stats.gamesOwned,
            },
            {
              iconBg: 'bg-green-500',
              Icon: CubeIcon,
              label: 'Played',
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
              label: 'Lists',
              value: stats.listsCreated,
            },
          ].map((item) => (
            <div
              key={item.label}
              className="text-center sm:bg-gray-50 sm:dark:bg-gray-800/50 sm:rounded-xl sm:p-3 sm:flex sm:items-center sm:gap-3 sm:text-left"
            >
              <div
                className={`hidden sm:flex items-center justify-center w-10 h-10 rounded-lg ${item.iconBg} flex-shrink-0`}
              >
                <item.Icon className="w-5 h-5 text-white" />
              </div>
              <div className="sm:min-w-0 sm:flex-1">
                <div className="text-xl sm:text-lg font-bold text-gray-900 truncate">
                  {item.value}
                </div>
                <div className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase sm:normal-case truncate mt-0.5">
                  {item.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation - Horizontal Scrollable Pills */}
      <div className="relative -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 pb-1 min-w-max">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key
              return (
                <Link
                  key={tab.key}
                  href={tab.href}
                  className={`unstyled px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-primary-600 !text-white shadow-sm'
                      : 'bg-gray-100 !text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tab.label}
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* Page Content */}
      {children}
    </div>
  )
}
