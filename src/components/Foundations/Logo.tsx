import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/utils/helpers'

interface LogoProps {
  /** Size variant of the logo */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Whether to show the text "MeepleGo" alongside the logo */
  showText?: boolean
  /** Optional href to make the logo a link */
  href?: string
  /** Additional CSS classes */
  className?: string
}

const sizeStyles: Record<
  'sm' | 'md' | 'lg' | 'xl',
  { container: string; logo: string; text: string; dimensions: number }
> = {
  sm: {
    container: 'gap-1.5',
    logo: 'h-6 w-6',
    text: 'text-lg',
    dimensions: 24,
  },
  md: {
    container: 'gap-2',
    logo: 'h-8 w-8',
    text: 'text-xl',
    dimensions: 32,
  },
  lg: {
    container: 'gap-1.5',
    logo: 'h-8 w-8',
    text: 'text-xl',
    dimensions: 32,
  },
  xl: {
    container: 'gap-3',
    logo: 'h-10 w-10',
    text: 'text-2xl',
    dimensions: 40,
  },
}

export function Logo({
  size = 'md',
  showText = true,
  href,
  className,
}: LogoProps) {
  const styles = sizeStyles[size] ?? sizeStyles.md

  const content = (
    <div className={cn('flex items-center', styles.container, className)}>
      {/* MeepleGo Logo Image */}
      <Image
        src="/meeplego.svg"
        alt="MeepleGo"
        className={cn('object-contain', styles.logo)}
        width={styles.dimensions}
        height={styles.dimensions}
        priority={size === 'lg'}
      />

      {/* Text */}
      {showText && (
        <span
          className={cn(
            'heading-display uppercase font-bold tracking-normal leading-none',
            styles.text
          )}
        >
          <span className="text-gray-900">Meeple</span>
          <span className="ml-0.5 text-[#096EC2]">Go</span>
        </span>
      )}
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="group" aria-label="Home">
        {content}
      </Link>
    )
  }

  return content
}

// Default export for easier importing
export default Logo
