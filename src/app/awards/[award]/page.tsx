export const revalidate = 0 // ensure fresh data while debugging honor enrichment
import { supabase } from '@/lib/supabase'
import { inferHonorCategory } from '@/utils/honors'
import {
  TrophyIcon,
  CalendarIcon,
  UserGroupIcon,
  StarIcon,
} from '@heroicons/react/24/outline'
import GameCard from '@/components/shared/GameCard'
import Heading from '@/components/shared/Heading'
import PageLayout from '@/components/shared/PageLayout'

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
    description: "Prominent German gamers' award emphasizing gamer opinion and depth.",
    icon: TrophyIcon,
    color: 'rose',
    website: 'https://www.dspielt.de/',
  },
  'origins-awards': {
    id: 'origins-awards',
    name: 'Origins Awards',
    description: 'Historical industry awards from the Game Manufacturers Association (GAMA).',
    icon: TrophyIcon,
    color: 'violet',
    website: 'https://www.originsgamefair.com/',
  },
  'dice-tower-awards': {
    id: 'dice-tower-awards',
    name: 'The Dice Tower Gaming Awards',
    description: 'Annual Dice Tower network selections across multiple categories.',
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
    description: 'Global strategy game recognition spanning multiplayer and two-player titles.',
    icon: TrophyIcon,
    color: 'cyan',
    website: 'https://www.internationalgamersaward.net/',
  },
  'ion-award': {
    id: 'ion-award',
    name: 'Ion Award',
    description: 'Game design competition highlighting prototypes and emerging designers.',
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
    description: 'Historic recognition for excellence in wargame design & publication.',
    icon: TrophyIcon,
    color: 'slate',
    website: 'https://charlieawards.com/',
  },
  'sxsw': {
    id: 'sxsw',
    name: 'SXSW',
    description: 'South by Southwest tabletop game of the year & related honors.',
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
    description: 'Spanish-language (Mexico / Tico) Game of the Year recognitions.',
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
  'guldbrikken': {
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
  bgg_id: number
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

async function getAwardData(awardType: string): Promise<AwardYearGroup[]> {
  // Get all games with pagination to avoid 1000 record limit
  let allGames: Game[] = []
  let page = 0
  const pageSize = 1000

  while (true) {
    const { data: games, error } = await supabase
      .from('games')
  // Select current schema columns (playtime_minutes in canonical schema)
	.select('bgg_id, name, year_published, image_url, thumbnail_url, honors, min_players, max_players, playtime_minutes')
      .not('honors', 'eq', '[]')
      .range(page * pageSize, (page + 1) * pageSize - 1)

    if (error) {
      console.error('Error fetching award data:', error)
      break
    }

    if (!games || games.length === 0) break
  const normalized = (games as any[]).map(g => g)
  allGames = allGames.concat(normalized as Game[])
    if (games.length < pageSize) break // Last page
    page++
  }

  // Check if this award type has categories by looking for position-based awards
  const relevantHonors = allGames.flatMap((game) =>
    (game.honors || []).filter((h) => h.award_type === awardType)
  )

  const hasCategories = relevantHonors.some(
    (h) =>
      h.position &&
      h.position !== h.award_type &&
      (h.position.includes('Best ') || h.position.includes('Game of the'))
  )

  console.log(`Award type "${awardType}" has categories:`, hasCategories)

  /*
   * De-duplicate multiple honor entries for same (game, year, awardType) with precedence:
   * Winner > Nominee > Special. Keeps only the highest category per game per year.
   * Also filter out fake "games" that are actually award category names.
   */
  const yearMap = new Map<number, AwardYearGroup>()

  allGames
    .filter((game) => {
      // Filter out award category names that were incorrectly imported as "games"
      const name = game.name.toLowerCase()
      // heuristics strengthened for Golden Geek placeholder rows like:
      // "Golden Geek Best Print and Play Board Game" (no real game image/year)
      const looksGoldenGeekCategory =
        /^golden geek best /.test(name) &&
        (name.endsWith(' board game') ||
          name.endsWith(' game') ||
          name.includes('print and play'))
      const truncatedSuffix = /( no$| wi$)/.test(name) // from slug truncation (No / Wi)
      const matchesHonorPosition = (game.honors || []).some(
        (h) =>
          h.position && h.position.toLowerCase() === game.name.toLowerCase()
      )
      const missingRealGameSignals =
        !game.year_published && !game.image_url && !game.thumbnail_url

      const isAwardName =
        name.includes('recommended') ||
        name.includes('award') ||
        name.includes('nominee') ||
        name.includes('winner') ||
        name.startsWith('charles s roberts best ') ||
        // truncated forms
        name.endsWith('winn') ||
        name.endsWith('winne') ||
        name.includes('winn ') ||
        name.includes('nomin') ||
        name.endsWith('nom') ||
        name.endsWith('nomi') ||
        name.includes('spiel des jahres') ||
        name.includes('dragon awards') ||
        name.includes('hit fur') ||
        name.includes('hit für') ||
        looksGoldenGeekCategory ||
        (looksGoldenGeekCategory && truncatedSuffix) ||
        (matchesHonorPosition && missingRealGameSignals) ||
        (!game.year_published &&
          (name.includes('spiel') ||
            name.includes('award') ||
            name.includes('prize')))
      return !isAwardName
    })
    .forEach((game: Game) => {
      ;(game.honors || [])
        .filter((h) => h.award_type === awardType && typeof h.year === 'number')
        .forEach((h) => {
          // Normalize / repair category in-memory without mutating stored data permanently
          // For Golden Geek, pass game count context to help with truncated winner detection
          const gameCountInCategory = allGames.filter((g) =>
            (g.honors || []).some(
              (gh) =>
                gh.honor_id === h.honor_id &&
                gh.position === h.position &&
                gh.year === h.year
            )
          ).length

          const effectiveCategory = inferHonorCategory(h, {
            gameCount: gameCountInCategory,
          })
          // If the stored category was downgraded to Special due to truncation, use inferred
          if (h.category !== effectiveCategory) {
            // Create a shallow mutation for runtime only
            ;(h as any)._originalCategory = h.category
            h.category = effectiveCategory
          }
          if (!yearMap.has(h.year)) {
            yearMap.set(h.year, {
              year: h.year,
              primary: null,
              categoryWinners: [],
              nominees: [],
              special: [],
            })
          }
          const bucket = yearMap.get(h.year)!

          if (hasCategories) {
            // For categorized awards (like Golden Geek), group by position/category
            const categoryName =
              h.position?.replace(
                new RegExp(`^${awardType.replace('Awards', '').trim()} ?`),
                ''
              ) || 'Unknown Category'

            // Initialize categories map if needed
            if (!bucket.categories) {
              bucket.categories = []
            }

            // Find or create category
            let category = bucket.categories.find(
              (c) => c.name === categoryName
            )
            if (!category) {
              category = {
                name: categoryName,
                winner: null,
                nominees: [],
                special: [],
              }
              bucket.categories.push(category)
            }

            // Add game to appropriate section within the category
            if (h.category === 'Winner') {
              category.winner = game
            } else if (h.category === 'Nominee') {
              if (!category.nominees.find((g) => g.bgg_id === game.bgg_id)) {
                category.nominees.push(game)
              }
            } else if (h.category === 'Special') {
              if (!category.special.find((g) => g.bgg_id === game.bgg_id)) {
                category.special.push(game)
              }
            }
          } else {
            // For simple awards (like Spiel des Jahres), use traditional structure
            if (h.category === 'Winner') {
              // Check if this is the main winner (no subcategory) or a category winner
              if (
                !h.subcategory ||
                h.subcategory === 'Overall' ||
                h.subcategory === 'Game of the Year'
              ) {
                if (!bucket.primary) bucket.primary = { game, honor: h }
                else
                  bucket.categoryWinners.push({
                    subcategory: h.subcategory || 'Overall',
                    game,
                    honor: h,
                  })
              } else {
                bucket.categoryWinners.push({
                  subcategory: h.subcategory,
                  game,
                  honor: h,
                })
              }
            } else if (h.category === 'Nominee') {
              if (!bucket.nominees.find((g) => g.bgg_id === game.bgg_id)) {
                bucket.nominees.push(game)
              }
            } else if (h.category === 'Special') {
              if (!bucket.special.find((g) => g.bgg_id === game.bgg_id)) {
                bucket.special.push(game)
              }
            }
          }
        })
    })

  const years: AwardYearGroup[] = Array.from(yearMap.values()).sort(
    (a, b) => b.year - a.year
  )
  // De-duplicate nominees & specials (a game may appear multiple honors same year)
  years.forEach((y) => {
    const dedupe = (arr: Game[]) =>
      Array.from(new Map(arr.map((g) => [g.bgg_id, g])).values())
    y.nominees = dedupe(y.nominees).sort((a, b) => a.name.localeCompare(b.name))
    y.special = dedupe(y.special).sort((a, b) => a.name.localeCompare(b.name))
    // Sort category winners by subcategory then name
    y.categoryWinners.sort(
      (a, b) =>
        a.subcategory.localeCompare(b.subcategory) ||
        a.game.name.localeCompare(b.game.name)
    )

    // Sort categories if present
    if (y.categories) {
      y.categories.sort((a, b) => a.name.localeCompare(b.name))
      y.categories.forEach((cat) => {
        cat.nominees.sort((a, b) => a.name.localeCompare(b.name))
        cat.special.sort((a, b) => a.name.localeCompare(b.name))
      })
    }
  })
  return years
}

// Helper to adapt awards Game type to GameCard expected shape
function toGameWithRanking(g: Game) {
  return {
    ...g,
    id: String(g.bgg_id), // fabricate stable id from bgg_id for GameCard
    ranking: null,
    list_membership: { library: false, wishlist: false },
  } as any
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
        [...yearData.nominees, ...yearData.special].map((g) => [g.bgg_id, g])
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
              className="hidden md:block absolute top-2 md:top-2 left-1/2 -translate-x-1/2 translate-y-1/2 -rotate-90 origin-center text-4xl font-extrabold text-gray-300 dark:text-gray-600 tracking-tight select-none pointer-events-none pr-6"
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
        {/* Meta summary */}
        <div className="text-xs text-gray-500 mb-6 font-medium">
          {hasCategories ? (
            <>
              {yearData.categories!.length} categor
              {yearData.categories!.length !== 1 ? 'ies' : 'y'}
              {yearData.categories!.reduce(
                (sum, cat) => sum + cat.nominees.length,
                0
              ) > 0 &&
                `, ${yearData.categories!.reduce((sum, cat) => sum + cat.nominees.length, 0)} nominee${yearData.categories!.reduce((sum, cat) => sum + cat.nominees.length, 0) !== 1 ? 's' : ''}`}
              {yearData.categories!.reduce(
                (sum, cat) => sum + cat.special.length,
                0
              ) > 0 &&
                `, ${yearData.categories!.reduce((sum, cat) => sum + cat.special.length, 0)} special`}
            </>
          ) : (
            <>
              {yearData.primary ? 1 : 0} primary
              {yearData.categoryWinners.length > 0 &&
                `, ${yearData.categoryWinners.length} category winner${yearData.categoryWinners.length !== 1 ? 's' : ''}`}
              {multiEqual &&
                yearData.primary &&
                yearData.primary.honor &&
                yearData.primary.honor.award_type.match(
                  /Mensa Select|Meeples Choice/
                ) &&
                ' (multi-equal)'}
              {yearData.nominees.length > 0 &&
                `, ${yearData.nominees.length} nominee${yearData.nominees.length !== 1 ? 's' : ''}`}
              {yearData.special.length > 0 &&
                `, ${yearData.special.length} special`}
            </>
          )}
        </div>

        {normalizedCategories && normalizedCategories.map((category, idx) => {
          const hasRightContent =
            category.nominees.length > 0 || category.special.length > 0
          const combinedNominees = Array.from(
            new Map(
              [...category.nominees, ...category.special].map((g) => [
                g.bgg_id,
                g,
              ])
            ).values()
          ).sort((a, b) => a.name.localeCompare(b.name))
          const nomineeOnly = !category.winner && combinedNominees.length > 0 && category.name === 'Nominees'
          
          
           {/* Awards Winner/Nom Card */}
          return (
            <div key={category.name} className="panel">
              <Heading as="h3" size="lg" className="mb-6 flex items-center font-semibold gap-2">
                <TrophyIcon className="w-5 h-5 text-yellow-500" />
                <span>{category.name}</span>
              </Heading>
              <div className={`md:grid md:grid-cols-12 md:gap-8 items-start ${nomineeOnly ? 'md:block' : ''}`}>
                {!nomineeOnly && (
                  <div className="md:col-span-4 mb-6 md:mb-0">
                    <div className="flex items-center gap-2 mb-3 font-display">
                      <TrophyIcon className="w-4 h-4 text-amber-500" />
                      <h4 className="text-sm font-semibold text-gray-700">Winner</h4>
                    </div>
                    {category.winner ? (
                      <div className="relative group">
                        <GameCard
                          game={toGameWithRanking(category.winner)}
                          viewMode="grid"
                          className=""
                          hideWinnerBadge
                          showSummary
                          emphasizeMeta
                          showMeta={false}
                          titleClassName="text-base font-semibold"
                        />
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 italic">No winner recorded</div>
                    )}
                  </div>
                )}
                {hasRightContent && combinedNominees.length > 0 && (
                  <div className={`${nomineeOnly ? '' : 'md:col-span-8'}`}>
                    <div className="flex items-center gap-2 mb-3 font-display">
                      <UserGroupIcon className="w-4 h-4 text-gray-500" />
                      <h4 className="text-sm font-semibold text-gray-700">
                        {category.name === 'Nominees' ? 'Nominees' : 'Other Nominees'}
                      </h4>
                      <span className="text-xs text-gray-400">
                        ({combinedNominees.length})
                      </span>
                    </div>
                    {(!nomineeOnly) ? (
                      <ul className="space-y-2 text-sm leading-tight">
                        {combinedNominees.map(game => (
                          <li key={`${game.bgg_id}-nominee-name`} className="flex items-center gap-3">
                            {game.thumbnail_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img 
                                src={game.thumbnail_url} 
                                alt={game.name}
                                className="w-8 h-8 object-cover rounded border border-gray-200 flex-shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 bg-gray-100 border border-gray-200 rounded flex items-center justify-center flex-shrink-0">
                                <span className="text-gray-400 text-xs">?</span>
                              </div>
                            )}
                            <span className="text-gray-700 hover:text-gray-900 transition-colors truncate" title={game.name}>{game.name}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {combinedNominees.map((game) => (
                          <GameCard
                            key={`${game.bgg_id}-nominee-unified`}
                            game={toGameWithRanking(game)}
                            viewMode="grid"
                            className="bg-white/70"
                            hideWinnerBadge
                            variant="compact"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default async function AwardPage({ params }: { params: Promise<{ award: string }> }) {
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
  'sxsw': 'SXSW',
  'board-game-quest': 'Board Game Quest Awards',
  'juego-del-ano': 'Juego del Año',
  'parents-choice': 'Parents Choice',
  'guldbrikken': 'Guldbrikken',
  }

  const awardType = awardTypeMap[award]

  // Use unified data fetching for all awards
  const awardData = await getAwardData(awardType)

  const IconComponent = awardConfig.icon

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
          <Heading as="h1" size="display" gradient weightScale align="center" displayFont className="mb-4">
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
              {awardData.reduce(
                (sum, y) =>
                  sum + (y.primary ? 1 : 0) + y.categoryWinners.length,
                0
              )}{' '}
              Winners
            </div>
            <div className="flex items-center gap-2">
              <UserGroupIcon className="w-4 h-4" />
              {awardData.reduce(
                (sum, year) => sum + year.nominees.length + year.special.length,
                0
              )}{' '}
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
