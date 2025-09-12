"use client"
import Link from 'next/link'
import { TrophyIcon } from '@heroicons/react/24/outline'
import AwardCard from './AwardCard'
import Heading from '@/components/Components/Heading'

interface AwardStats {
  totalGames: number
  totalWinners: number
  totalNominees: number
  yearSpan: string
}

interface Category {
  id: string
  name: string
  description: string
  color: string
  backgroundColor: string
  borderColor: string
  iconColor: string
  website: string
}

export default function IndustryAwards({
  categories,
  stats,
  preview = false,
  limit = 3,
  seeAllHref = '/awards/industry'
}: {
  categories: Category[]
  stats: AwardStats[]
  preview?: boolean
  limit?: number
  seeAllHref?: string
}) {
  const visible = preview ? categories.slice(0, limit) : categories

  return (
    <section>
      <div className="flex items-end justify-between mb-5">
  <Heading as="h2" variant="section" className="mb-1">Industry Awards</Heading>
        {preview && categories.length > limit && (
          <Link href={seeAllHref} className="text-xs font-medium rounded px-2 py-1">
            See All
          </Link>
        )}

      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visible.map((category, idx) => {
          const stat = stats[idx]
          if (!stat) return null
          return (
            <AwardCard
              key={category.id}
              href={`/awards/${category.id}`}
              title={category.name}
              description={category.description}
              yearSpan={!preview ? stat.yearSpan : undefined}
              winners={!preview ? stat.totalWinners : undefined}
              nominees={!preview ? stat.totalNominees : undefined}
              total={!preview ? stat.totalGames : undefined}
              circleBorderClass={category.borderColor}
              circleBgClass={category.backgroundColor}
              iconColorClass={category.iconColor}
              showStats={!preview}
            />
          )
        })}
      </div>
    </section>
  )
}