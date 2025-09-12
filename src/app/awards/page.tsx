export const dynamic = 'force-dynamic'
export const revalidate = 0
import PageLayout from '@/components/Components/PageLayout'
import Heading from '@/components/Components/Heading'
import { TrophyIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import awardsData from '@/data/awards.json'
import { getSupabaseServerClient } from '@/lib/supabaseServer'
import PersonalAwardCategorySection from '@/components/Components/AwardShowcase'
// Updated awards component import paths
import PersonalAwardsAuto from '@/components/Components/Awards/PersonalAwardsAuto'
// Removed IndustryAwards component in favor of direct AwardCard composition (subset of AwardCard story patterns)
import AwardCard from '@/components/Components/Awards/AwardCard'
// Removed AwardsLoggedOutHero in favor of inline Hero variant here
import Hero from '@/components/Components/Hero'

// Award categories loaded from JSON (icon string mapped to actual component below)
const AWARD_CATEGORIES = (awardsData as any).categories.map((c: any) => ({
  ...c,
  icon: TrophyIcon, // currently only TrophyIcon, future: dynamic mapping
})) as Array<{
  id: string; name: string; description: string; icon: typeof TrophyIcon; color: string; backgroundColor: string; borderColor: string; iconColor: string; website: string
}>

// Debug helper: build per-year breakdown for an award type
async function getAwardYearBreakdown(awardType: string) {
  const supabase = await getSupabaseServerClient()
  let allGames: any[] = []
  let page = 0
  const pageSize = 1000
  while (true) {
    try {
      const { data: games, error } = await supabase
        .from('games')
        .select('name, honors')
        .not('honors', 'eq', '[]')
        .range(page * pageSize, (page + 1) * pageSize - 1)
      if (error) {
        console.error('Error fetching year breakdown (page '+page+'):', {
          message: (error as any)?.message,
          details: (error as any)?.details,
          hint: (error as any)?.hint,
          code: (error as any)?.code,
        })
        break
      }
      if (!games || games.length === 0) break
      allGames = allGames.concat(games)
      if (games.length < pageSize) break
      page++
    } catch (e:any) {
      console.error('Unhandled exception in getAwardYearBreakdown', {
        page,
        error: e?.message,
        stack: e?.stack,
      })
      break
    }
  }

  const yearMap = new Map<
    number,
    { winners: string[]; nominees: string[]; special: string[] }
  >()
  allGames.forEach((g) => {
    const honorsArr = Array.isArray(g.honors) ? g.honors : []
    honorsArr
      .filter((h: any) => h.award_type === awardType)
      .forEach((h: any) => {
        if (typeof h.year !== 'number') return
        if (!yearMap.has(h.year))
          yearMap.set(h.year, { winners: [], nominees: [], special: [] })
        const bucket = yearMap.get(h.year)!
        if (h.category === 'Winner') {
          if (!bucket.winners.includes(g.name)) bucket.winners.push(g.name)
        } else if (h.category === 'Nominee') {
          if (!bucket.nominees.includes(g.name)) bucket.nominees.push(g.name)
        } else if (h.category === 'Special') {
          if (!bucket.special.includes(g.name)) bucket.special.push(g.name)
        }
      })
  })
  return Array.from(yearMap.entries())
    .map(([year, v]) => ({ year, ...v }))
    .sort((a, b) => b.year - a.year)
}

interface AwardStats {
  totalGames: number
  totalWinners: number
  totalNominees: number
  yearSpan: string
}

async function getAwardStats(awardType: string): Promise<AwardStats> {
  const supabase = await getSupabaseServerClient()
  let allGames: any[] = []
  let page = 0
  const pageSize = 1000
  while (true) {
    try {
      const { data: games, error } = await supabase
        .from('games')
        .select('honors')
        .not('honors', 'eq', '[]')
        .range(page * pageSize, (page + 1) * pageSize - 1)
      if (error) {
        console.error('Error fetching award stats (page '+page+'):', {
          awardType,
          message: (error as any)?.message,
          details: (error as any)?.details,
          hint: (error as any)?.hint,
          code: (error as any)?.code,
        })
        break
      }
      if (!games || games.length === 0) break
      allGames = allGames.concat(games)
      if (games.length < pageSize) break
      page++
    } catch (e:any) {
      console.error('Unhandled exception in getAwardStats', {
        awardType,
        page,
        error: e?.message,
        stack: e?.stack,
      })
      break
    }
  }

  const years = new Set<number>()
  let winners = 0
  let nominees = 0

  allGames.forEach((game: any) => {
    const honorsArr = Array.isArray(game.honors) ? game.honors : []
    const relevantHonors = honorsArr.filter(
      (honor: any) => honor.award_type === awardType
    )

    relevantHonors.forEach((honor: any) => {
      years.add(honor.year)
      if (honor.category === 'Winner') winners++
      else if (honor.category === 'Nominee') nominees++
    })
  })

  const yearArray = Array.from(years).sort((a, b) => a - b)
  const yearSpan =
    yearArray.length > 0
      ? `${yearArray[0]} - ${yearArray[yearArray.length - 1]}`
      : ''

  // Distinct games with at least one relevant honor (avoid double counting)
  const distinctGameIds = new Set<string>()
  allGames.forEach((g:any) => {
    const honorsArr = Array.isArray(g.honors) ? g.honors : []
    if (honorsArr.some((h:any)=> h.award_type === awardType)) distinctGameIds.add(g.id || JSON.stringify(g))
  })
  return {
    totalGames: distinctGameIds.size,
    totalWinners: winners,
    totalNominees: nominees,
    yearSpan,
  }
}


export default async function AwardsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const supabase = await getSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  // Personal (logged-in) auto-awards (simple: top 10 by rating per category)
  let personalCategoryBlocks: Array<{ id:string; label:string; games: any[]; description?: string }> = []
  let validRankedCount = 0
  if (session?.user) {
    const { data: rankingRows } = await supabase
      .from('rankings')
  .select('game_id, ranking, played_it, games:game_id ( id, name, year_published, image_url, thumbnail_url, categories, mechanics, min_players, max_players, honors, playtime_minutes )')
      .eq('user_id', session.user.id)

  const rankings = (rankingRows||[]).map(r=>{
      const g = (r as any).games
      if (!g) return null
  const playtime = (g as any).playtime_minutes ?? null
      return {
        ranking: (r as any).ranking as number | null,
        played_it: (r as any).played_it as boolean | null,
        game: {
          id: g.id as string,
          name: g.name as string,
      year_published: g.year_published as number | null,
      image_url: g.image_url as string | null,
      thumbnail_url: g.thumbnail_url as string | null,
          categories: g.categories as string[] | null,
          mechanics: (g as any).mechanics as string[] | null,
          min_players: g.min_players as number | null,
          max_players: g.max_players as number | null,
          playtime_minutes: playtime as number | null,
          honors: g.honors,
        }
      }
    }).filter(Boolean) as any[]

  // Treat any positive ranking as valid; don't require played_it so users without that flag still qualify
  const validRanked = rankings.filter(r=> (r.ranking ?? 0) > 0)
  validRankedCount = validRanked.length

  // Sort once by ranking desc (treat null as 0)
  const sorted = validRanked.sort((a,b)=>(b.ranking??0)-(a.ranking??0))

      const defs: Array<{ id:string; label:string; description?: string; filter:(r:any)=>boolean }> = [
      { id:'best', label:'Best Overall', description:'Your all‑time highest rated played games.', filter: ()=>true },
      { id:'strategy', label:'Best Strategy', description:'Depth, planning, crunchy decisions.', filter: r => (r.game.categories||[]).some((c:string)=>/strategy|wargame|economic|abstract|thematic|euro/i.test(c)) },
      { id:'family', label:'Best Family', description:'Accessible & fun for mixed groups.', filter: r => (r.game.categories||[]).some((c:string)=>/family|gateway|kids/i.test(c)) },
      { id:'duo', label:'Best Duo', description:'Top two‑player experiences.', filter: r => (r.game.min_players===2 && r.game.max_players===2) || (r.game.categories||[]).some((c:string)=>/2.*player|two.?player|duel/i.test(c)) },
      { id:'kids', label:'Best Kids', description:'Great for younger players.', filter: r => (r.game.categories||[]).some((c:string)=>/child|kid|junior|preschool/i.test(c)) },
      { id:'card', label:'Best Card Game', description:'Card‑driven experiences.', filter: r => (r.game.categories||[]).some((c:string)=>/card|living card/i.test(c)) },
      { id:'wargame', label:'Best Wargame', description:'Conflict & historical simulation.', filter: r => (r.game.categories||[]).some((c:string)=>/war.?game|wargame|conflict|historical/i.test(c)) },
      { id:'party', label:'Best Party', description:'Social & high energy.', filter: r => (r.game.categories||[]).some((c:string)=>/party|social|humor/i.test(c)) },
      { id:'trivia', label:'Best Trivia', description:'Quiz & fact showdowns.', filter: r => (r.game.categories||[]).some((c:string)=>/trivia|quiz|knowledge/i.test(c)) },
      { id:'bluffing', label:'Best Bluffing', description:'Deduction & deception.', filter: r => (r.game.categories||[]).some((c:string)=>/bluff|deception|hidden role|social deduction/i.test(c)) },
      { id:'pnp', label:'Best Print & Play', description:'DIY / print & play titles.', filter: r => (r.game.categories||[]).some((c:string)=>/print.?(&|and)?.?play|print.?n.?play|pnp|roll.?and.?write/i.test(c)) },
      { id:'coop', label:'Best Cooperative', description:'Work together vs the game.', filter: r => (r.game.mechanics||[]).some((m:string)=>/coop|campaign|legacy/i.test(m)) || (r.game.categories||[]).some((c:string)=>/co.?op|cooperative/i.test(c)) },
      { id:'deckbuild', label:'Best Deck Building', description:'Progress via evolving decks.', filter: r => (r.game.mechanics||[]).some((m:string)=>/deck.?build|bag.?build/i.test(m)) },
      { id:'solo', label:'Best Solo / Solitaire', description:'Great single‑player experience.', filter: r => (r.game.mechanics||[]).some((m:string)=>/solo|solitaire|autom|campaign/i.test(m)) || (r.game.min_players === 1) },
      { id:'abstract', label:'Best Abstract', description:'Pure mechanisms & elegance.', filter: r => (r.game.categories||[]).some((c:string)=>/abstract/i.test(c)) },
      { id:'thematic', label:'Best Thematic', description:'Story & immersion focused.', filter: r => (r.game.categories||[]).some((c:string)=>/thematic|adventure|narrative|story/i.test(c)) },
      { id:'light', label:'Best Light / Filler', description:'Quick to learn & play (<45m).', filter: r => (r.game.playtime_minutes ?? 999) <= 45 },
      { id:'medium', label:'Best Medium Weight', description:'Mid-weight strategy (~46-90m).', filter: r => (r.game.playtime_minutes ?? 0) > 45 && (r.game.playtime_minutes ?? 0) <= 100 },
      { id:'long', label:'Best Long / Epic', description:'Long form or epic sessions.', filter: r => (r.game.playtime_minutes ?? 0) > 100 },
      ]

    personalCategoryBlocks = defs.map(def => ({
      id: def.id,
      label: def.label,
      description: def.description,
      games: sorted.filter(def.filter).slice(0,10).map(r=>({
        id: r.game.id,
        name: r.game.name,
        year_published: r.game.year_published,
        image_url: r.game.image_url,
        thumbnail_url: r.game.thumbnail_url,
        honors: r.game.honors,
        categories: r.game.categories,
        min_players: r.game.min_players,
        max_players: r.game.max_players,
        playtime_minutes: r.game.playtime_minutes,
        ranking: r.ranking,
        played_it: r.played_it,
      }))
    })).filter(block => block.games.length > 0)
  }
  // Map award IDs to database award_type values
  const awardTypeMap: Record<string, string> = (awardsData as any).awardTypeMap

  // Get stats for each award category
  const statsPromises = AWARD_CATEGORIES.map((category) =>
    getAwardStats(awardTypeMap[category.id])
  )
  const allStats = await Promise.all(statsPromises)

  const debugEnabled = params?.debug === '1' || params?.debug === 'true'
  let debugData: Array<{
    id: string
    name: string
    awardType: string
    years: Array<{
      year: number
      winners: string[]
      nominees: string[]
      special: string[]
    }>
  }> = []
  if (debugEnabled) {
    // Fetch detailed year breakdowns in parallel
    const yearBreakdowns = await Promise.all(
      AWARD_CATEGORIES.map((c) => getAwardYearBreakdown(awardTypeMap[c.id]))
    )
    debugData = AWARD_CATEGORIES.map((c, idx) => ({
      id: c.id,
      name: c.name,
      awardType: awardTypeMap[c.id],
      years: yearBreakdowns[idx],
    }))
  }

  // Server-known auth state (may be stale) for initial paint; client gate will correct.
  const serverLoggedIn = !!session?.user

  return (
    <PageLayout>
<div className="max-w-6xl mx-auto px-4 py-8">

  {!serverLoggedIn && <Hero variant="awards" />}


  {/* Industry Awards (direct AwardCard grid) */}
  <section>
    <div className="flex items-end justify-between mb-5">
      <Heading as="h2" variant="section" className="mb-1">Industry Awards</Heading>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {AWARD_CATEGORIES.slice(0,3).map((category, idx) => {
        const stat = allStats[idx]
        if (!stat) return null
        return (
          <AwardCard
            key={category.id}
            href={`/awards/${category.id}`}
            title={category.name}
            description={category.description}
            yearSpan={undefined}
            winners={undefined as any}
            nominees={undefined as any}
            total={undefined}
            circleBorderClass={category.borderColor}
            circleBgClass={category.backgroundColor}
            iconColorClass={category.iconColor}
            showStats={false}
          />
        )
      })}
    </div>
  </section>


  {/* Personal Awards (server-rendered if session known; else client fallback) */}
  {serverLoggedIn ? (
    <div className="mt-16">
      <div className="mb-5">
        <h2 className="text-md font-semibold tracking-wide text-gray-400 uppercase">Personal Awards</h2>
      </div>
      <div className="space-y-12">
        {personalCategoryBlocks.length === 0 && (
          <p className="text-xs text-gray-500 text-center">Rate and rank games you have played to start generating your personal awards.</p>
        )}
        {personalCategoryBlocks.map(block => (
          <PersonalAwardCategorySection key={block.id} id={block.id} title={block.label} description={block.description} games={block.games as any} />
        ))}
        {personalCategoryBlocks.length > 0 && (
          <div className="pt-2 text-center text-[11px] text-gray-400">
            Auto Awards are generated from your played & rated games using relaxed category and mechanic matches; rate more games to unlock additional categories.
          </div>
        )}
      </div>
    </div>
  ) : (
    <div className="mt-16">
      <PersonalAwardsAuto />
    </div>
  )}


  {debugEnabled && (
    <div className="mt-16">
      <Heading as="h2" size="lg" className="mb-4 flex items-center gap-2">
        <ChevronDownIcon className="w-6 h-6 text-gray-500" /> Debug: Raw Award Data
      </Heading>
      <p className="text-sm text-gray-500 mb-6">
        Showing per-year breakdown sourced directly from games.honors.
        Duplicate game appearances in multiple categories are shown unless
        de-duplicated in import logic.
      </p>
      <div className="space-y-10 text-left">
        {debugData.map((block) => (
          <div
            key={block.id}
            className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm"
          >
            <Heading as="h3" size="sm" subtle className="mb-2">
              {block.name} <span className="text-xs text-gray-400">({block.awardType})</span>
            </Heading>
            {block.years.length === 0 && (
              <p className="text-sm text-red-500">No honors found.</p>
            )}
            <div className="max-h-96 overflow-auto pr-2 space-y-4 text-sm">
              {block.years.map((y) => (
                <div
                  key={y.year}
                  className="border-b last:border-b-0 pb-3"
                >
                  <div className="font-medium text-gray-700 mb-1">
                    {y.year}
                  </div>
                  <div className="grid gap-2 md:grid-cols-3">
                    <div>
                      <div className="text-yellow-700 font-semibold">
                        Winners ({y.winners.length})
                      </div>
                      <ul className="list-disc ml-4 text-gray-600 space-y-0.5">
                        {y.winners.slice(0, 8).map((n) => (
                          <li key={n}>{n}</li>
                        ))}
                        {y.winners.length > 8 && (
                          <li className="italic text-gray-400">
                            +{y.winners.length - 8} more
                          </li>
                        )}
                      </ul>
                    </div>
                    <div>
                      <div className="text-gray-700 font-semibold">
                        Nominees ({y.nominees.length})
                      </div>
                      <ul className="list-disc ml-4 text-gray-600 space-y-0.5">
                        {y.nominees.slice(0, 8).map((n) => (
                          <li key={n}>{n}</li>
                        ))}
                        {y.nominees.length > 8 && (
                          <li className="italic text-gray-400">
                            +{y.nominees.length - 8} more
                          </li>
                        )}
                      </ul>
                    </div>
                    <div>
                      <div className="text-blue-700 font-semibold">
                        Special / Recommended ({y.special.length})
                      </div>
                      <ul className="list-disc ml-4 text-gray-600 space-y-0.5">
                        {y.special.slice(0, 8).map((n) => (
                          <li key={n}>{n}</li>
                        ))}
                        {y.special.length > 8 && (
                          <li className="italic text-gray-400">
                            +{y.special.length - 8} more
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 text-xs text-gray-400">
        Debug mode active via ?debug=1
      </div>
    </div>
  )}
</div>
</PageLayout>
  )
}
