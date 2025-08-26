export const dynamic = 'force-dynamic'
export const revalidate = 0
import PageLayout from '@/components/PageLayout'
import Heading from '@/components/Heading'
import { getSupabaseServerClient } from '@/lib/supabaseServer'
import { CATEGORY_CONFIGS } from '@/lib/awards/deriveUserAwards'
import AwardYearSelect from '@/components/AwardYearSelect'
import Link from 'next/link'
import { redirect } from 'next/navigation'

interface AwardRow { id:number; year:number; category:string; nominees:number[]; winner_id:number|null; updated_at:string; created_at:string; threshold_used?: number|null; manual_override?: boolean; stale?: boolean }

interface GameLite { id:number; name:string; thumbnail_url:string|null }

async function fetchAwards(year: number) {
  const supabase = await getSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { session:null, awards: [] as AwardRow[] }
  const { data } = await supabase
    .from('awards')
    .select('id,year,category,nominees,winner_id,updated_at,created_at,threshold_used,manual_override,stale')
    .eq('profile_id', session.user.id)
    .eq('year', year)
    .order('category')
  // Collect all game IDs
  const ids = new Set<number>()
  ;(data||[]).forEach(a=>{ a.nominees?.forEach((n:number)=>ids.add(n)); if (a.winner_id) ids.add(a.winner_id) })
  let games: GameLite[] = []
  if (ids.size) {
    const { data: gdata } = await supabase.from('games').select('id,name,thumbnail_url').in('id', Array.from(ids))
    games = (gdata || []) as any
  }
  const gameMap = Object.fromEntries(games.map(g=>[g.id,g]))
  return { session, awards: (data||[]) as AwardRow[], gameMap: gameMap as Record<number, GameLite> }
}

async function fetchYears() {
  const supabase = await getSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return [] as number[]
  const { data } = await supabase.from('games').select('year_published').order('year_published',{ascending:false}).limit(5000)
  const years = new Set<number>()
  ;(data||[]).forEach(g=>{ if (g.year_published) years.add(g.year_published) })
  return Array.from(years).sort((a,b)=>b-a)
}

