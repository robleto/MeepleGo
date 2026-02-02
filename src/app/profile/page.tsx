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

    const [following, setFollowing] = useState<ProfileLite[]>([])
  
  }
  
  import { redirect } from 'next/navigation'
  
  export default function ProfilePage() {
    redirect('/profile/overview')
    return null
  }
