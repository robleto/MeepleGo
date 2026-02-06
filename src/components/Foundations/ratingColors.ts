// Centralized rating color tokens for 1-10 scale.
// Keep this file minimal: only pure mappings & helpers (no React import).

export const RATING_SOLID_CLASS: Record<number, string> = {
  1: 'bg-red-400 text-white',
  2: 'bg-orange-400 text-white',
  3: 'bg-amber-400 text-white',
  4: 'bg-yellow-400 text-gray-900 dark:text-gray-900',
  5: 'bg-lime-400 text-gray-900 dark:text-gray-900',
  6: 'bg-green-400 text-white',
  7: 'bg-emerald-400 text-white',
  8: 'bg-teal-400 text-white',
  9: 'bg-cyan-400 text-white',
  10: 'bg-purple-400 text-white',
}

export const RATING_SUBTLE_CLASS: Record<number, string> = {
  1: 'bg-red-50/90 dark:bg-red-950/90 text-red-700 dark:text-red-300 border border-red-200/60 dark:border-red-800/60',
  2: 'bg-orange-50/90 dark:bg-orange-950/90 text-orange-700 dark:text-orange-300 border border-orange-200/60 dark:border-orange-800/60',
  3: 'bg-amber-50/90 dark:bg-amber-950/90 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60',
  4: 'bg-yellow-50/90 dark:bg-yellow-950/90 text-yellow-700 dark:text-yellow-300 border border-yellow-200/60 dark:border-yellow-800/60',
  5: 'bg-lime-50/90 dark:bg-lime-950/90 text-lime-700 dark:text-lime-300 border border-lime-200/60 dark:border-lime-800/60',
  6: 'bg-green-50/90 dark:bg-green-950/90 text-green-700 dark:text-green-300 border border-green-200/60 dark:border-green-800/60',
  7: 'bg-emerald-50/90 dark:bg-emerald-950/90 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60',
  8: 'bg-teal-50/90 dark:bg-teal-950/90 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/60',
  9: 'bg-cyan-50/90 dark:bg-cyan-950/90 text-cyan-700 dark:text-cyan-300 border border-cyan-200/60 dark:border-cyan-800/60',
  10: 'bg-purple-50/90 dark:bg-purple-950/90 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60',
}

export const RATING_TEXT_CLASS: Record<number, string> = {
  1: 'text-red-500 dark:text-red-400',
  2: 'text-orange-500 dark:text-orange-400',
  3: 'text-amber-500 dark:text-amber-400',
  4: 'text-yellow-500 dark:text-yellow-400',
  5: 'text-lime-500 dark:text-lime-400',
  6: 'text-green-500 dark:text-green-400',
  7: 'text-emerald-500 dark:text-emerald-400',
  8: 'text-teal-500 dark:text-teal-400',
  9: 'text-cyan-500 dark:text-cyan-400',
  10: 'text-purple-500 dark:text-purple-400',
}

export const RATING_EMPTY_CLASS = 'text-gray-500 dark:text-gray-400 bg-white/70 dark:bg-gray-800/70 backdrop-blur'

export function getRatingSolidClass(rating: number | null | undefined) {
  if (!rating || rating < 1 || rating > 10) return RATING_EMPTY_CLASS
  return RATING_SOLID_CLASS[rating] || RATING_EMPTY_CLASS
}

export function getRatingSubtleClass(rating: number | null | undefined) {
  if (!rating || rating < 1 || rating > 10)
    return 'bg-gray-100/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-400 border border-gray-200/60 dark:border-gray-700/60'
  return RATING_SUBTLE_CLASS[rating] || 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
}

export function getRatingTextClass(rating: number | null | undefined): string {
  if (!rating || rating < 1 || rating > 10) return 'text-gray-400 dark:text-gray-500'
  return RATING_TEXT_CLASS[rating] || 'text-gray-400 dark:text-gray-500'
}

export const RATING_SELECTION_VALUES = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1] as const
