import React, { useState } from 'react'
import Image from 'next/image'

interface GameImageProps {
  src?: string | null
  alt: string
  name: string
  variant?: 'square' | 'thumb'
  className?: string
  onError?: () => void
  onLoad?: () => void
  priority?: boolean
  loading?: 'lazy' | 'eager'
  sizes?: string
}

export function GameImage({
  src,
  alt,
  name,
  variant = 'square',
  className = '',
  onError,
  onLoad,
  priority = false,
  loading = 'lazy',
  sizes,
}: GameImageProps) {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>(
    'loading'
  )
  const [showFallback, setShowFallback] = useState(!src)

  const handleImageLoad = () => {
    setImageState('loaded')
    onLoad?.()
  }

  const handleImageError = () => {
    setImageState('error')
    setShowFallback(true)
    onError?.()
  }

  // Generate fallback content
  const initials =
    (name || 'Board Game')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join('') || 'BG'
  const fontSize = initials.length === 1 ? 42 : 34

  // Render fallback when no image or error
  if (!src || showFallback || imageState === 'error') {
    return (
      <div
        className={`relative flex items-center justify-center bg-gradient-to-br from-gray-200 via-gray-100 to-gray-300 text-gray-700 select-none rounded ${
          variant === 'thumb' ? 'w-20 h-20' : 'w-full h-full'
        } ${className}`}
        aria-label={`${name} (no image available)`}
        role="img"
      >
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 w-full h-full opacity-60"
          aria-hidden="true"
        >
          {/* Isometric cube */}
          <polygon points="50,5 95,28 50,50 5,28" fill="#d1d5db" />
          <polygon points="50,50 95,28 95,72 50,95" fill="#c4c9cf" />
          <polygon points="50,50 5,28 5,72 50,95" fill="#e2e5e8" />
          {/* Inner cut */}
          <polygon points="50,20 78,34 50,48 22,34" fill="#e5e7eb" />
        </svg>
        <span
          className="relative z-10 font-bold tracking-wide text-gray-700 drop-shadow"
          style={{ fontSize }}
        >
          {initials}
        </span>
        {/* Optional small name footer for larger square variant */}
        {variant === 'square' && (
          <div className="absolute bottom-0 left-0 right-0 text-[11px] font-medium px-1 py-0.5 bg-white/70 backdrop-blur line-clamp-1 text-center">
            {name || 'Board Game'}
          </div>
        )}
      </div>
    )
  }

  // Render actual image with loading state
  return (
    <div className={`relative w-full h-full ${className}`}>
      {imageState === 'loading' && (
        <div className="absolute inset-0 bg-gray-200 rounded animate-pulse" />
      )}
      <Image
        src={src}
        alt={alt}
        className={`w-full h-full object-cover rounded ${
          imageState === 'loading' ? 'opacity-0' : 'opacity-100'
        } transition-opacity duration-200`}
        width={400}
        height={400}
        priority={priority}
        loading={priority ? undefined : loading}
        sizes={
          sizes ||
          (variant === 'thumb'
            ? '(max-width: 640px) 25vw, (max-width: 1024px) 12vw, 80px'
            : '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 256px')
        }
        decoding="async"
        onLoadingComplete={handleImageLoad}
        onError={handleImageError as any}
      />
    </div>
  )
}

export default GameImage
