"use client"
import Link from 'next/link'
import { ReactNode } from 'react'
import { TrophyIcon, CalendarIcon } from '@heroicons/react/24/outline'
import { IconCircle } from '@/components/Elements/IconCircle'

export interface AwardCardProps {
  href?: string
  title: string
  description?: string
  yearSpan?: string
  winners?: number
  nominees?: number
  total?: number
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
  winners = 0,
  nominees = 0,
  total,
  icon,
  circleBorderClass = 'border-gray-200',
  circleBgClass = 'bg-gray-50',
  iconColorClass = 'text-gray-500',
  className = '',
  showStats = false,
  cta = 'View →',
}: AwardCardProps) {
  const computedTotal = total ?? (winners + nominees)
  const Wrapper: any = href ? Link : 'div'

  return (
    <Wrapper
      href={href as any}
      className={`group relative flex flex-col items-center text-center rounded-2xl border border-gray-100 hover:border-amber-200 bg-white p-8 shadow-sm hover:shadow-lg transition-all duration-200 ${className}`}
    >
      {icon ? (
        <div className={`mb-5 flex h-16 w-16 items-center justify-center rounded-full border ${circleBorderClass} ${circleBgClass}`}>
          {icon}
        </div>
      ) : (
        <div className="mb-5">
          <IconCircle size="lg" tone="amber" className="!h-16 !w-16">
            <TrophyIcon className={`w-8 h-8 ${iconColorClass}`} />
          </IconCircle>
        </div>
      )}
  <h3 className="heading-display text-xl font-semibold text-gray-900 group-hover:text-gray-700 transition-colors mb-2 tracking-wide">{title}</h3>
      {yearSpan && (
        <p className="text-xs font-medium text-gray-400 mb-3 flex items-center justify-center gap-1">
          <CalendarIcon className="w-3.5 h-3.5" /> {yearSpan}
        </p>
      )}
      {description && (
        <p className="text-left text-sm leading-tight text-gray-400 mb-6 line-clamp-4">{description}</p>
      )}
      {showStats && (
        <>
          <div className="w-full h-px bg-gray-100 mb-4" />
          <div className="grid w-full grid-cols-3 gap-2">
            <div className="flex flex-col items-center">
              <span className="text-lg font-medium text-gray-900">{winners}</span>
              <span className="mt-0.5 text-[11px] uppercase tracking-wide text-gray-500">Winners</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-lg font-medium text-gray-900">{nominees}</span>
              <span className="mt-0.5 text-[11px] uppercase tracking-wide text-gray-500">Nominees</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-lg font-medium text-gray-900">{computedTotal}</span>
              <span className="mt-0.5 text-[11px] uppercase tracking-wide text-gray-500">Total</span>
            </div>
          </div>
        </>
      )}
      {href && (
        <span className={`absolute bottom-3 right-4 text-xs font-medium ${iconColorClass} opacity-0 group-hover:opacity-100 transition-opacity`}>{cta}</span>
      )}
    </Wrapper>
  )
}

export default AwardCard