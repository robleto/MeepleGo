// Centralized rating color tokens for 1-10 scale.
// Keep this file minimal: only pure mappings & helpers (no React import).

// Refined pastel palette inspired by modern design systems like Notion
// Bold enough for overlays, soft enough for elegance
export const RATING_SOLID_CLASS: Record<number,string> = {
  1: 'bg-red-400 text-white',         // Soft red
  2: 'bg-orange-400 text-white',      // Soft orange  
  3: 'bg-amber-400 text-white',       // Soft amber
  4: 'bg-yellow-400 text-gray-900',   // Soft yellow
  5: 'bg-lime-400 text-gray-900',     // Soft lime
  6: 'bg-green-400 text-white',       // Soft green
  7: 'bg-emerald-400 text-white',     // Soft emerald
  8: 'bg-teal-400 text-white',        // Soft teal
  9: 'bg-cyan-400 text-white',        // Soft cyan
  10: 'bg-purple-400 text-white',     // Soft purple (like Notion's 10)
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
