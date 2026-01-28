import React from 'react'
import Heading from '@/components/Components/Heading'
import {
  ClipboardDocumentCheckIcon,
  StarIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline'

export interface HeroStep {
  icon?: React.ReactNode
  heading: string
  text: string
}

export interface HeroServerProps {
  variant?: 'default' | 'awards'
  title?: string
  subtitle?: string
  steps?: HeroStep[]
  className?: string
}

const awardsDefaults: Required<
  Pick<HeroServerProps, 'title' | 'subtitle' | 'steps'>
> = {
  title: 'Create your own Game Awards',
  subtitle:
    'Auto‑generate personal awards from the games you play and rate—then fine‑tune the winners.',
  steps: [
    {
      icon: <ClipboardDocumentCheckIcon className="w-5 h-5 text-blue-600" />,
      heading: 'Track played games',
      text: 'Add games to your collection and mark them as Played. The more you log, the richer your awards become.',
    },
    {
      icon: <StarIcon className="w-5 h-5 text-amber-500" />,
      heading: 'Rate & rank them',
      text: 'Give each played title a 1–10 rating. Rankings power category insights and help surface standout contenders.',
    },
    {
      icon: <TrophyIcon className="w-5 h-5 text-yellow-600" />,
      heading: 'Generate & refine awards',
      text: 'We auto‑build personal award categories (Strategy, Family, Party, etc.). Adjust winners manually any time.',
    },
  ],
}

/**
 * Server component version of Hero - no client-side interactivity
 * Improves initial page load performance by rendering on the server
 */
export function HeroServer({
  variant = 'default',
  title,
  subtitle,
  steps,
  className = '',
}: HeroServerProps) {
  if (variant === 'awards') {
    title = title ?? awardsDefaults.title
    subtitle = subtitle ?? awardsDefaults.subtitle
    steps = steps ?? awardsDefaults.steps
  }

  return (
    <div
      className={`panel mb-8 sm:mb-14 md:mb-20 flex flex-col md:flex-row md:items-start gap-6 sm:gap-10 md:gap-20 ${className}`}
    >
      <div className="flex-1">
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-3 sm:mb-6 text-gray-900 leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm sm:text-lg md:text-xl text-gray-600 max-w-xl leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      {steps && steps.length > 0 && (
        <ol className="flex-1 space-y-5 sm:space-y-10 md:space-y-12 relative">
          {steps.map((step, idx) => (
            <li key={idx} className="flex items-start gap-3 sm:gap-5">
              <div className="flex-shrink-0 text-xs sm:text-sm font-semibold w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mt-0.5 sm:mt-1">
                {idx + 1}
              </div>
              <div className="flex-1 border-b border-gray-200 pb-5 sm:pb-8 last:border-b-0 last:pb-0">
                <h3 className="font-semibold text-gray-900 text-sm sm:text-lg mb-1">
                  {step.heading}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 leading-relaxed max-w-md">
                  {step.text}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

export default HeroServer
