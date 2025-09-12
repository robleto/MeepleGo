// Centralized rating color tokens for 1-10 scale.
// Keep this file minimal: only pure mappings & helpers (no React import).

export const RATING_SOLID_CLASS: Record<number,string> = {
	1: 'bg-red-400 text-white',
	2: 'bg-orange-400 text-white',
	3: 'bg-amber-400 text-white',
	4: 'bg-yellow-400 text-gray-900',
	5: 'bg-lime-400 text-gray-900',
	6: 'bg-green-400 text-white',
	7: 'bg-emerald-400 text-white',
	8: 'bg-teal-400 text-white',
	9: 'bg-cyan-400 text-white',
	10: 'bg-purple-400 text-white',
}

export const RATING_SUBTLE_CLASS: Record<number,string> = {
	1: 'bg-red-50/90 text-red-700 border border-red-200/60',
	2: 'bg-orange-50/90 text-orange-700 border border-orange-200/60',
	3: 'bg-amber-50/90 text-amber-700 border border-amber-200/60',
	4: 'bg-yellow-50/90 text-yellow-700 border border-yellow-200/60',
	5: 'bg-lime-50/90 text-lime-700 border border-lime-200/60',
	6: 'bg-green-50/90 text-green-700 border border-green-200/60',
	7: 'bg-emerald-50/90 text-emerald-700 border border-emerald-200/60',
	8: 'bg-teal-50/90 text-teal-700 border border-teal-200/60',
	9: 'bg-cyan-50/90 text-cyan-700 border border-cyan-200/60',
	10: 'bg-purple-50/90 text-purple-700 border border-purple-200/60',
}

export const RATING_EMPTY_CLASS = 'text-gray-500 bg-white/70 backdrop-blur';

export function getRatingSolidClass(rating: number | null | undefined) {
	if (!rating || rating < 1 || rating > 10) return RATING_EMPTY_CLASS
	return RATING_SOLID_CLASS[rating] || RATING_EMPTY_CLASS
}

export function getRatingSubtleClass(rating: number | null | undefined) {
	if (!rating || rating < 1 || rating > 10) return 'bg-gray-100/80 text-gray-600 border border-gray-200/60'
	return RATING_SUBTLE_CLASS[rating] || 'bg-gray-200 text-gray-600'
}

export const RATING_SELECTION_VALUES = [10,9,8,7,6,5,4,3,2,1] as const