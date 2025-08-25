import PageLayout from '@/components/PageLayout'
import Link from 'next/link'
import { TrophyIcon, CalendarIcon, UserGroupIcon, StarIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase'

// Award categories with their metadata
const AWARD_CATEGORIES = [
  {
    id: 'golden-geek',
    name: 'Golden Geek Awards',
    description: 'Annual awards voted by the BoardGameGeek community, recognizing excellence across multiple categories including Game of the Year, Best Strategy Game, and more.',
    icon: TrophyIcon,
    color: 'amber',
    backgroundColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    iconColor: 'text-amber-600',
    website: 'https://boardgamegeek.com/boardgamehonor/32396/golden-geek-awards'
  },
  {
    id: 'spiel-des-jahres',
    name: 'Spiel des Jahres',
    description: 'The prestigious German "Game of the Year" award, considered the Oscar of board gaming. Awarded annually since 1979.',
    icon: TrophyIcon,
    color: 'yellow',
    backgroundColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    iconColor: 'text-yellow-600',
    website: 'https://www.spiel-des-jahres.de/'
  },
  {
    id: 'kinderspiel-des-jahres',
    name: 'Kinderspiel des Jahres',
    description: 'The German "Children\'s Game of the Year" award, recognizing the best family-friendly games. Part of the Spiel des Jahres family since 2001.',
    icon: TrophyIcon,
    color: 'green',
    backgroundColor: 'bg-green-50',
    borderColor: 'border-green-200',
    iconColor: 'text-green-600',
    website: 'https://www.spiel-des-jahres.de/'
  },
  {
    id: 'kennerspiel-des-jahres',
    name: 'Kennerspiel des Jahres',
    description: 'The German "Connoisseur Game of the Year" award for more complex games. Established in 2011 for experienced gamers.',
    icon: TrophyIcon,
    color: 'blue',
    backgroundColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    iconColor: 'text-blue-600',
    website: 'https://www.spiel-des-jahres.de/'
  }
];

// Debug helper: build per-year breakdown for an award type
async function getAwardYearBreakdown(awardType: string) {
  // Get all games with pagination to avoid 1000 record limit
  let allGames: any[] = [];
  let page = 0;
  const pageSize = 1000;
  
  while (true) {
    const { data: games, error } = await supabase
      .from('games')
      .select('name, honors')
      .not('honors', 'eq', '[]')
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error('Error fetching year breakdown:', error);
      break;
    }
    
    if (!games || games.length === 0) break;
    allGames = allGames.concat(games);
    if (games.length < pageSize) break; // Last page
    page++;
  }

  const yearMap = new Map<number, { winners: string[]; nominees: string[]; special: string[] }>();
  allGames.forEach(g => {
    (g.honors || []).filter((h: any) => h.award_type === awardType).forEach((h: any) => {
      if (typeof h.year !== 'number') return;
      if (!yearMap.has(h.year)) yearMap.set(h.year, { winners: [], nominees: [], special: [] });
      const bucket = yearMap.get(h.year)!;
      if (h.category === 'Winner') {
        if (!bucket.winners.includes(g.name)) bucket.winners.push(g.name);
      } else if (h.category === 'Nominee') {
        if (!bucket.nominees.includes(g.name)) bucket.nominees.push(g.name);
      } else if (h.category === 'Special') {
        if (!bucket.special.includes(g.name)) bucket.special.push(g.name);
      }
    });
  });
  return Array.from(yearMap.entries())
    .map(([year, v]) => ({ year, ...v }))
    .sort((a, b) => b.year - a.year);
}

interface AwardStats {
  totalGames: number;
  totalWinners: number;
  totalNominees: number;
  yearSpan: string;
}

async function getAwardStats(awardType: string): Promise<AwardStats> {
  // Get all games with pagination to avoid 1000 record limit
  let allGames: any[] = [];
  let page = 0;
  const pageSize = 1000;
  
  while (true) {
    const { data: games, error } = await supabase
      .from('games')
      .select('honors')
      .not('honors', 'eq', '[]')
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error('Error fetching award stats:', error);
      break;
    }
    
    if (!games || games.length === 0) break;
    allGames = allGames.concat(games);
    if (games.length < pageSize) break; // Last page
    page++;
  }

  const years = new Set<number>();
  let winners = 0;
  let nominees = 0;

  allGames.forEach((game: any) => {
    const relevantHonors = game.honors.filter((honor: any) => 
      honor.award_type === awardType
    );

    relevantHonors.forEach((honor: any) => {
      years.add(honor.year);
      if (honor.category === 'Winner') winners++;
      else if (honor.category === 'Nominee') nominees++;
    });
  });

  const yearArray = Array.from(years).sort((a, b) => a - b);
  const yearSpan = yearArray.length > 0 
    ? `${yearArray[0]} - ${yearArray[yearArray.length - 1]}`
    : '';

  return {
    totalGames: winners + nominees,
    totalWinners: winners,
    totalNominees: nominees,
    yearSpan
  };
}

