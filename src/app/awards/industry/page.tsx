import PageLayout from '@/components/Components/PageLayout'
import awardsData from '@/data/awards.json'
import { TrophyIcon, ChevronLeftIcon } from '@heroicons/react/24/outline'
import { getSupabaseServerClient } from '@/lib/supabaseServer'
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
    const supabase = await getSupabaseServerClient()
    
    // Create a pattern to match the award_set values
    let searchPattern = awardType
    
    // Handle special cases for pattern matching
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
      // For other awards, try to match the first part of the name
      const mainName = awardType.split(' ')[0]
      searchPattern = `%${mainName}%`
    }
    
    // Get award statistics from industry_awards table using pattern matching
    const { data: awards, error } = await supabase
      .from('industry_awards')
      .select('year, status')
      .ilike('award_set', searchPattern)

    if (error) {
      console.error('Error fetching award stats:', error)
      return {
        totalGames: 0,
        totalWinners: 0,
        totalNominees: 0,
        yearSpan: '',
      }
    }

    if (!awards || awards.length === 0) {
      return {
        totalGames: 0,
        totalWinners: 0,
        totalNominees: 0,
        yearSpan: '',
      }
    }

    const years = new Set<number>()
    let winners = 0
    let nominees = 0

    awards.forEach((award: { year: number; status: string }) => {
      years.add(award.year)
      if (award.status === 'Winner') {
        winners++
      } else if (award.status === 'Nominee' || award.status === 'Recommended' || award.status === 'Special') {
        nominees++
      }
    })

    const yearArray = Array.from(years).sort((a, b) => a - b)
    const yearSpan = yearArray.length
      ? `${yearArray[0]} - ${yearArray[yearArray.length - 1]}`
      : ''

    return {
      totalGames: winners + nominees,
      totalWinners: winners,
      totalNominees: nominees,
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
