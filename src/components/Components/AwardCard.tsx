'use client'
import Link from 'next/link'
import { ReactNode } from 'react'
import { TrophyIcon, CalendarIcon } from '@heroicons/react/24/outline'
import { IconCircle } from '../Elements/IconCircle'

export interface AwardCardProps {
  href?: string
  title: string
  description?: string
  yearSpan?: string
  categories?: number
  winners?: number
  nominees?: number
  icon?: ReactNode // optional custom icon node
  circleBorderClass?: string
  circleBgClass?: string
  iconColorClass?: string
  className?: string
  showStats?: boolean
  // Optional CTA text override
  cta?: string
}

export function AwardCard({
  href,
  title,
  description,
  yearSpan,
  categories = 0,
  winners = 0,
  nominees = 0,
  icon,
  circleBorderClass = 'border-gray-200',
  circleBgClass = 'bg-gray-50',
  iconColorClass = 'text-gray-500',
  className = '',
  showStats = false,
  cta = 'View →',
}: AwardCardProps) {
  const Wrapper: any = href ? Link : 'div'

  return (
    <Wrapper
      href={href as any}
      className={`group relative flex flex-col items-center text-center rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-amber-200 dark:hover:border-amber-700 bg-white dark:bg-gray-900 p-8 shadow-sm hover:shadow-lg transition-all duration-200 min-h-[320px] ${className}`}
    >
      {icon ? (
        <div
          className={`mb-5 flex h-16 w-16 items-center justify-center rounded-full border ${circleBorderClass} ${circleBgClass}`}
        >
          <div className={iconColorClass}>{icon}</div>
        </div>
      ) : (
        <div className="mb-5">
          <IconCircle size="lg" tone="amber" className="!h-16 !w-16">
            <TrophyIcon className={`w-8 h-8 ${iconColorClass}`} />
          </IconCircle>
        </div>
      )}
      <h3 className="heading-display text-xl font-semibold text-gray-900 dark:text-gray-100 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors mb-2 tracking-wide">
        {title}
      </h3>
      {yearSpan && (
        <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mb-3 flex items-center justify-center gap-1">
          <CalendarIcon className="w-3.5 h-3.5" /> {yearSpan}
        </p>
      )}
      {description && (
        <p className="text-left text-sm leading-tight text-gray-400 dark:text-gray-500 mb-6 line-clamp-4 flex-grow">
          {description}
        </p>
      )}
      {showStats && (
        <>
          <div className="w-full h-px bg-gray-100 dark:bg-gray-800 mb-4" />
          <div className="grid w-full grid-cols-3 gap-2">
            <div className="flex flex-col items-center">
              <span className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {categories}
              </span>
              <span className="mt-0.5 text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Categories
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {winners}
              </span>
              <span className="mt-0.5 text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Winners
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {nominees}
              </span>
              <span className="mt-0.5 text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Nominees
              </span>
            </div>
          </div>
        </>
      )}
      {href && (
        <span
          className={`absolute bottom-3 right-4 text-xs font-medium ${iconColorClass} opacity-0 group-hover:opacity-100 transition-opacity`}
        >
          {cta}
        </span>
      )}
    </Wrapper>
  )
}

export default AwardCard
