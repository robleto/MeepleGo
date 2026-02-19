type AwardsApiResponse<T = any> = {
  Response: 'True' | 'False'
  Error?: string
  totalResults?: number
  awards?: T[]
  awardSets?: string[]
  categories?: string[]
  year?: number
}

export type AwardsApiAward = {
  id: string
  slug: string
  url: string
  year: number
  title: string
  primaryName?: string
  alternateNames?: string[]
  boardgames: Array<{
    bggId?: number
    bgg_id?: number
    id?: string | number
    name: string
    image?: string
    image_url?: string
    thumbnail?: string
    thumbnail_url?: string
  }>
  awardSet: string
  position: string
  isWinner?: boolean
  isNominee?: boolean
}

function getAwardsApiBaseUrl() {
  const base =
    process.env.AWARDS_API_BASE_URL ||
    process.env.AWARDS_API_URL ||
    process.env.NEXT_PUBLIC_AWARDS_API_URL ||
    'https://awardsapi.com/api/'
  return base.endsWith('/') ? base : `${base}/`
}

function buildAwardsApiUrl(params: Record<string, string | number | undefined>) {
  const url = new URL(getAwardsApiBaseUrl())
  Object.entries(params).forEach(([key, value]) => {
    if (value == null || value === '') return
    url.searchParams.set(key, String(value))
  })

  const apiKey = process.env.AWARDS_API_KEY || process.env.NEXT_PUBLIC_AWARDS_API_KEY
  if (apiKey && !url.searchParams.has('apikey')) {
    url.searchParams.set('apikey', apiKey)
  }

  return url.toString()
}

export async function searchAwards(params: {
  search: string
  year?: number
  category?: string
  award_set?: string
  type?: string
}): Promise<AwardsApiResponse<AwardsApiAward>> {
  const url = buildAwardsApiUrl({
    s: params.search,
    year: params.year,
    category: params.category,
    award_set: params.award_set,
    type: params.type,
  })

  const res = await fetch(url, { next: { revalidate: 0 } })
  return (await res.json()) as AwardsApiResponse<AwardsApiAward>
}

export async function getAwardsByYear(year: number) {
  const base = getAwardsApiBaseUrl()
  const url = new URL(`years/${year}`, base)
  const apiKey = process.env.AWARDS_API_KEY || process.env.NEXT_PUBLIC_AWARDS_API_KEY
  if (apiKey) {
    url.searchParams.set('apikey', apiKey)
  }
  const res = await fetch(url.toString(), { next: { revalidate: 0 } })
  return (await res.json()) as AwardsApiResponse<AwardsApiAward>
}
