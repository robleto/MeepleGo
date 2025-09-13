import { notFound, redirect } from 'next/navigation'
import { Metadata } from 'next'
import GameDetailModal from '@/components/Components/GameDetailModal'
import PageLayout from '@/components/Components/PageLayout'
import { getSupabaseServerClient } from '@/lib/supabaseServer'
import { slugify, generateGameKeywords, getGameUrl } from '@/utils/helpers'

interface PageProps {
  params: Promise<{ slug: string }>
}

interface Game {
  id: string // UUID
  name: string
  description: string | null
  year_published: number | null
  min_players: number | null
  max_players: number | null
  playtime_minutes: number | null
  designer: string | null
  publisher: string | null
  image_url: string | null
  thumbnail_url: string | null
  bgg_id: number | null
  categories: string[]
  mechanics: string[]
  rating: number | null
  rank: number | null
  num_ratings: number | null
  weight: number | null
}

async function getGameBySlug(slug: string): Promise<Game | null> {
  const supabase = await getSupabaseServerClient()

  let gameId: string

  // Handle different formats:
  // 1. Legacy numeric BGG ID format: "123"
  // 2. UUID format: "1cc4fcdf-2dce-430d-b336-b7f9f5358680"
  // 3. SEO slug format: "game-name-uuid"

  if (/^\d+$/.test(slug)) {
    // Legacy numeric BGG ID - look up by bgg_id
    const bggId = parseInt(slug, 10)
    const { data: game } = await supabase
      .from('games')
      .select('*')
      .eq('bgg_id', bggId)
      .single()
    return game as Game | null
  } else if (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)
  ) {
    // Raw UUID format
    gameId = slug
  } else {
    // Extract UUID from slug (format: "game-name-uuid")
    const parts = slug.split('-')
    // UUID is always the last 5 parts (8-4-4-4-12 characters)
    if (parts.length >= 5) {
      const uuidParts = parts.slice(-5)
      const potentialUuid = uuidParts.join('-')

      if (
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          potentialUuid
        )
      ) {
        return null
      }

      gameId = potentialUuid
    } else {
      return null
    }
  }

  const { data: game } = await supabase
    .from('games')
    .select('*')
    .eq('id', gameId)
    .single()

  if (!game) return null

  // For slug format, verify it matches the game name
  if (
    !/^\d+$/.test(slug) &&
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      slug
    )
  ) {
    const expectedSlug = `${slugify(game.name)}-${game.id}`
    if (slug !== expectedSlug) {
      return null // This will trigger a 404, but we could also redirect
    }
  }

  return game as Game
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const resolvedParams = await params
  const game = await getGameBySlug(resolvedParams.slug)

  if (!game) {
    return {
      title: 'Game Not Found',
    }
  }

  const title = `${game.name}${game.year_published ? ` (${game.year_published})` : ''} | MeepleGo`
  const description =
    game.description ||
    `Learn about ${game.name}, a board game${game.year_published ? ` published in ${game.year_published}` : ''}${game.designer ? ` by ${game.designer}` : ''}.`

  const playerInfo =
    game.min_players && game.max_players
      ? `${game.min_players}-${game.max_players} players`
      : ''
  const timeInfo = game.playtime_minutes
    ? `${game.playtime_minutes} minutes`
    : ''

  const gameInfo = [playerInfo, timeInfo].filter(Boolean).join(', ')
  const fullDescription = gameInfo ? `${description} ${gameInfo}.` : description

  const imageUrl = game.image_url || game.thumbnail_url
  const keywords = generateGameKeywords(game)

  return {
    title,
    description: fullDescription,
    keywords: keywords.join(', '),
    openGraph: {
      title: game.name,
      description: fullDescription,
      type: 'website',
      images: imageUrl ? [{ url: imageUrl, alt: game.name }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: game.name,
      description: fullDescription,
      images: imageUrl ? [imageUrl] : [],
    },
    alternates: {
      canonical: `/games/${resolvedParams.slug}`,
    },
  }
}

export default async function GamePage({ params }: PageProps) {
  const resolvedParams = await params

  // Handle different redirect scenarios
  if (/^\d+$/.test(resolvedParams.slug)) {
    // Legacy numeric BGG ID - redirect to SEO-friendly format
    const supabase = await getSupabaseServerClient()
    const { data: game } = await supabase
      .from('games')
      .select('id, name')
      .eq('bgg_id', parseInt(resolvedParams.slug, 10))
      .single()

    if (game) {
      redirect(getGameUrl(game))
    } else {
      return notFound()
    }
  } else if (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      resolvedParams.slug
    )
  ) {
    // Raw UUID - redirect to SEO-friendly format
    const supabase = await getSupabaseServerClient()
    const { data: game } = await supabase
      .from('games')
      .select('id, name')
      .eq('id', resolvedParams.slug)
      .single()

    if (game) {
      redirect(getGameUrl(game))
    } else {
      return notFound()
    }
  }

  const game = await getGameBySlug(resolvedParams.slug)

  if (!game) return notFound()

  // Structured data for SEO
  const gameData = {
    '@context': 'https://schema.org',
    '@type': 'Game',
    name: game.name,
    description: game.description,
    datePublished: game.year_published?.toString(),
    creator: game.designer
      ? {
          '@type': 'Person',
          name: game.designer,
        }
      : undefined,
    publisher: game.publisher
      ? {
          '@type': 'Organization',
          name: game.publisher,
        }
      : undefined,
    image: game.image_url || game.thumbnail_url,
    numberOfPlayers:
      game.min_players && game.max_players
        ? {
            '@type': 'QuantitativeValue',
            minValue: game.min_players,
            maxValue: game.max_players,
          }
        : undefined,
    playTime: game.playtime_minutes ? `PT${game.playtime_minutes}M` : undefined,
    aggregateRating:
      game.rating && game.num_ratings
        ? {
            '@type': 'AggregateRating',
            ratingValue: game.rating,
            ratingCount: game.num_ratings,
            bestRating: 10,
            worstRating: 1,
          }
        : undefined,
    genre: game.categories?.length ? game.categories : undefined,
    keywords: game.mechanics?.length ? game.mechanics.join(', ') : undefined,
    url: `https://meeplego.com/games/${resolvedParams.slug}`,
  }

  // Breadcrumb structured data
  const breadcrumbData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://meeplego.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Games',
        item: 'https://meeplego.com/games',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: game.name,
        item: `https://meeplego.com/games/${resolvedParams.slug}`,
      },
    ],
  }

  return (
    <PageLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(gameData),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbData),
        }}
      />
      {/* Server component passes plain data only (no handlers) to client component */}
      <GameDetailModal game={game as any} open variant="page" />
    </PageLayout>
  )
}
