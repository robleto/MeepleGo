export const dynamic = 'force-dynamic'
export const revalidate = 0
import { Suspense } from 'react'
import PageLayout from '@/components/Components/PageLayout'
import Heading from '@/components/Components/Heading'
import ZeroState from '@/components/Components/ZeroState'
import { TrophyIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import awardsData from '@/data/awards.json'
// Removed IndustryAwards component in favor of direct AwardCard composition (subset of AwardCard story patterns)
import AwardCard from '@/components/Components/AwardCard'
import AwardsSearchBar from './AwardsSearchBar'
import { searchAwards, type AwardsApiAward } from '@/lib/awardsApi'
import { getAwardsForSet } from '@/lib/awardsCache'

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

function resolveAwardStatus(award: AwardsApiAward) {
  if (award.isWinner) return 'Winner'
  if (award.isNominee) return 'Nominee'
  const position = (award.position || '').toLowerCase()
  if (position.includes('winner')) return 'Winner'
  if (position.includes('nominee')) return 'Nominee'
  if (position.includes('recommended') || position.includes('special'))
    return 'Special'
  return 'Other'
}

// Debug helper: build per-year breakdown for an award type
async function getAwardYearBreakdown(awardType: string) {
  try {
    const awards = await getAwardsForSet(awardType, async () => {
      const res = await searchAwards({ search: awardType, award_set: awardType })
      return res.Response === 'True' ? res.awards || [] : []
    })
    if (awards.length === 0) {
      return []
    }

    const yearMap = new Map<
      number,
      { winners: string[]; nominees: string[]; special: string[] }
    >()

    awards.forEach((award) => {
      const year = award.year
      if (!year) return
      if (!yearMap.has(year)) {
        yearMap.set(year, { winners: [], nominees: [], special: [] })
      }
      const bucket = yearMap.get(year)!
      const status = resolveAwardStatus(award)
      const boardgames = award.boardgames || []

      boardgames.forEach((boardgame) => {
        const name = boardgame?.name?.trim()
        if (!name) return
        if (status === 'Winner') {
          if (!bucket.winners.includes(name)) bucket.winners.push(name)
        } else if (status === 'Nominee') {
          if (!bucket.nominees.includes(name)) bucket.nominees.push(name)
        } else {
          if (!bucket.special.includes(name)) bucket.special.push(name)
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
    const awards = await getAwardsForSet(awardType, async () => {
      const res = await searchAwards({ search: awardType, award_set: awardType })
      return res.Response === 'True' ? res.awards || [] : []
    })
    if (awards.length === 0) {
      return { categories: 0, winners: 0, nominees: 0, yearSpan: '' }
    }

    const years = new Set<number>()
    let winners = 0
    let nominees = 0
    const perYear = new Map<number, { cats: Set<string>; winners: number }>()

    awards.forEach((award) => {
      const year = award.year
      if (!year) return
      years.add(year)
      if (!perYear.has(year)) {
        perYear.set(year, { cats: new Set<string>(), winners: 0 })
      }
      const entry = perYear.get(year)!
      const cat = (award.title || '').toString().trim()
      if (cat && !/^(overall|game of the year)$/i.test(cat)) {
        entry.cats.add(cat)
      }
      const status = resolveAwardStatus(award)
      if (status === 'Winner') {
        winners += 1
        entry.winners += 1
      } else if (status === 'Nominee' || status === 'Special') {
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
  const query = (params?.search as string | undefined)?.toLowerCase().trim() || ''
  const visibleCategories = query
    ? AWARD_CATEGORIES.filter((category) => {
        const name = category.name.toLowerCase()
        const description = category.description.toLowerCase()
        return name.includes(query) || description.includes(query)
      })
    : AWARD_CATEGORIES
  // Map award IDs to database award_type values
  const awardTypeMap: Record<string, string> = (awardsData as any).awardTypeMap

  // Get stats for each award category
  const statsPromises = AWARD_CATEGORIES.map((category) =>
    getAwardStats(awardTypeMap[category.id])
  )
  const allStats = await Promise.all(statsPromises)

  // Debug mode is gated to admin users only
  let debugEnabled = false
  if (params?.debug === '1' || params?.debug === 'true') {
    try {
      const { getSupabaseServerClient } = await import('@/lib/supabaseServer')
      const supabase = await getSupabaseServerClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single()
        debugEnabled = !!profile?.is_admin
      }
    } catch {
      debugEnabled = false
    }
  }
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
    <PageLayout subHeader={<Suspense fallback={null}><AwardsSearchBar /></Suspense>}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Industry Awards */}
        <section>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visibleCategories.map((category) => {
              const idx = AWARD_CATEGORIES.findIndex((c) => c.id === category.id)
              const stat = allStats[idx]
              if (!stat) return null
              const zero =
                (stat.categories || 0) === 0 &&
                (stat.winners || 0) === 0 &&
                (stat.nominees || 0) === 0
              if (zero) {
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
          {visibleCategories.length === 0 && (
            <div className="mt-10">
              <ZeroState
                title="No awards found"
                description="Try a different search to find awards or award categories."
                action={{ label: 'Clear search', href: '/awards' }}
              />
            </div>
          )}
        </section>

        {debugEnabled && (
          <div className="mt-16">
            <Heading as="h2" size="lg" className="mb-4 flex items-center gap-2">
              <ChevronDownIcon className="w-6 h-6 text-gray-500" /> Debug: Raw
              Award Data
            </Heading>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Showing per-year breakdown sourced from AwardsAPI. Duplicate game
              appearances in multiple categories are shown unless de-duplicated
              in import logic.
            </p>
            <div className="space-y-10 text-left">
              {debugData.map((block) => (
                <div
                  key={block.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900 shadow-sm"
                >
                  <Heading as="h3" size="sm" subtle className="mb-2">
                    {block.name}{' '}
                    <span className="text-xs text-gray-400 dark:text-gray-500">
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
                        <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {y.year}
                        </div>
                        <div className="grid gap-2 md:grid-cols-3">
                          <div>
                            <div className="text-yellow-700 font-semibold">
                              Winners ({y.winners.length})
                            </div>
                            <ul className="list-disc ml-4 text-gray-600 dark:text-gray-400 space-y-0.5">
                              {y.winners.slice(0, 8).map((n) => (
                                <li key={n}>{n}</li>
                              ))}
                              {y.winners.length > 8 && (
                                <li className="italic text-gray-400 dark:text-gray-500">
                                  +{y.winners.length - 8} more
                                </li>
                              )}
                            </ul>
                          </div>
                          <div>
                            <div className="text-gray-700 dark:text-gray-300 font-semibold">
                              Nominees ({y.nominees.length})
                            </div>
                            <ul className="list-disc ml-4 text-gray-600 dark:text-gray-400 space-y-0.5">
                              {y.nominees.slice(0, 8).map((n) => (
                                <li key={n}>{n}</li>
                              ))}
                              {y.nominees.length > 8 && (
                                <li className="italic text-gray-400 dark:text-gray-500">
                                  +{y.nominees.length - 8} more
                                </li>
                              )}
                            </ul>
                          </div>
                          <div>
                            <div className="text-blue-700 font-semibold">
                              Special / Recommended ({y.special.length})
                            </div>
                            <ul className="list-disc ml-4 text-gray-600 dark:text-gray-400 space-y-0.5">
                              {y.special.slice(0, 8).map((n) => (
                                <li key={n}>{n}</li>
                              ))}
                              {y.special.length > 8 && (
                                <li className="italic text-gray-400 dark:text-gray-500">
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
