import PageLayout from '@/components/Components/PageLayout'
import awardsData from '@/data/awards.json'
import { TrophyIcon, ChevronLeftIcon } from '@heroicons/react/24/outline'
import { searchAwards } from '@/lib/awardsApi'
import { getAwardsForSet } from '@/lib/awardsCache'
import IndustryAwards from '@/components/Components/IndustryAwards'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface AwardStats {
  totalGames: number
  totalWinners: number
  totalNominees: number
  yearSpan: string
}

type AwardCategory = {
  id: string
  name: string
  description: string
  color: string
  backgroundColor: string
  borderColor: string
  iconColor: string
  website: string
  icon?: typeof TrophyIcon
}
const AWARD_CATEGORIES: AwardCategory[] = (awardsData as any).categories.map(
  (c: any) => ({ ...c, icon: TrophyIcon })
)

async function getAwardStats(awardType: string): Promise<AwardStats> {
  try {
    const awards = await getAwardsForSet(awardType, async () => {
      const res = await searchAwards({ search: awardType, award_set: awardType })
      return res.Response === 'True' ? res.awards || [] : []
    })

    if (!awards.length) {
      return {
        totalGames: 0,
        totalWinners: 0,
        totalNominees: 0,
        yearSpan: '',
      }
    }

    const years = awards.map((a) => a.year).filter(Boolean)
    const yearArray = years.length
      ? Array.from(new Set(years)).sort((a, b) => a - b)
      : []
    const yearSpan = yearArray.length
      ? `${yearArray[0]} - ${yearArray[yearArray.length - 1]}`
      : ''

    const totalWinners = awards.filter((a) => a.isWinner).length
    const totalNominees = awards.filter((a) => a.isNominee).length

    return {
      totalGames: awards.length,
      totalWinners,
      totalNominees,
      yearSpan,
    }
  } catch (error) {
    console.error('Error in getAwardStats:', error)
    return {
      totalGames: 0,
      totalWinners: 0,
      totalNominees: 0,
      yearSpan: '',
    }
  }
}

export default async function IndustryAwardsFullPage() {
  const awardTypeMap: Record<string, string> = (awardsData as any).awardTypeMap
  const stats = await Promise.all(
    AWARD_CATEGORIES.map((c: AwardCategory) =>
      getAwardStats(awardTypeMap[c.id])
    )
  )
  return (
    <PageLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Back to Awards */}
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/awards"
            className="text-xs inline-flex items-center gap-1"
          >
            <ChevronLeftIcon className="w-4 h-4" /> Back
          </Link>
        </div>

        {/* Industry Awards Table */}
        <IndustryAwards
          categories={AWARD_CATEGORIES.map(
            ({ icon, ...r }: AwardCategory) => r
          )}
          stats={stats}
          preview={false}
        />
      </div>
    </PageLayout>
  )
}
