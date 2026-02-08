import { XMLParser } from 'fast-xml-parser'
import { decodeHtmlEntities } from '@/utils/csvParser'

const BACKOFFS_MS = [800, 1200, 2000, 3000, 4500, 6000]

export const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
})

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function fetchBggXml(url: string): Promise<
  | { ok: true; xml: string }
  | { ok: false; error: string; status?: number }
> {
  for (let attempt = 0; attempt <= BACKOFFS_MS.length; attempt += 1) {
    const response = await fetch(url, { next: { revalidate: 0 } })

    if (response.status === 202) {
      if (attempt === BACKOFFS_MS.length) {
        return {
          ok: false,
          error: 'BGG is still preparing this request. Please try again.',
          status: 202,
        }
      }
      await sleep(BACKOFFS_MS[attempt])
      continue
    }

    if (!response.ok) {
      return {
        ok: false,
        error: 'BGG request failed. Please try again.',
        status: response.status,
      }
    }

    const xml = await response.text()
    return { ok: true, xml }
  }

  return {
    ok: false,
    error: 'BGG is still preparing this request. Please try again.',
    status: 202,
  }
}

export function textValue(node: any): string | null {
  if (node == null) return null
  if (typeof node === 'string') return node
  if (typeof node === 'object' && '@_value' in node) return node['@_value']
  return null
}

export function decodedTextValue(node: any): string | null {
  const value = textValue(node)
  return value ? decodeHtmlEntities(value) : null
}

export function toNumber(value: any): number | null {
  const raw = typeof value === 'object' ? value?.['@_value'] : value
  if (raw == null || raw === '') return null
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : null
}

export function pickPrimaryName(nameNode: any): string | null {
  if (!nameNode) return null
  if (Array.isArray(nameNode)) {
    const primary = nameNode.find((n: any) => n?.['@_type'] === 'primary')
    const picked = primary ?? nameNode[0]
    const value = textValue(picked)
    return value ? decodeHtmlEntities(value) : null
  }

  const value = textValue(nameNode)
  return value ? decodeHtmlEntities(value) : null
}

export function cleanDescription(raw: string | null): string | null {
  if (!raw) return null
  let text = decodeHtmlEntities(raw)
  text = text.replace(/<[^>]*>/g, ' ')
  text = text.replace(/&amp;#10;|&#10;|&#13;|&#13;&#10;/g, ' ')
  text = text.replace(/\s+/g, ' ').trim()
  return text || null
}
