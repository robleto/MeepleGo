import PageLayout from '@/components/shared/PageLayout'
import awardsData from '@/data/awards.json'
import { TrophyIcon, ChevronLeftIcon } from '@heroicons/react/24/outline'
import { getSupabaseServerClient } from '@/lib/supabaseServer'
import IndustryAwards from '@/components/features/awards/IndustryAwards'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface AwardStats { totalGames:number; totalWinners:number; totalNominees:number; yearSpan:string }

type AwardCategory = { id:string; name:string; description:string; color:string; backgroundColor:string; borderColor:string; iconColor:string; website:string; icon?: typeof TrophyIcon }
const AWARD_CATEGORIES: AwardCategory[] = (awardsData as any).categories.map((c:any)=>({...c, icon:TrophyIcon}))

async function getAwardStats(awardType: string): Promise<AwardStats> {
  let allGames:any[]=[]; let page=0; const pageSize=1000
  while(true){
    const supabase = await getSupabaseServerClient()
    const { data: games, error } = await supabase.from('games').select('honors').not('honors','eq','[]').range(page*pageSize,(page+1)*pageSize-1)
    if(error) break
    if(!games||games.length===0) break
    allGames=allGames.concat(games)
    if(games.length<pageSize) break; page++
  }
  const years=new Set<number>(); let winners=0; let nominees=0
  allGames.forEach(g=>{ (g.honors||[]).filter((h:any)=>h.award_type===awardType).forEach((h:any)=>{ years.add(h.year); if(h.category==='Winner') winners++; else if(h.category==='Nominee') nominees++; }) })
  const arr=Array.from(years).sort((a,b)=>a-b); const span=arr.length?`${arr[0]} - ${arr[arr.length-1]}`:''
  return { totalGames:winners+nominees, totalWinners:winners, totalNominees:nominees, yearSpan:span }
}

export default async function IndustryAwardsFullPage(){
  const awardTypeMap:Record<string,string> = (awardsData as any).awardTypeMap
  const stats = await Promise.all(AWARD_CATEGORIES.map((c:AwardCategory)=>getAwardStats(awardTypeMap[c.id])))
  return (
    <PageLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">

       {/* Back to Awards */}
        <div className="mb-6 flex items-center gap-3">
          <Link href="/awards" className="text-xs inline-flex items-center gap-1">
            <ChevronLeftIcon className="w-4 h-4" /> Back
          </Link>
        </div>

        {/* Industry Awards Table */}
        <IndustryAwards categories={AWARD_CATEGORIES.map(({icon, ...r}:AwardCategory)=>r)} stats={stats} preview={false} />
     
      </div>
    </PageLayout>
  )
}