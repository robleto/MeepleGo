/**
 * This file now acts as a thin data wrapper kept in app/ for backward compatibility.
 * The presentational component lives in components/Components/HomepageView.tsx for Storybook usage.
 */
'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import HomepageView, { type UserStats } from '@/components/Components/HomepageView'
import type { Game } from '@/types/supabase'
import awardsData from '@/data/awards.json'

// Module-level cache so dev double-mount doesn't blank out the section
let cachedFeaturedGames: Game[] | null = null
let cachedPublicLists: any[] | null = null
let cachedIndustryAwards: any[] | null = null

// Initialize awards immediately
const INDUSTRY_AWARDS = (awardsData as any).categories.slice(0, 3).map((c: any) => ({
  ...c,
  icon: 'TrophyIcon',
}))

// Mock public lists as fallback
const MOCK_PUBLIC_LISTS = [
  {
    id: 'mock-1',
    name: 'Best Strategy Games',
    description: 'Top strategy games for serious gamers',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    list_type: 'user_custom',
  },
  {
    id: 'mock-2', 
    name: 'Family Game Night',
    description: 'Perfect games for the whole family',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    list_type: 'user_custom',
  },
  {
    id: 'mock-3',
    name: 'Party Games',
    description: 'Fun games for large groups',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    list_type: 'user_custom',
  },
]

// Mock games as immediate fallback so trending never disappears
const TRENDING_GAMES: Game[] = Array.from({ length: 6 }, (_, i) => ({
  id: `trending-${i}`,
  bgg_id: 0,
  name: `Trending Game ${i + 1}`,
  year_published: 2024,
  image_url: '/placeholder-game.svg',
  thumbnail_url: '/placeholder-game.svg',
  categories: null,
  mechanics: null,
  min_players: 1,
  max_players: 4,
  playtime_minutes: 60,
  publisher: null,
  description: null,
  summary: null,
  rank: null,
  rating: null,
  num_ratings: null,
  cached_at: null,
  created_at: '',
  updated_at: '',
}))

const PLACEHOLDER_GAMES: Game[] = Array.from({ length: 6 }, (_, i) => ({
  id: `placeholder-${i}` as any,
  bgg_id: 0,
  name: 'Loading…',
  year_published: null,
  image_url: '/placeholder-game.svg',
  thumbnail_url: '/placeholder-game.svg',
  categories: null,
  mechanics: null,
  designers: null,
  artists: null,
  min_players: null,
  max_players: null,
  playtime_minutes: null,
  age: null,
  weight: null,
  publisher: null,
  description: null,
  summary: null,
  rank: null,
  rating: null,
  num_ratings: null,
  cached_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}))

export default function HomepageContent() {
  const [user, setUser] = useState<any>(null)
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [featuredGames, setFeaturedGames] = useState<Game[]>(cachedFeaturedGames || TRENDING_GAMES)
  const [loading, setLoading] = useState(true)
  const [industryAwards, setIndustryAwards] = useState<any[]>(cachedIndustryAwards || INDUSTRY_AWARDS)
  const [publicLists, setPublicLists] = useState<any[]>(cachedPublicLists || MOCK_PUBLIC_LISTS)

  useEffect(() => {
    let cancelled = false
    
    async function loadData() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (cancelled) return
        setUser(session?.user || null)

        // Trending games simple load: hotness -> API -> mock
        let gotGames = false
        try {
          const { data: hotness, error: hotErr } = await supabase
            .from('game_lists')
            .select('id')
            .eq('list_type', 'bgg_hotness')
            .limit(1)
          if (!hotErr && hotness && hotness.length === 1) {
            const { data: listItems, error: itemsErr } = await supabase
              .from('game_list_items')
              .select(`
                games (
                  id,
                  name,
                  year_published,
                  image_url,
                  thumbnail_url,
                  rating,
                  categories,
                  min_players,
                  max_players,
                  playtime_minutes
                )
              `)
              .eq('list_id', hotness[0].id)
              .order('ranking', { ascending: true })
              .limit(6)
            if (!itemsErr && listItems && listItems.length) {
              const games = listItems
                .map(i => (i as any).games)
                .filter(Boolean) as unknown as Game[]
              if (!cancelled) {
                cachedFeaturedGames = games
                setFeaturedGames(games)
              }
              gotGames = true
            }
          }
        } catch {}
        if (!gotGames) {
          try {
            const res = await fetch('/api/games?limit=6&sort=rank&orderBy=asc')
            if (res.ok) {
              const data = await res.json()
              if (data.games?.length) {
                if (!cancelled) {
                  cachedFeaturedGames = data.games
                  setFeaturedGames(data.games)
                }
                gotGames = true
              }
            }
          } catch {}
        }
        if (!gotGames && !cancelled) {
          cachedFeaturedGames = TRENDING_GAMES
          setFeaturedGames(TRENDING_GAMES)
        }

        // Ensure awards are loaded
        console.log('Loading industry awards from JSON data')
        if (!cancelled) {
          cachedIndustryAwards = INDUSTRY_AWARDS
          setIndustryAwards(INDUSTRY_AWARDS)
        }

        // Load public lists (simplified)
        try {
          console.log('Loading public lists...')
          const { data: publicListsData, error: listsError } = await supabase
            .from('game_lists')
            .select(`
              id,
              name,
              description,
              created_at,
              updated_at,
              list_type
            `)
            .eq('is_public', true)
            .order('updated_at', { ascending: false })
            .limit(6)

          console.log('Public lists query result:', { publicListsData, listsError })

          if (!listsError && publicListsData && publicListsData.length > 0) {
            console.log('Found public lists:', publicListsData)
            if (!cancelled) {
              cachedPublicLists = publicListsData
              setPublicLists(publicListsData)
            }
          } else {
            console.log('No public lists found, checking for BGG lists without user profiles')
            // Try BGG lists which don't have user profiles
            const { data: bggLists, error: bggError } = await supabase
              .from('game_lists')
              .select(`
                id,
                name,
                description,
                created_at,
                updated_at,
                list_type
              `)
              .in('list_type', ['bgg_hotness', 'bgg_trendingplays', 'bgg_bestsellers', 'bgg_mostplayed'])
              .limit(3)

            if (!bggError && bggLists && bggLists.length > 0) {
              console.log('Found BGG lists:', bggLists)
              if (!cancelled) {
                cachedPublicLists = bggLists
                setPublicLists(bggLists)
              }
            } else {
              console.log('No real lists found, using fallback')
              if (!cancelled) {
                cachedPublicLists = MOCK_PUBLIC_LISTS
                setPublicLists(MOCK_PUBLIC_LISTS)
              }
            }
          }
        } catch (error) {
          console.error('Error loading public lists:', error)
          if (!cancelled) {
            cachedPublicLists = MOCK_PUBLIC_LISTS
            setPublicLists(MOCK_PUBLIC_LISTS)
          }
        }
      } catch (e) {
        if (!cancelled) console.error('Error loading homepage data:', e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadData()
    return () => {
      cancelled = true
    }
  }, [])

  // Debug logging
  console.log('Homepage data:', {
    featuredGames: featuredGames.length,
    industryAwards: industryAwards.length,
    publicLists: publicLists.length,
    loading
  })

  return (
    <HomepageView
      user={user}
      loading={loading}
      featuredGames={featuredGames}
      userStats={userStats}
      industryAwards={industryAwards}
      publicLists={publicLists}
    />
  )
}