export default async function MyAwardsYearPage({ params }: { params: { year: string } }) {
  const yearNum = Number(params.year)
  const years = await fetchYears()
  const { session, awards, gameMap } = await fetchAwards(yearNum)
  const categoriesById = Object.fromEntries(CATEGORY_CONFIGS.map(c=>[c.id,c]))
  const anyStale = awards.some(a=>a.stale)
  if (!session) {
    redirect(`/login?next=/awards/my/${yearNum}`)
  }

  return (
    <PageLayout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        {anyStale && (
          <div className="mb-6 p-4 rounded-md border border-amber-300 bg-amber-50 text-amber-800 text-sm flex flex-wrap items-center gap-3">
            <span className="font-medium">Some awards are stale after ranking changes.</span>
            <form action={`/api/awards/${yearNum}/rebuild?staleOnly=1`} method="post">
              <button className="px-2.5 py-1 rounded bg-amber-600 text-white text-xs hover:bg-amber-500">Refresh Stale Only</button>
            </form>
            <form action={`/api/awards/${yearNum}/rebuild`} method="post">
              <button className="px-2.5 py-1 rounded bg-gray-800 text-white text-xs hover:bg-gray-700">Rebuild All</button>
            </form>
          </div>
        )}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Heading as="h1" size="lg" soft className="mb-1">My {yearNum} Awards</Heading>
            <p className="text-sm text-gray-500">Auto-derived from your {yearNum} ratings. Rebuild after you change rankings.</p>
          </div>
          <div className="flex gap-2 items-center">
            <AwardYearSelect years={years} currentYear={yearNum} />
            <form action={`/api/awards/${yearNum}/rebuild`} method="post">
              <button className="px-3 py-1.5 rounded-md bg-primary-600 text-white text-sm hover:bg-primary-600/90">Rebuild All</button>
            </form>
          </div>
        </div>
        {/* Auth is required; unauthenticated users are redirected above. */}
        <div className="grid gap-6 md:grid-cols-2">
          {CATEGORY_CONFIGS.map(cfg => {
            const row = awards.find(a=>a.category===cfg.id)
            return (
              <div key={cfg.id} className="border rounded-lg p-4 bg-white shadow-sm dark:bg-gray-900 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    {cfg.label}
                    {row?.stale && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">STALE</span>}
                    {row?.manual_override && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">MANUAL</span>}
                  </h3>
                  {row?.threshold_used && <span className="text-[10px] text-gray-500" title={`Threshold used: >= ${row.threshold_used}`}>≥ {row.threshold_used}</span>}
                </div>
                {!row && (
                  <div className="text-xs text-gray-500">Not generated yet. Click Rebuild All.</div>
                )}
                {row && (
                  <div className="space-y-3">
                    <div>
                      <div className="text-[11px] font-medium text-gray-500 mb-1">Winner</div>
                      {row.winner_id ? (
                        <div className="flex items-center gap-2">
                          {gameMap && gameMap[row.winner_id]?.thumbnail_url && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={gameMap[row.winner_id].thumbnail_url!} alt="" className="w-8 h-8 object-cover rounded" />
                          )}
                          <span className="inline-flex items-center text-xs px-2 py-1 rounded bg-primary-600/10 text-primary-700 dark:bg-primary-500/20 dark:text-primary-300">{gameMap && gameMap[row.winner_id]?.name || `Game #${row.winner_id}`}</span>
                          <form action={`/api/awards/${yearNum}/${cfg.id}`} method="post">
                            <input type="hidden" name="winner_id" value="" />
                            <button formMethod="patch" className="text-[10px] text-gray-400 hover:text-red-600" title="Clear winner">✕</button>
                          </form>
                        </div>
                      ) : <span className="text-xs text-gray-400 italic">None</span>}
                    </div>
                    <div>
                      <div className="text-[11px] font-medium text-gray-500 mb-1">Nominees ({row.nominees.length})</div>
                      {row.nominees.length ? (
                        <ul className="flex flex-wrap gap-1">
                          {row.nominees.map(id => (
                            <li key={id} className={`group relative text-[11px] px-2 py-1 rounded border bg-gray-50 dark:bg-gray-800 dark:border-gray-700 ${id===row.winner_id?'ring-1 ring-primary-500':''}`}
                              title={(gameMap && gameMap[id]?.name) || `Game #${id}`}
                            >
                              {(gameMap && gameMap[id]?.name?.slice(0,24)) || `#${id}`}
                              <div className="opacity-0 group-hover:opacity-100 transition flex gap-1 absolute -top-2 -right-2">
                                <form action={`/api/awards/${yearNum}/${cfg.id}`} method="post">
                                  <input type="hidden" name="winner_id" value={id} />
                                  <button formMethod="patch" className="bg-primary-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px]" title="Set winner">★</button>
                                </form>
                                <form action={`/api/awards/${yearNum}/${cfg.id}`} method="post">
                                  <input type="hidden" name="remove_nominee" value={id} />
                                  <button formMethod="patch" className="bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px]" title="Remove">–</button>
                                </form>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : <span className="text-xs text-gray-400 italic">None</span>}
                      <div className="mt-2">
                        <form action={`/api/awards/${yearNum}/${cfg.id}`} method="post" className="flex gap-2 items-center" autoComplete="off">
                          <input type="number" name="add_nominee" placeholder="Game ID" className="w-28 text-[11px] px-2 py-1 rounded border bg-white dark:bg-gray-800" />
                          <button formMethod="patch" className="text-[11px] px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600">Add</button>
                        </form>
                      </div>
                    </div>
                    <form action={`/api/awards/${yearNum}/${cfg.id}`} method="post" className="flex gap-2">
                      <input type="hidden" name="unlock" value="true" />
                      {row.manual_override && <button className="text-[11px] px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700" formMethod="patch">Unlock Auto</button>}
                    </form>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </PageLayout>
  )
}
