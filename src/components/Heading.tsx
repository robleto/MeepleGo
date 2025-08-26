import React from 'react'
import clsx from 'clsx'

interface HeadingProps {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  children: React.ReactNode
  className?: string
  gradient?: boolean
  weightScale?: boolean // increase weight at larger breakpoints
  size?: 'display' | 'xl' | 'lg' | 'md' | 'sm' | 'xs'
  subtle?: boolean // softer color
  uppercase?: boolean
  align?: 'left' | 'center' | 'right'
  poster?: boolean // use poster / Archivo Black experimental font
  soft?: boolean // use softer display (Epilogue) for reduced weight look
  relaxed?: boolean // add extra letter-spacing & margin breathing room
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
  gradient = false,
  weightScale = true,
  size = 'lg',
  subtle = false,
  uppercase = false,
  align = 'left',
  poster = false,
  soft = false,
  relaxed = false,
}: HeadingProps) {
  const Comp = as as any
  let base = 'font-display tracking-minus-half'
  if (poster) base = 'font-poster tracking-tight'
  else if (soft) base = 'font-[var(--font-display-soft)] tracking-tight'
  // Adjusted to cap at 600 (no extrabold) per design directive
  const weight = soft
    ? (weightScale ? 'font-medium md:font-semibold lg:font-semibold' : 'font-medium')
    : weightScale
      ? 'font-semibold md:font-semibold lg:font-semibold'
      : 'font-semibold'
  const color = gradient
    ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 dark:from-amber-300 dark:via-amber-400 dark:to-yellow-200 bg-clip-text text-transparent'
    : subtle
      ? 'text-gray-600 dark:text-gray-300'
      : 'text-gray-900 dark:text-gray-50'
  const alignment = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : ''
  const transform = uppercase ? 'uppercase tracking-wide' : ''

  // Optical line-height: larger sizes tighter, smaller sizes more relaxed
  const optical = size === 'display' || size === 'xl'
    ? 'heading-tight'
    : size === 'lg'
      ? 'heading-normal'
      : 'heading-relaxed'

  return (
    <Comp
      className={clsx(
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