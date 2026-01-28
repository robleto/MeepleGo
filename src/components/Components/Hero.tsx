import type { ReactNode } from 'react'
import clsx from 'clsx'
import Link from 'next/link'
import {
  ClipboardDocumentCheckIcon,
  StarIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline'
import Heading from '@/components/Components/Heading'

export interface HeroStep {
  icon?: ReactNode
  heading: string
  text: string
}

export interface HeroCta {
  label: string
  href: string
  isExternal?: boolean
}

export interface HeroProps {
  variant?: 'default' | 'awards'
  title?: string
  subtitle?: string
  steps?: HeroStep[]
  cta?: HeroCta
  className?: string
}

const awardsDefaults: Required<
  Pick<HeroProps, 'title' | 'subtitle' | 'steps'>
> = {
  title: 'Create your own Game Awards',
  subtitle:
    'Auto‑generate personal awards from the games you play and rate—then fine‑tune the winners.',
  steps: [
    {
      icon: <ClipboardDocumentCheckIcon className="h-5 w-5 text-blue-600" />,
      heading: 'Track played games',
      text: 'Add games to your collection and mark them as Played. The more you log, the richer your awards become.',
    },
    {
      icon: <StarIcon className="h-5 w-5 text-amber-500" />,
      heading: 'Rate & rank them',
      text: 'Give each played title a 1–10 rating. Rankings power category insights and help surface standout contenders.',
    },
    {
      icon: <TrophyIcon className="h-5 w-5 text-yellow-600" />,
      heading: 'Generate & refine awards',
      text: 'We auto‑build personal award categories (Strategy, Family, Party, etc.). Adjust winners manually any time.',
    },
  ],
}

export default function Hero({
  variant = 'default',
  title,
  subtitle,
  steps,
  cta,
  className,
}: HeroProps) {
  const heroTitle =
    variant === 'awards' ? title ?? awardsDefaults.title : title ?? ''
  const heroSubtitle =
    variant === 'awards'
      ? subtitle ?? awardsDefaults.subtitle
      : subtitle ?? ''
  const heroSteps =
    variant === 'awards' ? steps ?? awardsDefaults.steps : steps ?? []

  const renderCta = () => {
    if (!cta) return null
    const baseClasses =
      'mt-8 inline-flex h-11 items-center gap-2 rounded-full bg-brand px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring focus-visible:ring-offset-2 focus-visible:ring-offset-white'

    if (cta.isExternal) {
      return (
        <a
          href={cta.href}
          className={baseClasses}
          target="_blank"
          rel="noreferrer"
        >
          {cta.label}
        </a>
      )
    }

    return (
      <Link href={cta.href} className={baseClasses} prefetch={false}>
        {cta.label}
      </Link>
    )
  }

  return (
    <section
      className={clsx(
        'relative mb-14 flex flex-col gap-10 rounded-2xl border border-slate-200/80 bg-white/95 p-8 shadow-sm backdrop-blur-sm transition-colors md:mb-20 md:flex-row md:items-start md:gap-20 md:p-12',
        className
      )}
    >
      <div className="flex-1">
        {heroTitle && (
          <Heading
            as="h1"
            size="display"
            align="left"
            displayFont
            className="mb-6"
          >
            {heroTitle}
          </Heading>
        )}
        {heroSubtitle && (
          <p className="max-w-xl text-lg leading-snug text-gray-600 md:text-xl">
            {heroSubtitle}
          </p>
        )}
        {renderCta()}
      </div>
      {heroSteps.length > 0 && (
        <ol
          className="flex-1 space-y-8 md:space-y-10"
          aria-label="How MeepleGo works"
        >
          {heroSteps.map((step, idx) => (
            <li key={step.heading} className="flex items-start gap-5">
              <div className="mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                {idx + 1}
              </div>
              <div className="flex-1 border-b border-slate-200 pb-6 last:border-b-0 last:pb-0">
                <div className="mb-2 flex items-center gap-2">
                  {step.icon}
                  <h3 className="text-lg font-semibold text-gray-900">
                    {step.heading}
                  </h3>
                </div>
                <p className="max-w-md text-sm leading-snug text-gray-500">
                  {step.text}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
