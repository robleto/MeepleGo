export const dynamic = 'force-dynamic'
export const revalidate = 0
import PageLayout from '@/components/Components/PageLayout'
import Heading from '@/components/Components/Heading'
import { TrophyIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import awardsData from '@/data/awards.json'
import { getSupabaseServerClient } from '@/lib/supabaseServer'
// Removed IndustryAwards component in favor of direct AwardCard composition (subset of AwardCard story patterns)
import AwardCard from '@/components/Components/AwardCard'

// Award categories loaded from JSON (icon string mapped to actual component below)
const AWARD_CATEGORIES = (awardsData as any).categories.map((c: any) => ({
  ...c,
  icon: TrophyIcon, // currently only TrophyIcon, future: dynamic mapping
})) as Array<{
  id: string
  name: string
  description: string
  icon: typeof TrophyIcon
  color: string
  backgroundColor: string
  borderColor: string
  iconColor: string
  website: string
}>

// Debug helper: build per-year breakdown for an award type
async function getAwardYearBreakdown(awardType: string) {
  const supabase = await getSupabaseServerClient()

  try {
    let searchPattern = awardType

    if (awardType === 'Golden Geek Awards') {
      searchPattern = '%Golden Geek%'
    } else if (awardType === 'Charles S. Roberts') {
      searchPattern = '%Charles S. Roberts%'
    } else if (awardType === 'Spiel des Jahres') {
      searchPattern = '%Spiel des Jahres%'
    } else if (awardType === 'Kinderspiel des Jahres') {
      searchPattern = '%Kinderspiel des Jahres%'
    } else if (awardType === 'Kennerspiel des Jahres') {
      searchPattern = '%Kennerspiel des Jahres%'
    } else if (awardType === 'Deutscher Spiele Preis') {
      searchPattern = '%Deutscher Spiele Preis%'
    } else if (awardType === 'Origins Awards') {
      searchPattern = '%Origins%'
    } else if (awardType === 'The Dice Tower Gaming Awards') {
      searchPattern = '%Dice Tower%'
    } else if (awardType === "As d'Or - Jeu de l'Année") {
      searchPattern = "%As d'Or%"
    } else {
      const mainName = awardType.split(' ')[0]
      searchPattern = `%${mainName}%`
    }

    const { data: awards, error } = await supabase
      .from('industry_awards')
      .select(
        `
        id,
        year,
        award_set,
        category,
        status,
        boardgames
      `
      )
      .ilike('award_set', searchPattern)
      .order('year', { ascending: false })

    if (error) {
      console.error('Error fetching award year breakdown:', error)
      return []
    }

    if (!awards || awards.length === 0) {
      return []
    }

    const yearMap = new Map<
      number,
      { winners: string[]; nominees: string[]; special: string[] }
    >()

    awards.forEach((award: any) => {
      const boardgames = award.boardgames || []

      boardgames.forEach((boardgame: any) => {
        if (!yearMap.has(award.year)) {
          yearMap.set(award.year, { winners: [], nominees: [], special: [] })
        }

        const bucket = yearMap.get(award.year)!

        if (award.status === 'Winner') {
          if (!bucket.winners.includes(boardgame.name))
            bucket.winners.push(boardgame.name)
        } else if (award.status === 'Nominee') {
          if (!bucket.nominees.includes(boardgame.name))
            bucket.nominees.push(boardgame.name)
        } else {
          if (!bucket.special.includes(boardgame.name))
            bucket.special.push(boardgame.name)
        }
      })
    })

    return Array.from(yearMap.entries())
      .map(([year, v]) => ({ year, ...v }))
      .sort((a, b) => b.year - a.year)
  } catch (e: any) {
    console.error('Unhandled exception in getAwardYearBreakdown', {
      awardType,
      error: e?.message,
      stack: e?.stack,
    })
    return []
  }
}

interface AwardStats {
  categories: number
  winners: number
  nominees: number
  yearSpan: string
}

async function getAwardStats(awardType: string): Promise<AwardStats> {
  try {
    const supabase = await getSupabaseServerClient()

    let searchPattern = awardType

    if (awardType === 'Golden Geek Awards') {
      searchPattern = '%Golden Geek%'
    } else if (awardType === 'Charles S. Roberts') {
      searchPattern = '%Charles S. Roberts%'
    } else if (awardType === 'Spiel des Jahres') {
      searchPattern = '%Spiel des Jahres%'
    } else if (awardType === 'Kinderspiel des Jahres') {
      searchPattern = '%Kinderspiel des Jahres%'
    } else if (awardType === 'Kennerspiel des Jahres') {
      searchPattern = '%Kennerspiel des Jahres%'
    } else if (awardType === 'Deutscher Spiele Preis') {
      searchPattern = '%Deutscher Spiele Preis%'
    } else if (awardType === 'Origins Awards') {
      searchPattern = '%Origins%'
    } else if (awardType === 'The Dice Tower Gaming Awards') {
      searchPattern = '%Dice Tower%'
    } else if (awardType === "As d'Or - Jeu de l'Année") {
      searchPattern = "%As d'Or%"
    } else {
      const mainName = awardType.split(' ')[0]
      searchPattern = `%${mainName}%`
    }

    const { data: awards, error } = await supabase
      .from('industry_awards')
      .select('year, status, category')
      .ilike('award_set', searchPattern)

    if (error) {
      console.error('Error fetching award stats:', error)
      return { categories: 0, winners: 0, nominees: 0, yearSpan: '' }
    }

    if (!awards || awards.length === 0) {
      return { categories: 0, winners: 0, nominees: 0, yearSpan: '' }
    }

    const years = new Set<number>()
    let winners = 0
    let nominees = 0
    const perYear = new Map<number, { cats: Set<string>; winners: number }>()

    awards.forEach((award: { year: number; status: string; category?: string | null }) => {
      years.add(award.year)
      if (!perYear.has(award.year)) {
        perYear.set(award.year, { cats: new Set<string>(), winners: 0 })
      }
      const entry = perYear.get(award.year)!
      const cat = (award.category || '').toString().trim()
      if (cat && !/^(overall|game of the year)$/i.test(cat)) {
        entry.cats.add(cat)
      }
      if (award.status === 'Winner') {
        winners += 1
        entry.winners += 1
      } else if (/^(Nominee|Recommended|Special)$/i.test(award.status || '')) {
        nominees += 1
      }
    })

    const yearArray = Array.from(years).sort((a, b) => a - b)
    const yearSpan = yearArray.length
      ? `${yearArray[0]} - ${yearArray[yearArray.length - 1]}`
      : ''

    let categoriesSum = 0
    years.forEach((y) => {
      const entry = perYear.get(y)!
      let count = entry.cats.size
      if (count === 0 && entry.winners > 0) count = entry.winners
      categoriesSum += count
    })
    const categoriesAvg =
      years.size > 0 ? Math.round(categoriesSum / years.size) : 0

    return { categories: categoriesAvg, winners, nominees, yearSpan }
  } catch (error) {
    console.error('Unhandled exception in getAwardStats', {
      awardType,
      error,
    })
    return { categories: 0, winners: 0, nominees: 0, yearSpan: '' }
  }
}

export default async function AwardsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  // Map award IDs to database award_type values
  const awardTypeMap: Record<string, string> = (awardsData as any).awardTypeMap

  // Get stats for each award category
  const statsPromises = AWARD_CATEGORIES.map((category) =>
    getAwardStats(awardTypeMap[category.id])
  )
  const allStats = await Promise.all(statsPromises)

  const debugEnabled = params?.debug === '1' || params?.debug === 'true'
  let debugData: Array<{
    id: string
    name: string
    awardType: string
    years: Array<{
      year: number
      winners: string[]
      nominees: string[]
      special: string[]
    }>
  }> = []
  if (debugEnabled) {
    // Fetch detailed year breakdowns in parallel
    const yearBreakdowns = await Promise.all(
      AWARD_CATEGORIES.map((c) => getAwardYearBreakdown(awardTypeMap[c.id]))
    )
    debugData = AWARD_CATEGORIES.map((c, idx) => ({
      id: c.id,
      name: c.name,
      awardType: awardTypeMap[c.id],
      years: yearBreakdowns[idx],
    }))
  }

  return (
    <PageLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Industry Awards */}
        <section>
          <div className="flex items-end justify-between mb-5">
            <Heading as="h2" variant="section" className="mb-1">
              Industry Awards
            </Heading>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {AWARD_CATEGORIES.map((category, idx) => {
              const stat = allStats[idx]
              if (!stat) return null
              const zero =
                (stat.categories || 0) === 0 &&
                (stat.winners || 0) === 0 &&
                (stat.nominees || 0) === 0
              if (zero) {
                console.log('[Awards Landing] Hiding zero-data award', {
                  id: category.id,
                  name: category.name,
                  awardType: (awardsData as any).awardTypeMap?.[category.id],
                })
                return null
              }
              return (
                <AwardCard
                  key={category.id}
                  href={`/awards/${category.id}`}
                  title={category.name}
                  description={category.description}
                  yearSpan={stat.yearSpan}
                  categories={stat.categories}
                  winners={stat.winners}
                  nominees={stat.nominees}
                  circleBorderClass={category.borderColor}
                  circleBgClass={category.backgroundColor}
                  iconColorClass={category.iconColor}
                  showStats
                />
              )
            })}
          </div>
        </section>

        {debugEnabled && (
          <div className="mt-16">
            <Heading as="h2" size="lg" className="mb-4 flex items-center gap-2">
              <ChevronDownIcon className="w-6 h-6 text-gray-500" /> Debug: Raw
              Award Data
            </Heading>
            <p className="text-sm text-gray-500 mb-6">
              Showing per-year breakdown sourced directly from games.honors.
              Duplicate game appearances in multiple categories are shown unless
              de-duplicated in import logic.
            </p>
            <div className="space-y-10 text-left">
              {debugData.map((block) => (
                <div
                  key={block.id}
                  className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm"
                >
                  <Heading as="h3" size="sm" subtle className="mb-2">
                    {block.name}{' '}
                    <span className="text-xs text-gray-400">
                      ({block.awardType})
                    </span>
                  </Heading>
                  {block.years.length === 0 && (
                    <p className="text-sm text-red-500">No honors found.</p>
                  )}
                  <div className="max-h-96 overflow-auto pr-2 space-y-4 text-sm">
                    {block.years.map((y) => (
                      <div
                        key={y.year}
                        className="border-b last:border-b-0 pb-3"
                      >
                        <div className="font-medium text-gray-700 mb-1">
                          {y.year}
                        </div>
                        <div className="grid gap-2 md:grid-cols-3">
                          <div>
                            <div className="text-yellow-700 font-semibold">
                              Winners ({y.winners.length})
                            </div>
                            <ul className="list-disc ml-4 text-gray-600 space-y-0.5">
                              {y.winners.slice(0, 8).map((n) => (
                                <li key={n}>{n}</li>
                              ))}
                              {y.winners.length > 8 && (
                                <li className="italic text-gray-400">
                                  +{y.winners.length - 8} more
                                </li>
                              )}
                            </ul>
                          </div>
                          <div>
                            <div className="text-gray-700 font-semibold">
                              Nominees ({y.nominees.length})
                            </div>
                            <ul className="list-disc ml-4 text-gray-600 space-y-0.5">
                              {y.nominees.slice(0, 8).map((n) => (
                                <li key={n}>{n}</li>
                              ))}
                              {y.nominees.length > 8 && (
                                <li className="italic text-gray-400">
                                  +{y.nominees.length - 8} more
                                </li>
                              )}
                            </ul>
                          </div>
                          <div>
                            <div className="text-blue-700 font-semibold">
                              Special / Recommended ({y.special.length})
                            </div>
                            <ul className="list-disc ml-4 text-gray-600 space-y-0.5">
                              {y.special.slice(0, 8).map((n) => (
                                <li key={n}>{n}</li>
                              ))}
                              {y.special.length > 8 && (
                                <li className="italic text-gray-400">
                                  +{y.special.length - 8} more
                                </li>
                              )}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 text-xs text-gray-400">
              Debug mode active via ?debug=1
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  )
}
