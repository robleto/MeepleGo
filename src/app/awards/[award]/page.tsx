export const revalidate = 0 // ensure fresh data while debugging honor enrichment
import { getSupabaseServerClient } from '@/lib/supabaseServer'
import { searchAwards } from '@/lib/awardsApi'
import { getAwardsForSet } from '@/lib/awardsCache'
import {
  TrophyIcon,
  CalendarIcon,
  UserGroupIcon,
  StarIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline'
import AwardCategoryPanel from '@/components/Components/Awards/AwardCategoryPanel'
import Heading from '@/components/Components/Heading'
import PageLayout from '@/components/Components/PageLayout'

// Award category configurations
const AWARD_CATEGORIES = {
  'golden-geek': {
    id: 'golden-geek',
    name: 'Golden Geek Awards',
    description:
      'Annual awards voted by the BoardGameGeek community, recognizing excellence across multiple categories.',
    icon: TrophyIcon,
    color: 'amber',
    website:
      'https://boardgamegeek.com/boardgamehonor/32396/golden-geek-awards',
  },
  'spiel-des-jahres': {
    id: 'spiel-des-jahres',
    name: 'Spiel des Jahres',
    description:
      'The prestigious German "Game of the Year" award, considered the Oscar of board gaming.',
    icon: TrophyIcon,
    color: 'yellow',
    website: 'https://www.spiel-des-jahres.de/',
  },
  'kinderspiel-des-jahres': {
    id: 'kinderspiel-des-jahres',
    name: 'Kinderspiel des Jahres',
    description:
      'The German "Children\'s Game of the Year" award, recognizing the best family-friendly games.',
    icon: TrophyIcon,
    color: 'green',
    website: 'https://www.spiel-des-jahres.de/',
  },
  'kennerspiel-des-jahres': {
    id: 'kennerspiel-des-jahres',
    name: 'Kennerspiel des Jahres',
    description:
      'The German "Connoisseur Game of the Year" award for more complex games.',
    icon: TrophyIcon,
    color: 'blue',
    website: 'https://www.spiel-des-jahres.de/',
  },
  'deutscher-spiele-preis': {
    id: 'deutscher-spiele-preis',
    name: 'Deutscher Spiele Preis',
    description:
      "Prominent German gamers' award emphasizing gamer opinion and depth.",
    icon: TrophyIcon,
    color: 'rose',
    website: 'https://www.dspielt.de/',
  },
  'origins-awards': {
    id: 'origins-awards',
    name: 'Origins Awards',
    description:
      'Historical industry awards from the Game Manufacturers Association (GAMA).',
    icon: TrophyIcon,
    color: 'violet',
    website: 'https://www.originsgamefair.com/',
  },
  'dice-tower-awards': {
    id: 'dice-tower-awards',
    name: 'The Dice Tower Gaming Awards',
    description:
      'Annual Dice Tower network selections across multiple categories.',
    icon: TrophyIcon,
    color: 'fuchsia',
    website: 'https://www.dicetower.com/awards',
  },
  'as-dor': {
    id: 'as-dor',
    name: "As d'Or",
    description: "French Game of the Year awards (Jeu de l'Année).",
    icon: TrophyIcon,
    color: 'orange',
    website: 'https://www.fij.fr/',
  },
  'international-gamers-award': {
    id: 'international-gamers-award',
    name: 'International Gamers Award',
    description:
      'Global strategy game recognition spanning multiplayer and two-player titles.',
    icon: TrophyIcon,
    color: 'cyan',
    website: 'https://www.internationalgamersaward.net/',
  },
  'ion-award': {
    id: 'ion-award',
    name: 'Ion Award',
    description:
      'Game design competition highlighting prototypes and emerging designers.',
    icon: TrophyIcon,
    color: 'emerald',
    website: 'https://saltcon.com/ion-award/',
  },
  'zenobia-award': {
    id: 'zenobia-award',
    name: 'Zenobia Award',
    description: 'Award encouraging diverse voices in historical game design.',
    icon: TrophyIcon,
    color: 'teal',
    website: 'https://zenobiaaward.org/',
  },
  'charles-s-roberts': {
    id: 'charles-s-roberts',
    name: 'Charles S. Roberts Award',
    description:
      'Historic recognition for excellence in wargame design & publication.',
    icon: TrophyIcon,
    color: 'slate',
    website: 'https://charlieawards.com/',
  },
  sxsw: {
    id: 'sxsw',
    name: 'SXSW',
    description:
      'South by Southwest tabletop game of the year & related honors.',
    icon: TrophyIcon,
    color: 'pink',
    website: 'https://www.sxsw.com/',
  },
  'board-game-quest': {
    id: 'board-game-quest',
    name: 'Board Game Quest',
    description: 'Board Game Quest Awards across production, strategy & more.',
    icon: TrophyIcon,
    color: 'indigo',
    website: 'https://www.boardgamequest.com/',
  },
  'juego-del-ano': {
    id: 'juego-del-ano',
    name: 'Juego del Año',
    description:
      'Spanish-language (Mexico / Tico) Game of the Year recognitions.',
    icon: TrophyIcon,
    color: 'amber',
    website: 'https://juegodelano.mx/',
  },
  'parents-choice': {
    id: 'parents-choice',
    name: "Parents' Choice Approved",
    description: 'Parents Choice award winners & approved recommendations.',
    icon: TrophyIcon,
    color: 'lime',
    website: 'https://www.parentschoice.org/',
  },
  guldbrikken: {
    id: 'guldbrikken',
    name: 'Guldbrikken',
    description: 'Danish awards (children, family, adult & special jury).',
    icon: TrophyIcon,
    color: 'yellow',
    website: 'https://www.guldbrikken.dk/',
  },
}

interface Honor {
  name: string
  year: number
  category: 'Winner' | 'Nominee' | 'Special'
  award_type: string
  title?: string
  position?: string
  description?: string
  subcategory?: string
  primary_winner?: boolean
  // Optional raw / enrichment fields (present in normalized honor JSON)
  slug?: string
  result_raw?: string | null
  derived_result?: string | null
  honor_id?: string
}
interface Game {
  id?: string
  name: string
  year_published: number
  image_url?: string
  thumbnail_url?: string
  honors: Honor[]
}

interface AwardYearGroup {
  year: number
  primary: { game: Game; honor: Honor } | null
  categoryWinners: Array<{ subcategory: string; game: Game; honor: Honor }>
  nominees: Game[]
  special: Game[]
  // Add support for categorized structure
  categories?: Array<{
    name: string
    winner: Game | null
    nominees: Game[]
    special: Game[]
  }>
}

const GAMES_LOOKUP_CHUNK_SIZE = 150

function normalizeGameNameForLookup(value: string | null | undefined) {
  if (!value) return ''
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

async function fetchGamesByAwardNames(
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>,
  names: string[]
): Promise<Game[]> {
  if (!names.length) return []
  const rows: Game[] = []

  for (let i = 0; i < names.length; i += GAMES_LOOKUP_CHUNK_SIZE) {
    const chunk = names.slice(i, i + GAMES_LOOKUP_CHUNK_SIZE)
    const { data, error } = await supabase
      .from('games')
      .select('id, name, year_published, image_url, thumbnail_url, honors')
      .in('name', chunk)

    if (error) {
      console.warn('Warning: games lookup chunk failed in getAwardData', {
        message: error.message,
        chunkSize: chunk.length,
      })
      continue
    }

    rows.push(...((data || []) as Game[]))
  }

  return rows
}

async function fetchGamesByAwardIds(
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>,
  ids: string[]
): Promise<Game[]> {
  if (!ids.length) return []
  const rows: Game[] = []

  for (let i = 0; i < ids.length; i += GAMES_LOOKUP_CHUNK_SIZE) {
    const chunk = ids.slice(i, i + GAMES_LOOKUP_CHUNK_SIZE)
    const { data, error } = await supabase
      .from('games')
      .select('id, name, year_published, image_url, thumbnail_url, honors')
      .in('id', chunk)

    if (error) {
      console.warn('Warning: games id lookup chunk failed in getAwardData', {
        message: error.message,
        chunkSize: chunk.length,
      })
      continue
    }

    rows.push(...((data || []) as Game[]))
  }

  return rows
}


async function getAwardData(awardType: string): Promise<AwardYearGroup[]> {
  const supabase = await getSupabaseServerClient()

  try {
    const awards = await getAwardsForSet(awardType, async () => {
      const response = await searchAwards({
        search: awardType,
        award_set: awardType,
      })
      return response.Response === 'True' ? response.awards || [] : []
    })

    if (!awards.length) return []
    const gameNames = new Set<string>()
    const gameIds = new Set<string>()
    awards.forEach((award) => {
      award.boardgames?.forEach((game) => {
        if (game.name) gameNames.add(game.name)
        if (typeof game.id === 'string' && game.id) gameIds.add(game.id)
      })
    })

    const [gamesByIdRows, gamesByNameRows] = await Promise.all([
      fetchGamesByAwardIds(supabase, Array.from(gameIds)),
      fetchGamesByAwardNames(supabase, Array.from(gameNames)),
    ])
    const games = [...gamesByIdRows, ...gamesByNameRows]
    const gamesById = new Map<string, Game>()
    const gamesByName = new Map<string, Game>()
    games.forEach((game) => {
      if (game.id && !gamesById.has(game.id)) {
        gamesById.set(game.id, game as Game)
      }
      if (!gamesByName.has(game.name)) {
        gamesByName.set(game.name, game as Game)
      }
      const normalized = normalizeGameNameForLookup(game.name)
      if (normalized && !gamesByName.has(normalized)) {
        gamesByName.set(normalized, game as Game)
      }
    })

    const yearMap = new Map<number, AwardYearGroup>()

    awards.forEach((award) => {
      if (!award.year) return
      if (!yearMap.has(award.year)) {
        yearMap.set(award.year, {
          year: award.year,
          primary: null,
          categoryWinners: [],
          nominees: [],
          special: [],
          categories: [],
        })
      }

      const bucket = yearMap.get(award.year)!
      const categoryName = award.position || award.title || 'Award'

      if (!bucket.categories) bucket.categories = []
      let category = bucket.categories.find((c) => c.name === categoryName)
      if (!category) {
        category = { name: categoryName, winner: null, nominees: [], special: [] }
        bucket.categories.push(category)
      }

      award.boardgames?.forEach((boardgame) => {
        const name = boardgame.name || ''
        const normalizedName = normalizeGameNameForLookup(name)
        const gameId = typeof boardgame.id === 'string' ? boardgame.id : ''
        const gameData =
          (gameId ? gamesById.get(gameId) : undefined) ||
          gamesByName.get(name) ||
          gamesByName.get(normalizedName) ||
          ({
            id: undefined,
            name,
            year_published: award.year,
            image_url:
              boardgame.image_url ||
              boardgame.image ||
              null,
            thumbnail_url:
              boardgame.thumbnail_url ||
              boardgame.thumbnail ||
              null,
            honors: [],
          } as Game)

        if (award.isWinner) {
          category!.winner = gameData
        } else if (award.isNominee) {
          category!.nominees.push(gameData)
        } else {
          category!.special.push(gameData)
        }
      })
    })

    const years = Array.from(yearMap.values()).sort((a, b) => b.year - a.year)
    years.forEach((y) => {
      if (y.categories) {
        y.categories.sort((a, b) => a.name.localeCompare(b.name))
        y.categories.forEach((cat) => {
          cat.nominees.sort((a, b) => a.name.localeCompare(b.name))
          cat.special.sort((a, b) => a.name.localeCompare(b.name))
        })
      }
    })

    return years
  } catch (error) {
    console.warn('Warning: exception in getAwardData', { message: (error as any)?.message })
    return []
  }
}

function YearSection({
  yearData,
  awardType,
  isLast,
}: {
  yearData: AwardYearGroup
  awardType: string
  isLast: boolean
}) {
  // multi-equal flag retained for potential future labeling
  const multiEqual = /(Mensa Select|Meeples Choice Award)/i.test(awardType)

  // Check if this is a categorized award structure
  const hasCategories = yearData.categories && yearData.categories.length > 0
  // Build a normalized categories array so we can always use the categorized renderer.
  let normalizedCategories = yearData.categories
  if (!hasCategories) {
    normalizedCategories = []
    // Primary winner category
    if (yearData.primary) {
      normalizedCategories.push({
        name: 'Winner',
        winner: yearData.primary.game,
        nominees: [],
        special: [],
      })
    }
    // Category winners -> each its own category
    yearData.categoryWinners.forEach((cw) => {
      normalizedCategories!.push({
        name: cw.subcategory || 'Category Winner',
        winner: cw.game,
        nominees: [],
        special: [],
      })
    })
    // Unified nominees + special as a single "Nominees" category (winner null)
    const unifiedNominees = Array.from(
      new Map(
        [...yearData.nominees, ...yearData.special].map((g) => [
          g.id ?? g.name,
          g,
        ])
      ).values()
    ).sort((a, b) => a.name.localeCompare(b.name))
    if (unifiedNominees.length > 0) {
      normalizedCategories!.push({
        name: 'Nominees',
        winner: null,
        nominees: unifiedNominees,
        special: [],
      })
    }
  }

  return (
    <div className="relative flex">
      {/* Timeline rail (hidden on small screens) */}
      <div className="relative flex flex-col items-center w-12 md:w-24 shrink-0">
        {/* Vertical line */}
        <div
          className={`hidden md:block absolute top-0 ${!isLast ? 'bottom-0' : 'h-1/2'} left-1/2 -translate-x-1/2 w-0.5 bg-gradient-to-b from-gray-200 via-gray-200 to-transparent pointer-events-none`}
          aria-hidden="true"
        />
        {/* Year marker */}
        <div className="sticky top-24 flex flex-col items-center">
          <div className="relative w-10 h-16 md:h-20 flex items-center justify-center">
            {/* Dot */}
            <div className="absolute top-0 md:top-0 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-white ring-2 ring-gray-300 shadow flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-gray-300" />
            </div>
            {/* Rotated year positioned southwest of dot */}
            <span
              aria-hidden="true"
              className="hidden md:block absolute top-2 md:top-2 left-1/2 -translate-x-1/2 translate-y-1/2 -rotate-90 origin-center text-4xl font-extrabold text-gray-300 tracking-tight select-none pointer-events-none pr-6"
              style={{ transform: 'translate(-67%, 100%) rotate(-90deg)' }}
            >
              {yearData.year}
            </span>
            <span className="sr-only">{yearData.year}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 pb-16">
        {/* Mobile year heading */}
        <div className="md:hidden flex items-center gap-2 mb-4">
          <CalendarIcon className="w-5 h-5 text-gray-500" />
          <h2 className="text-xl font-bold text-gray-900 font-display tracking-tight">
            {yearData.year}
          </h2>
        </div>
        {/* Meta summary with icons */}
        <div className="text-xs text-gray-600 mb-6 font-medium flex flex-wrap items-center gap-x-6 gap-y-2">
          {(() => {
            if (hasCategories) {
              const categoriesCount = yearData.categories!.length
              const winnersCount = yearData.categories!.reduce(
                (sum, c) => sum + (c.winner ? 1 : 0),
                0
              )
              const nomineesCount = yearData.categories!.reduce(
                (sum, c) => sum + c.nominees.length,
                0
              )
              const specialCount = yearData.categories!.reduce(
                (sum, c) => sum + c.special.length,
                0
              )
              return (
                <>
                  <span className="inline-flex items-center gap-1.5"><Squares2X2Icon className="w-4 h-4 text-gray-500" /> {categoriesCount} {categoriesCount === 1 ? 'category' : 'categories'}</span>
                  <span className="inline-flex items-center gap-1.5"><TrophyIcon className="w-4 h-4 text-amber-500" /> {winnersCount} winner{winnersCount === 1 ? '' : 's'}</span>
                  <span className="inline-flex items-center gap-1.5"><UserGroupIcon className="w-4 h-4 text-gray-500" /> {nomineesCount} nominee{nomineesCount === 1 ? '' : 's'}</span>
                  {specialCount > 0 && (
                    <span className="inline-flex items-center gap-1.5"><StarIcon className="w-4 h-4 text-sky-500" /> {specialCount} special</span>
                  )}
                </>
              )
            }
            const winnersCount = (yearData.primary ? 1 : 0) + yearData.categoryWinners.length
            const nomineesCount = yearData.nominees.length
            const specialCount = yearData.special.length
            return (
              <>
                <span className="inline-flex items-center gap-1.5"><TrophyIcon className="w-4 h-4 text-amber-500" /> {winnersCount} winner{winnersCount === 1 ? '' : 's'}</span>
                <span className="inline-flex items-center gap-1.5"><UserGroupIcon className="w-4 h-4 text-gray-500" /> {nomineesCount} nominee{nomineesCount === 1 ? '' : 's'}</span>
                {specialCount > 0 && (
                  <span className="inline-flex items-center gap-1.5"><StarIcon className="w-4 h-4 text-sky-500" /> {specialCount} special</span>
                )}
              </>
            )
          })()}
        </div>

        {normalizedCategories &&
          normalizedCategories.map((category, idx) => {
            const hasRightContent =
              category.nominees.length > 0 || category.special.length > 0
            const combinedNominees = Array.from(
              new Map(
                [...category.nominees, ...category.special].map((g) => [
                  g.id ?? g.name,
                  g,
                ])
              ).values()
            ).sort((a, b) => a.name.localeCompare(b.name))
            const nomineeOnly =
              !category.winner &&
              combinedNominees.length > 0 &&
              category.name === 'Nominees'

            {
              /* Awards Winner/Nom Card */
            }
            return (
              <AwardCategoryPanel
                key={category.name}
                title={category.name}
                yearLabel={yearData.year}
                winner={category.winner}
                nominees={combinedNominees}
                nomineeOnly={nomineeOnly}
              />
            )
          })}
      </div>
    </div>
  )
}

export default async function AwardPage({
  params,
}: {
  params: Promise<{ award: string }>
}) {
  const { award } = await params
  const awardConfig = AWARD_CATEGORIES[award as keyof typeof AWARD_CATEGORIES]

  if (!awardConfig) {
    return (
      <PageLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900">Award Not Found</h1>
          <p className="text-gray-600 mt-2">
            The award category you're looking for doesn't exist.
          </p>
        </div>
      </PageLayout>
    )
  }

  // Map award page slugs to database award_type values
  const awardTypeMap: Record<string, string> = {
    'golden-geek': 'Golden Geek Awards',
    'spiel-des-jahres': 'Spiel des Jahres',
    'kinderspiel-des-jahres': 'Kinderspiel des Jahres',
    'kennerspiel-des-jahres': 'Kennerspiel des Jahres',
    'deutscher-spiele-preis': 'Deutscher Spiele Preis',
    'origins-awards': 'Origins Awards',
    'dice-tower-awards': 'The Dice Tower Gaming Awards',
    'as-dor': "As d'Or - Jeu de l'Année",
    'international-gamers-award': 'International Gamers Award',
    'ion-award': 'Ion Award',
    'zenobia-award': 'Zenobia Award',
    'charles-s-roberts': 'Charles S. Roberts',
    sxsw: 'SXSW',
    'board-game-quest': 'Board Game Quest Awards',
    'juego-del-ano': 'Juego del Año',
    'parents-choice': 'Parents Choice',
    guldbrikken: 'Guldbrikken',
  }

  const awardType = awardTypeMap[award]

  // Use unified data fetching for all awards
  const awardData = await getAwardData(awardType)

  const IconComponent = awardConfig.icon

  // Global stats across all years (support both categorized and non-categorized structures)
  const globalStats = (() => {
    return awardData.reduce(
      (acc, y) => {
        if (Array.isArray(y.categories) && y.categories.length) {
          acc.categories += y.categories.length
          acc.winners += y.categories.reduce(
            (s, c) => s + (c.winner ? 1 : 0),
            0
          )
          acc.nominees += y.categories.reduce(
            (s, c) => s + c.nominees.length,
            0
          )
          acc.special += y.categories.reduce(
            (s, c) => s + c.special.length,
            0
          )
        } else {
          const winnersCount = (y.primary ? 1 : 0) + y.categoryWinners.length
          const categoriesCount = winnersCount // treat each winner slot as a category
          acc.categories += categoriesCount
          acc.winners += winnersCount
          acc.nominees += y.nominees.length
          acc.special += y.special.length
        }
        return acc
      },
      { categories: 0, winners: 0, nominees: 0, special: 0 }
    )
  })()

  return (
    <PageLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div
              className={`p-4 rounded-full ${
                awardConfig.color === 'amber'
                  ? 'bg-amber-100'
                  : awardConfig.color === 'yellow'
                    ? 'bg-yellow-100'
                    : awardConfig.color === 'green'
                      ? 'bg-green-100'
                      : 'bg-blue-100'
              }`}
            >
              <IconComponent
                className={`w-10 h-10 ${
                  awardConfig.color === 'amber'
                    ? 'text-amber-600'
                    : awardConfig.color === 'yellow'
                      ? 'text-yellow-600'
                      : awardConfig.color === 'green'
                        ? 'text-green-600'
                        : 'text-blue-600'
                }`}
              />
            </div>
          </div>
          <Heading
            as="h1"
            size="display"
            gradient
            weightScale
            align="center"
            displayFont
            className="mb-4"
          >
            {awardConfig.name}
          </Heading>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
            {awardConfig.description}
          </p>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 text-[11px] uppercase tracking-wide text-gray-500 font-medium">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              {awardData.length} Years
            </div>
            <div className="flex items-center gap-2">
              <TrophyIcon className="w-4 h-4" />
              {globalStats.winners}{' '}
              Winners
            </div>
            <div className="flex items-center gap-2">
              <UserGroupIcon className="w-4 h-4" />
              {globalStats.nominees + globalStats.special}{' '}
              Other Recognitions
            </div>
          </div>
        </div>

        {/* Award data by year */}
        <div className="space-y-8">
          {awardData.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                No award data available for this category yet.
              </p>
            </div>
          ) : (
            awardData.map((yearData, idx) => (
              <YearSection
                key={yearData.year}
                yearData={yearData}
                awardType={awardType}
                isLast={idx === awardData.length - 1}
              />
            ))
          )}
        </div>
      </div>
    </PageLayout>
  )
}
