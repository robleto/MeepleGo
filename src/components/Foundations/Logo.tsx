import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/utils/helpers'

interface LogoProps {
  /** Size variant of the logo */
  size?: 'sm' | 'md' | 'lg'
  /** Whether to show the text "MeepleGo" alongside the logo */
  showText?: boolean
  /** Optional href to make the logo a link */
  href?: string
  /** Additional CSS classes */
  className?: string
}

const sizeStyles = {
  sm: {
    container: 'gap-1.5',
    logo: 'h-6 w-6',
    text: 'text-lg',
  },
  md: {
    container: 'gap-2',
    logo: 'h-8 w-8',
    text: 'text-xl',
  },
  lg: {
    container: 'gap-3',
    logo: 'h-12 w-12',
    text: 'text-2xl',
  },
}

export function Logo({
  size = 'md',
  showText = true,
  href,
  className,
}: LogoProps) {
  const styles = sizeStyles[size]

  const content = (
    <div className={cn('flex items-center', styles.container, className)}>
      {/* MeepleGo Logo Image */}
      <Image
        src="/meeplego.svg"
        alt="MeepleGo"
        className={cn('object-contain', styles.logo)}
        width={parseInt(styles.logo.split(' ')[0].replace(/[^0-9]/g, '')) || 32}
        height={
          parseInt(styles.logo.split(' ')[0].replace(/[^0-9]/g, '')) || 32
        }
        priority={size === 'lg'}
      />

      {/* Text */}
      {showText && (
        <span
          className={cn(
            'heading-display font-semibold tracking-normal leading-none',
            styles.text
          )}
        >
          <span className="text-gray-900 dark:text-gray-100">Meeple</span>
          <span className="ml-0.5 text-[#096EC2] dark:text-[#2695E2]">Go</span>
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
