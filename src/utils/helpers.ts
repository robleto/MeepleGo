import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatYear(year: number | null): string {
  if (!year) return 'Unknown'
  return year.toString()
}

export function formatPlayingTime(minutes: number | null): string {
  if (!minutes) return 'Unknown'
  if (minutes < 60) return `${minutes} min`

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (remainingMinutes === 0) {
    return `${hours}h`
  }

  return `${hours}h ${remainingMinutes}m`
}

export function formatPlayerCount(
  min: number | null,
  max: number | null
): string {
  if (!min && !max) return 'Unknown'
  if (!max || min === max) return `${min} player${min !== 1 ? 's' : ''}`
  return `${min}–${max} players`
}

// NOTE: getRatingColor removed - use getRatingSolidClass from @/design-system/tokens/ratingColors instead

export function getRatingLabel(rating: number | null): string {
  if (!rating) return 'Not Rated'

  const labels: Record<number, string> = {
    1: 'Awful',
    2: 'Bad',
    3: 'Poor',
    4: 'Below Average',
    5: 'Average',
    6: 'Above Average',
    7: 'Good',
    8: 'Very Good',
    9: 'Great',
    10: 'Masterpiece',
  }

  return labels[Math.round(rating)] || 'Unknown'
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout

  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-')
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length) + '...'
}
