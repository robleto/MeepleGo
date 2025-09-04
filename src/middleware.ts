import { NextRequest, NextResponse } from 'next/server'
const listNameCache: Record<string,{ slug:string; ts:number }> = {}

// Redirect legacy /lists/:uuid to /lists/:slugified-name-:uuid
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  // Match /lists/<uuid>
  const listUuidMatch = pathname.match(/^\/lists\/([0-9a-fA-F-]{36})$/)
  if (listUuidMatch) {
    const uuid = listUuidMatch[1]
    // fetch list name from API route (edge-friendly: call Postgrest) - keep lightweight
    try {
      const now = Date.now()
      const cached = listNameCache[uuid]
      if (cached && now - cached.ts < 1000*60*5) { // 5 min
        const url = req.nextUrl.clone(); url.pathname = `/lists/${cached.slug}-${uuid}`; return NextResponse.redirect(url, 308)
      }
      const origin = req.nextUrl.origin
      // Try persistent cache API first
      try {
        const cacheRes = await fetch(`${origin}/api/list-slug-cache/${uuid}`)
        if (cacheRes.ok) {
          const cacheJson = await cacheRes.json()
            if (cacheJson?.cache?.slug) {
              listNameCache[uuid] = { slug: cacheJson.cache.slug, ts: now }
              const url = req.nextUrl.clone(); url.pathname = `/lists/${cacheJson.cache.slug}-${uuid}`; return NextResponse.redirect(url, 308)
            }
        }
      } catch(_) { /* ignore */ }
      const res = await fetch(`${origin}/api/lists/${uuid}`, { headers: { 'x-mg-mw': '1' } })
      if (res.ok) {
        const json = await res.json()
        const name: string = json?.list?.name || 'list'
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,60)
        listNameCache[uuid] = { slug, ts: now }
        // Fire and forget persist
        fetch(`${origin}/api/list-slug-cache/${uuid}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ slug }) }).catch(()=>{})
        const url = req.nextUrl.clone(); url.pathname = `/lists/${slug}-${uuid}`; return NextResponse.redirect(url, 308)
      }
    } catch (_) { /* ignore */ }
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/lists/:path*']
}