function AwardCategoryCard({ category, stats }: { 
  category: typeof AWARD_CATEGORIES[0], 
  stats: AwardStats 
}) {
  const IconComponent = category.icon;

  return (
    <Link 
      href={`/awards/${category.id}`}
      className={`
        block p-6 rounded-xl border-2 transition-all duration-200
        hover:shadow-lg hover:scale-105 group
        ${category.backgroundColor} ${category.borderColor}
      `}
    >
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <div className={`p-3 rounded-lg ${category.backgroundColor} border ${category.borderColor}`}>
          <IconComponent className={`w-6 h-6 ${category.iconColor}`} />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 group-hover:text-gray-700 mb-1">
            {category.name}
          </h3>
          {stats.yearSpan && (
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <CalendarIcon className="w-4 h-4" />
              {stats.yearSpan}
            </p>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-600 mb-4 leading-relaxed">
        {category.description}
      </p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">{stats.totalWinners}</div>
          <div className="text-xs text-gray-500">Winners</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">{stats.totalNominees}</div>
          <div className="text-xs text-gray-500">Nominees</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">{stats.totalGames}</div>
          <div className="text-xs text-gray-500">Total Games</div>
        </div>
      </div>

      {/* View arrow */}
      <div className="mt-4 text-right">
        <span className={`text-sm font-medium ${category.iconColor} group-hover:underline`}>
          View Awards →
        </span>
      </div>
    </Link>
  );
}

export default async function AwardsPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  // Map award IDs to database award_type values
  const awardTypeMap: Record<string, string> = {
    'golden-geek': 'Golden Geek Awards',
    'spiel-des-jahres': 'Spiel des Jahres',
    'kinderspiel-des-jahres': 'Kinderspiel des Jahres', 
    'kennerspiel-des-jahres': 'Kennerspiel des Jahres'
  };

  // Get stats for each award category
  const statsPromises = AWARD_CATEGORIES.map(category => 
    getAwardStats(awardTypeMap[category.id])
  );
  const allStats = await Promise.all(statsPromises);

  const debugEnabled = params?.debug === '1' || params?.debug === 'true';
  let debugData: Array<{
    id: string;
    name: string;
    awardType: string;
    years: Array<{ year: number; winners: string[]; nominees: string[]; special: string[] }>
  }> = [];
  if (debugEnabled) {
    // Fetch detailed year breakdowns in parallel
    const yearBreakdowns = await Promise.all(
      AWARD_CATEGORIES.map(c => getAwardYearBreakdown(awardTypeMap[c.id]))
    );
    debugData = AWARD_CATEGORIES.map((c, idx) => ({
      id: c.id,
      name: c.name,
      awardType: awardTypeMap[c.id],
      years: yearBreakdowns[idx]
    }));
  }

  return (
    <PageLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-4 rounded-full bg-yellow-100">
              <TrophyIcon className="w-10 h-10 text-yellow-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Board Game Awards
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
            Explore prestigious board game awards from around the world. Discover winners and nominees 
            across multiple categories and years.
          </p>
          
          {/* Overall stats */}
          <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <TrophyIcon className="w-4 h-4" />
              {AWARD_CATEGORIES.length} Award Categories
            </div>
            <div className="flex items-center gap-2">
              <StarIcon className="w-4 h-4" />
              {allStats.reduce((sum, stats) => sum + stats.totalGames, 0)} Total Games
            </div>
            <div className="flex items-center gap-2">
              <UserGroupIcon className="w-4 h-4" />
              Multiple Award Bodies
            </div>
          </div>
        </div>

        {/* Award Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {AWARD_CATEGORIES.map((category, index) => (
            <AwardCategoryCard 
              key={category.id} 
              category={category} 
              stats={allStats[index]} 
            />
          ))}
        </div>

        {/* Footer info */}
        <div className="mt-12 text-center">
          <div className="max-w-3xl mx-auto p-6 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              About These Awards
            </h3>
            <p className="text-gray-600 leading-relaxed">
              These awards represent some of the most prestigious recognitions in board gaming. 
              From the industry-standard Spiel des Jahres to community-driven Golden Geek Awards, 
              each category highlights excellence in game design, innovation, and player experience.
            </p>
          </div>
        </div>

        {debugEnabled && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ChevronDownIcon className="w-6 h-6 text-gray-500" /> Debug: Raw Award Data
            </h2>
            <p className="text-sm text-gray-500 mb-6">Showing per-year breakdown sourced directly from games.honors. Duplicate game appearances in multiple categories are shown unless de-duplicated in import logic.</p>
            <div className="space-y-10 text-left">
              {debugData.map(block => (
                <div key={block.id} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{block.name} <span className="text-sm text-gray-400">({block.awardType})</span></h3>
                  {block.years.length === 0 && (
                    <p className="text-sm text-red-500">No honors found.</p>
                  )}
                  <div className="max-h-96 overflow-auto pr-2 space-y-4 text-sm">
                    {block.years.map(y => (
                      <div key={y.year} className="border-b last:border-b-0 pb-3">
                        <div className="font-medium text-gray-700 mb-1">{y.year}</div>
                        <div className="grid gap-2 md:grid-cols-3">
                          <div>
                            <div className="text-yellow-700 font-semibold">Winners ({y.winners.length})</div>
                            <ul className="list-disc ml-4 text-gray-600 space-y-0.5">
                              {y.winners.slice(0,8).map(n => <li key={n}>{n}</li>)}
                              {y.winners.length > 8 && <li className="italic text-gray-400">+{y.winners.length - 8} more</li>}
                            </ul>
                          </div>
                          <div>
                            <div className="text-gray-700 font-semibold">Nominees ({y.nominees.length})</div>
                            <ul className="list-disc ml-4 text-gray-600 space-y-0.5">
                              {y.nominees.slice(0,8).map(n => <li key={n}>{n}</li>)}
                              {y.nominees.length > 8 && <li className="italic text-gray-400">+{y.nominees.length - 8} more</li>}
                            </ul>
                          </div>
                          <div>
                            <div className="text-blue-700 font-semibold">Special / Recommended ({y.special.length})</div>
                            <ul className="list-disc ml-4 text-gray-600 space-y-0.5">
                              {y.special.slice(0,8).map(n => <li key={n}>{n}</li>)}
                              {y.special.length > 8 && <li className="italic text-gray-400">+{y.special.length - 8} more</li>}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 text-xs text-gray-400">Debug mode active via ?debug=1</div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
