import React from 'react'
import clsx from 'clsx'

interface HeadingProps {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  children: React.ReactNode
  className?: string
  /** Pre-baked visual recipe. When provided, most other stylistic props are ignored (keeps things predictable). */
  variant?: 'section'
  gradient?: boolean
  weightScale?: boolean // increase weight at larger breakpoints
  size?: 'display' | 'xl' | 'lg' | 'md' | 'sm' | 'xs'
  subtle?: boolean // softer color
  uppercase?: boolean
  align?: 'left' | 'center' | 'right'
  poster?: boolean // use poster / Archivo Black experimental font
  soft?: boolean // use softer display (Epilogue) for reduced weight look
  relaxed?: boolean // add extra letter-spacing & margin breathing room
  displayFont?: boolean // opt-in Rift Soft / display font
}

// Tailwind size presets (semantic rather than raw h1-h6 mapping)
const sizeClasses: Record<NonNullable<HeadingProps['size']>, string> = {
  display: 'text-4xl md:text-5xl',
  xl: 'text-3xl md:text-4xl',
  lg: 'text-2xl md:text-3xl',
  md: 'text-xl md:text-2xl',
  sm: 'text-lg',
  xs: 'text-base',
}

export function Heading({
  as = 'h2',
  children,
  className,
  variant,
  gradient = false,
  weightScale = true,
  size = 'md',
  subtle = false,
  uppercase = false,
  align = 'left',
  poster = false,
  soft = false,
  relaxed = false,
  displayFont = true,
}: HeadingProps) {
  const Comp = as as any

  // Variant map: intentionally minimal & opinionated.
  if (variant) {
    const variantClasses: Record<
      NonNullable<HeadingProps['variant']>,
      string
    > = {
      section:
        'heading-display text-2xl font-medium tracking-wide text-gray-900 dark:text-gray-300',
    }
    return (
      <Comp className={clsx(variantClasses[variant], className)}>
        {children}
      </Comp>
    )
  }

  const base = poster
    ? 'font-poster tracking-tight'
    : soft
      ? 'tracking-tight'
      : 'tracking-minus-half'
  // Always use font-medium for all breakpoints if not soft, matching the example
  const weight = soft
    ? weightScale
      ? 'font-medium md:font-semibold lg:font-semibold'
      : 'font-medium'
    : 'font-medium md:font-medium lg:font-medium'
  const color = gradient
    ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 bg-clip-text text-transparent'
    : subtle
      ? 'text-gray-600 dark:text-gray-400'
      : 'text-gray-900 dark:text-gray-100'
  const alignment =
    align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : ''
  const transform = uppercase ? 'uppercase tracking-wide' : ''

  // Always use heading-relaxed for md size and below, matching the example
  const optical = 'heading-relaxed'

  const fontFamily = displayFont ? 'heading-display' : ''

  return (
    <Comp
      className={clsx(
        fontFamily || 'font-body',
        base,
        sizeClasses[size],
        weight,
        color,
        alignment,
        transform,
        optical,
        className,
        relaxed && 'tracking-normal md:tracking-tight mb-2 md:mb-4'
      )}
    >
      {children}
    </Comp>
  )
}

export default Heading
