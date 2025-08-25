// Reusable utilities for honor classification & normalization
// Centralizes truncated slug handling and category inference.

export type HonorCategory = 'Winner' | 'Nominee' | 'Special'

export interface RawLikeHonor {
  category?: HonorCategory
  result_raw?: string | null
  derived_result?: string | null
  position?: string | null
  slug?: string | null
  title?: string | null
  name?: string | null
  // For Golden Geek pattern analysis
  honor_id?: string | null
  award_type?: string | null
}

/**
 * Infer category using multi-stage precedence with truncated slug/title handling.
 * Precedence:
 * 1. result_raw / derived_result contains winner|nominee
 * 2. position text
 * 3. slug/title/name heuristics (handles truncated -winn, -winne, -nomin, -nom)
 * 4. Golden Geek special logic for truncated titles
 * 5. explicit category fallback
 */
export function inferHonorCategory(h: RawLikeHonor, context?: { gameCount?: number }): HonorCategory {
  // 1. Explicit result fields
  const raw = (h.result_raw || h.derived_result || '').toLowerCase()
  if (raw.includes('winner')) return 'Winner'
  if (raw.includes('nominee')) return 'Nominee'

  // 2. Position (usually non-truncated)
  const pos = (h.position || '').toLowerCase()
  if (/winner\b/.test(pos)) return 'Winner'
  if (/nominee\b/.test(pos)) return 'Nominee'

  // 3. Slug / title / name corpus
  const corpus = `${h.slug || ''} ${h.title || ''} ${h.name || ''}`.toLowerCase()
  if (/(winner|winne|winn)(\b|$)/.test(corpus) || /-winn$/.test(corpus) || /-winne$/.test(corpus)) return 'Winner'
  if (/(nominee|nomin|nom)(\b|$)/.test(corpus) || /-nomin$/.test(corpus) || /-nom$/.test(corpus)) return 'Nominee'

  // 4. Golden Geek special handling for truncated / context-derived categories.
  // Many Golden Geek entries lose the explicit winner/nominee token due to truncation:
  //  - "Golden Geek Best Board Game Artwork and Prese"
  //  - "Golden Geek Best Print and Play Board Game No" / "... Wi"
  // Strategy: if Golden Geek, earlier stages failed to classify, and we detect a
  // category phrase (artwork/presentation/print-and-play/etc) WITHOUT explicit winner/nominee tokens,
  // then infer via gameCount: single = Winner, multi = Nominee.
  if (h.award_type && /golden geek/i.test(h.award_type)) {
    const hasExplicit = /(winner|winne|winn|nominee|nomin|nom)(\b|$)/.test(corpus)
    const looksTruncatedCategory = (
      /artwork/.test(corpus) ||
      /prese/.test(corpus) ||
      /print.?(&|and).?play/.test(corpus) ||
      /expansion/.test(corpus) ||
      /solo board game/.test(corpus) ||
      /strategy board game/.test(corpus) ||
      /thematic board game/.test(corpus) ||
      /wargame/.test(corpus) ||
      /game of the year/.test(corpus) ||
      /heavy game/.test(corpus) ||
      /heavy/.test(corpus) ||
      /light game/.test(corpus) ||
      /light/.test(corpus) ||
      /medium game/.test(corpus) ||
      /medium/.test(corpus)
    )
    const truncatedSuffix = /(-no\b|\sno$|-wi\b|\swi$)/.test(corpus)
    if (!hasExplicit && (looksTruncatedCategory || truncatedSuffix)) {
      if (context?.gameCount === 1) return 'Winner'
      if ((context?.gameCount || 0) > 1) return 'Nominee'
    }
  }

  // 5. Recommended / special keywords
  if (corpus.includes('recommended') || corpus.includes('special')) return 'Special'

  return h.category || 'Special'
}

/** Normalize a collection of honors in-memory without mutating source permanently */
export function normalizeHonorCategories<T extends RawLikeHonor>(honors: T[]): T[] {
  return honors.map(h => {
    const inferred = inferHonorCategory(h)
    if (h.category !== inferred) {
      return { ...h, _originalCategory: h.category, category: inferred } as T & { _originalCategory?: HonorCategory }
    }
    return h
  })
}

/** Count category distribution for debugging */
export function summarizeHonorCategories(honors: RawLikeHonor[]) {
  return honors.reduce((acc, h) => {
    const c = inferHonorCategory(h)
    acc[c] = (acc[c] || 0) + 1
    return acc
  }, {} as Record<HonorCategory, number>)
}
