const BACKOFFS_MS = [800, 1200, 2000, 3000, 4500, 6000]

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function fetchSparql(query: string): Promise<
  | { ok: true; data: any }
  | {
      ok: false
      error: string
      status?: number
      details?: string
      bodySnippet?: string
    }
> {
  const endpoint = 'https://query.wikidata.org/sparql'
  const url = `${endpoint}?format=json&query=${encodeURIComponent(query)}`

  for (let attempt = 0; attempt <= BACKOFFS_MS.length; attempt += 1) {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/sparql-results+json',
        'User-Agent':
          'MeepleGo/1.0 (+https://meeplego.com) wikidata-client',
      },
      next: { revalidate: 0 },
    })

    if (response.status === 429 || response.status === 503) {
      if (attempt === BACKOFFS_MS.length) {
        return {
          ok: false,
          error: 'Wikidata is rate limiting this request. Please try again.',
          status: response.status,
          details: response.statusText || undefined,
        }
      }
      await sleep(BACKOFFS_MS[attempt])
      continue
    }

    if (!response.ok) {
      let bodySnippet: string | undefined
      try {
        const raw = await response.text()
        const normalized = raw.replace(/\s+/g, ' ').trim()
        bodySnippet = normalized ? normalized.slice(0, 200) : undefined
      } catch {
        bodySnippet = undefined
      }

      return {
        ok: false,
        error: `Wikidata request failed (HTTP ${response.status}). Please try again.`,
        status: response.status,
        details: response.statusText || undefined,
        bodySnippet,
      }
    }

    const data = await response.json()
    return { ok: true, data }
  }

  return {
    ok: false,
    error: 'Wikidata is rate limiting this request. Please try again.',
    status: 429,
    details: 'Too Many Requests',
  }
}

export function pickBindingValue(binding: any, key: string): string | null {
  if (!binding || !binding[key] || !binding[key].value) return null
  return String(binding[key].value)
}

export function pickNumber(binding: any, key: string): number | null {
  const value = pickBindingValue(binding, key)
  if (!value) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function extractQid(value: string | null): string | null {
  if (!value) return null
  const match = value.match(/Q\d+$/)
  return match ? match[0] : null
}
