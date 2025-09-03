// Centralized rating color tokens for 1-10 scale.
// Keep this file minimal: only pure mappings & helpers (no React import).

// Solid backgrounds (used for buttons, chips, overlays) -> includes text color.
export const RATING_SOLID_CLASS: Record<number,string> = {
  1: 'bg-red-600 text-white',
  2: 'bg-orange-600 text-white',
  3: 'bg-amber-600 text-white',
  4: 'bg-yellow-600 text-gray-900',
  5: 'bg-lime-600 text-gray-900',
  6: 'bg-green-600 text-white',
  7: 'bg-emerald-600 text-white',
  8: 'bg-teal-600 text-white',
  9: 'bg-cyan-600 text-white',
  10: 'bg-sky-600 text-white',
}

// Fallback (when no rating) matches prior styling in components using translucent white / gray states.
export const RATING_EMPTY_CLASS = 'text-gray-500 bg-white/70 backdrop-blur';

/** Return solid class for rating (1-10) or empty fallback */
export function getRatingSolidClass(rating: number | null | undefined) {
  if (!rating || rating < 1 || rating > 10) return RATING_EMPTY_CLASS
  return RATING_SOLID_CLASS[rating] || RATING_EMPTY_CLASS
}

/** Map used when a square grid of rating candidate buttons needs consistent classes. */
export const RATING_SELECTION_VALUES = [10,9,8,7,6,5,4,3,2,1] as const
