import { Suspense } from 'react';
export const revalidate = 0; // ensure fresh data while debugging honor enrichment
import { supabase } from '@/lib/supabase';
import { inferHonorCategory } from '@/utils/honors';
import { TrophyIcon, CalendarIcon, UserGroupIcon, StarIcon } from '@heroicons/react/24/outline';
import GameCard from '@/components/GameCard';
import PageLayout from '@/components/PageLayout';

// Award category configurations
const AWARD_CATEGORIES = {
  'golden-geek': {
    id: 'golden-geek',
    name: 'Golden Geek Awards',
    description: 'Annual awards voted by the BoardGameGeek community, recognizing excellence across multiple categories.',
    icon: TrophyIcon,
    color: 'amber',
    website: 'https://boardgamegeek.com/boardgamehonor/32396/golden-geek-awards'
  },
  'spiel-des-jahres': {
    id: 'spiel-des-jahres',
    name: 'Spiel des Jahres',
    description: 'The prestigious German "Game of the Year" award, considered the Oscar of board gaming.',
    icon: TrophyIcon,
    color: 'yellow',
    website: 'https://www.spiel-des-jahres.de/'
  },
  'kinderspiel-des-jahres': {
    id: 'kinderspiel-des-jahres',
    name: 'Kinderspiel des Jahres',
    description: 'The German "Children\'s Game of the Year" award, recognizing the best family-friendly games.',
    icon: TrophyIcon,
    color: 'green',
    website: 'https://www.spiel-des-jahres.de/'
  },
  'kennerspiel-des-jahres': {
    id: 'kennerspiel-des-jahres', 
    name: 'Kennerspiel des Jahres',
    description: 'The German "Connoisseur Game of the Year" award for more complex games.',
    icon: TrophyIcon,
    color: 'blue',
    website: 'https://www.spiel-des-jahres.de/'
  }
};

interface Honor {
  name: string;
  year: number;
  category: 'Winner' | 'Nominee' | 'Special';
  award_type: string;
  title?: string;
  position?: string;
  description?: string;
  subcategory?: string;
  primary_winner?: boolean;
  // Optional raw / enrichment fields (present in normalized honor JSON)
  slug?: string;
  result_raw?: string | null;
  derived_result?: string | null;
  honor_id?: string;
}
interface Game {
  bgg_id: number;
  name: string;
  year_published: number;
  image_url?: string;
  thumbnail_url?: string;
  honors: Honor[];
}

interface AwardYearGroup {
  year: number;
  primary: { game: Game; honor: Honor } | null;
  categoryWinners: Array<{ subcategory: string; game: Game; honor: Honor }>;
  nominees: Game[];
  special: Game[];
  // Add support for categorized structure
  categories?: Array<{
    name: string;
    winner: Game | null;
    nominees: Game[];
    special: Game[];
  }>;
}

async function getAwardData(awardType: string): Promise<AwardYearGroup[]> {
  // Get all games with pagination to avoid 1000 record limit
  let allGames: Game[] = [];
  let page = 0;
  const pageSize = 1000;
  
  while (true) {
    const { data: games, error } = await supabase
      .from('games')
      .select('bgg_id, name, year_published, image_url, thumbnail_url, honors')
      .not('honors', 'eq', '[]')
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error('Error fetching award data:', error);
      break;
    }
    
    if (!games || games.length === 0) break;
    allGames = allGames.concat(games as Game[]);
    if (games.length < pageSize) break; // Last page
    page++;
  }

  // Check if this award type has categories by looking for position-based awards
  const relevantHonors = allGames.flatMap(game => 
    (game.honors || []).filter(h => h.award_type === awardType)
  );
  
  const hasCategories = relevantHonors.some(h => 
    h.position && h.position !== h.award_type && 
    (h.position.includes('Best ') || h.position.includes('Game of the'))
  );

  console.log(`Award type "${awardType}" has categories:`, hasCategories);

  /*
   * De-duplicate multiple honor entries for same (game, year, awardType) with precedence:
   * Winner > Nominee > Special. Keeps only the highest category per game per year.
   * Also filter out fake "games" that are actually award category names.
   */
  const yearMap = new Map<number, AwardYearGroup>();

  allGames
    .filter(game => {
      // Filter out award category names that were incorrectly imported as "games"
      const name = game.name.toLowerCase();
      // heuristics strengthened for Golden Geek placeholder rows like:
      // "Golden Geek Best Print and Play Board Game" (no real game image/year)
      const looksGoldenGeekCategory = /^golden geek best /.test(name) && (
        name.endsWith(' board game') || name.endsWith(' game') || name.includes('print and play')
      );
      const truncatedSuffix = /( no$| wi$)/.test(name); // from slug truncation (No / Wi)
      const matchesHonorPosition = (game.honors || []).some(h => h.position && h.position.toLowerCase() === game.name.toLowerCase());
      const missingRealGameSignals = !game.year_published && !game.image_url && !game.thumbnail_url;

      const isAwardName = 
        name.includes('recommended') ||
        name.includes('award') ||
        name.includes('nominee') ||
        name.includes('winner') ||
  name.startsWith('charles s roberts best ') ||
        // truncated forms
  name.endsWith('winn') || name.endsWith('winne') || name.includes('winn ') ||
  name.includes('nomin') || name.endsWith('nom') || name.endsWith('nomi') ||
        name.includes('spiel des jahres') ||
        name.includes('dragon awards') ||
        name.includes('hit fur') ||
        name.includes('hit für') ||
        looksGoldenGeekCategory ||
        (looksGoldenGeekCategory && truncatedSuffix) ||
        (matchesHonorPosition && missingRealGameSignals) ||
        (!game.year_published && (
          name.includes('spiel') || 
          name.includes('award') || 
          name.includes('prize')
        ));
      return !isAwardName;
    })
    .forEach((game: Game) => {
    (game.honors || [])
      .filter(h => h.award_type === awardType && typeof h.year === 'number')
      .forEach(h => {
        // Normalize / repair category in-memory without mutating stored data permanently
        // For Golden Geek, pass game count context to help with truncated winner detection
        const gameCountInCategory = allGames.filter(g => 
          (g.honors || []).some(gh => 
            gh.honor_id === h.honor_id && 
            gh.position === h.position && 
            gh.year === h.year
          )
        ).length;
        
        const effectiveCategory = inferHonorCategory(h, { gameCount: gameCountInCategory });
        // If the stored category was downgraded to Special due to truncation, use inferred
        if (h.category !== effectiveCategory) {
          // Create a shallow mutation for runtime only
          (h as any)._originalCategory = h.category;
          h.category = effectiveCategory;
        }
        if (!yearMap.has(h.year)) {
          yearMap.set(h.year, { year: h.year, primary: null, categoryWinners: [], nominees: [], special: [] });
        }
        const bucket = yearMap.get(h.year)!;
        
        if (hasCategories) {
          // For categorized awards (like Golden Geek), group by position/category
          const categoryName = h.position?.replace(new RegExp(`^${awardType.replace('Awards', '').trim()} ?`), '') || 'Unknown Category';
          
          // Initialize categories map if needed
          if (!bucket.categories) {
            bucket.categories = [];
          }
          
          // Find or create category
          let category = bucket.categories.find(c => c.name === categoryName);
          if (!category) {
            category = {
              name: categoryName,
              winner: null,
              nominees: [],
              special: []
            };
            bucket.categories.push(category);
          }
          
          // Add game to appropriate section within the category
          if (h.category === 'Winner') {
            category.winner = game;
          } else if (h.category === 'Nominee') {
            if (!category.nominees.find(g => g.bgg_id === game.bgg_id)) {
              category.nominees.push(game);
            }
          } else if (h.category === 'Special') {
            if (!category.special.find(g => g.bgg_id === game.bgg_id)) {
              category.special.push(game);
            }
          }
        } else {
          // For simple awards (like Spiel des Jahres), use traditional structure
          if (h.category === 'Winner') {
            // Check if this is the main winner (no subcategory) or a category winner
            if (!h.subcategory || h.subcategory === 'Overall' || h.subcategory === 'Game of the Year') {
              if (!bucket.primary) bucket.primary = { game, honor: h };
              else bucket.categoryWinners.push({ subcategory: h.subcategory || 'Overall', game, honor: h });
            } else {
              bucket.categoryWinners.push({ subcategory: h.subcategory, game, honor: h });
            }
          } else if (h.category === 'Nominee') {
            if (!bucket.nominees.find(g => g.bgg_id === game.bgg_id)) {
              bucket.nominees.push(game);
            }
          } else if (h.category === 'Special') {
            if (!bucket.special.find(g => g.bgg_id === game.bgg_id)) {
              bucket.special.push(game);
            }
          }
        }
      });
  });

  const years: AwardYearGroup[] = Array.from(yearMap.values()).sort((a, b) => b.year - a.year);
  // De-duplicate nominees & specials (a game may appear multiple honors same year)
  years.forEach(y => {
    const dedupe = (arr: Game[]) => Array.from(new Map(arr.map(g => [g.bgg_id, g])).values());
    y.nominees = dedupe(y.nominees).sort((a, b) => a.name.localeCompare(b.name));
    y.special = dedupe(y.special).sort((a, b) => a.name.localeCompare(b.name));
    // Sort category winners by subcategory then name
    y.categoryWinners.sort((a, b) => (a.subcategory.localeCompare(b.subcategory)) || a.game.name.localeCompare(b.game.name));
    
    // Sort categories if present
    if (y.categories) {
      y.categories.sort((a, b) => a.name.localeCompare(b.name));
      y.categories.forEach(cat => {
        cat.nominees.sort((a, b) => a.name.localeCompare(b.name));
        cat.special.sort((a, b) => a.name.localeCompare(b.name));
      });
    }
  });
  return years;
}

// Helper to adapt awards Game type to GameCard expected shape
function toGameWithRanking(g: Game) {
  return {
    ...g,
    id: String(g.bgg_id), // fabricate stable id from bgg_id for GameCard
    ranking: null,
    list_membership: { library: false, wishlist: false }
  } as any;
}

function YearSection({ yearData, awardType }: { yearData: AwardYearGroup; awardType: string }) {
  const specialDisplayLabel = /Spiel des Jahres|Kennerspiel des Jahres/i.test(awardType) ? 'Recommended' : 'Special';
  const multiEqual = /(Mensa Select|Meeples Choice Award)/i.test(awardType);
  
  // Check if this is a categorized award structure
  const hasCategories = yearData.categories && yearData.categories.length > 0;
  
  return (
    <div className="border-b border-gray-200 pb-8 mb-8 last:border-b-0">
      {/* Year header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-gray-500" />
          <h2 className="text-2xl font-bold text-gray-900">{yearData.year}</h2>
        </div>
        <div className="text-sm text-gray-500">
          {hasCategories ? (
            <>
              {yearData.categories!.length} categor{yearData.categories!.length !== 1 ? 'ies' : 'y'}
              {yearData.categories!.reduce((sum, cat) => sum + cat.nominees.length, 0) > 0 && 
                `, ${yearData.categories!.reduce((sum, cat) => sum + cat.nominees.length, 0)} nominee${yearData.categories!.reduce((sum, cat) => sum + cat.nominees.length, 0) !== 1 ? 's' : ''}`}
              {yearData.categories!.reduce((sum, cat) => sum + cat.special.length, 0) > 0 && 
                `, ${yearData.categories!.reduce((sum, cat) => sum + cat.special.length, 0)} ${specialDisplayLabel.toLowerCase()}`}
            </>
          ) : (
            <>
              {yearData.primary ? 1 : 0} primary
              {yearData.categoryWinners.length > 0 && `, ${yearData.categoryWinners.length} category winner${yearData.categoryWinners.length !== 1 ? 's' : ''}`}
              {multiEqual && yearData.primary && yearData.primary.honor && yearData.primary.honor.award_type.match(/Mensa Select|Meeples Choice/ ) && ' (multi-equal)'}
              {yearData.nominees.length > 0 && `, ${yearData.nominees.length} nominee${yearData.nominees.length !== 1 ? 's' : ''}`}
              {yearData.special.length > 0 && `, ${yearData.special.length} ${specialDisplayLabel.toLowerCase()}`}
            </>
          )}
        </div>
      </div>

      {hasCategories ? (
        /* Categorized Awards (like Golden Geek) */
        yearData.categories!.map(category => (
          <div key={category.name} className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrophyIcon className="w-5 h-5 text-yellow-500" />
              {category.name}
            </h3>
            
            {/* Winner in this category */}
            {category.winner && (
              <div className="mb-4">
                <h4 className="text-md font-medium text-gray-800 mb-2">Winner</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  <GameCard game={toGameWithRanking(category.winner)} viewMode="grid" />
                </div>
              </div>
            )}
            
            {/* Nominees in this category */}
            {category.nominees.length > 0 && (
              <div className="mb-4">
                <h4 className="text-md font-medium text-gray-700 mb-2">Nominees</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {category.nominees.map(game => (
                    <GameCard key={`${game.bgg_id}-nominee`} game={toGameWithRanking(game)} viewMode="grid" />
                  ))}
                </div>
              </div>
            )}
            
            {/* Special in this category */}
            {category.special.length > 0 && (
              <div className="mb-4">
                <h4 className="text-md font-medium text-gray-600 mb-2">{specialDisplayLabel}</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {category.special.map(game => (
                    <GameCard key={`${game.bgg_id}-special`} game={toGameWithRanking(game)} viewMode="grid" />
                  ))}
                </div>
              </div>
            )}
          </div>
        ))
      ) : (
        /* Simple Awards (like Spiel des Jahres) */
        <>
          {/* Primary Winner */}
          {yearData.primary && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrophyIcon className="w-5 h-5 text-yellow-500" />
                Primary Winner
                {yearData.primary.honor.subcategory && yearData.primary.honor.subcategory !== 'Overall' && (
                  <span className="text-xs font-medium bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">{yearData.primary.honor.subcategory}</span>
                )}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <GameCard game={toGameWithRanking(yearData.primary.game)} viewMode="grid" />
              </div>
            </div>
          )}

          {/* Category Winners */}
          {yearData.categoryWinners.length > 0 && (
            <div className="mb-8">
              <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <TrophyIcon className="w-4 h-4 text-yellow-400" />
                Category Winners
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {yearData.categoryWinners.map(entry => (
                  <div key={`${entry.game.bgg_id}-${entry.subcategory}`} className="relative">
                    {entry.subcategory && (
                      <div className="absolute top-2 left-2 z-10">
                        <div className="bg-gray-900/70 text-xs text-white px-2 py-0.5 rounded-full">
                          {entry.subcategory}
                        </div>
                      </div>
                    )}
                    <GameCard game={toGameWithRanking(entry.game)} viewMode="grid" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nominees */}
          {yearData.nominees.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <UserGroupIcon className="w-5 h-5 text-gray-500" />
                Nominee{yearData.nominees.length !== 1 ? 's' : ''}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {yearData.nominees.map(game => (
                  <GameCard key={`${game.bgg_id}-nominee`} game={toGameWithRanking(game)} viewMode="grid" />
                ))}
              </div>
            </div>
          )}

          {/* Recommended/Special */}
          {yearData.special.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-600 mb-4 flex items-center gap-2">
                <StarIcon className="w-5 h-5 text-blue-500" />
                {specialDisplayLabel}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {yearData.special.map(game => (
                  <GameCard key={`${game.bgg_id}-special`} game={toGameWithRanking(game)} viewMode="grid" />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default async function AwardPage({ params }: { params: Promise<{ award: string }> }) {
  const { award } = await params;
  const awardConfig = AWARD_CATEGORIES[award as keyof typeof AWARD_CATEGORIES];
  
  if (!awardConfig) {
    return (
      <PageLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900">Award Not Found</h1>
          <p className="text-gray-600 mt-2">The award category you're looking for doesn't exist.</p>
        </div>
      </PageLayout>
    );
  }

  // Map award page slugs to database award_type values
  const awardTypeMap: Record<string, string> = {
    'golden-geek': 'Golden Geek Awards',
    'spiel-des-jahres': 'Spiel des Jahres',
    'kinderspiel-des-jahres': 'Kinderspiel des Jahres',
    'kennerspiel-des-jahres': 'Kennerspiel des Jahres'
  };

  const awardType = awardTypeMap[award];
  
  // Use unified data fetching for all awards
  const awardData = await getAwardData(awardType);

  const IconComponent = awardConfig.icon;

  return (
    <PageLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className={`p-4 rounded-full ${
              awardConfig.color === 'amber' ? 'bg-amber-100' :
              awardConfig.color === 'yellow' ? 'bg-yellow-100' :
              awardConfig.color === 'green' ? 'bg-green-100' :
              'bg-blue-100'
            }`}>
              <IconComponent className={`w-10 h-10 ${
                awardConfig.color === 'amber' ? 'text-amber-600' :
                awardConfig.color === 'yellow' ? 'text-yellow-600' :
                awardConfig.color === 'green' ? 'text-green-600' :
                'text-blue-600'
              }`} />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {awardConfig.name}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
            {awardConfig.description}
          </p>
          
          {/* Stats */}
          <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              {awardData.length} Years
            </div>
            <div className="flex items-center gap-2">
              <TrophyIcon className="w-4 h-4" />
              {awardData.reduce((sum, y) => sum + (y.primary ? 1 : 0) + y.categoryWinners.length, 0)} Winners
            </div>
            <div className="flex items-center gap-2">
              <UserGroupIcon className="w-4 h-4" />
              {awardData.reduce((sum, year) => sum + year.nominees.length + year.special.length, 0)} Other Recognitions
            </div>
          </div>
        </div>

        {/* Award data by year */}
        <div className="space-y-8">
          {awardData.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No award data available for this category yet.</p>
            </div>
          ) : (
            awardData.map(yearData => (
              <YearSection key={yearData.year} yearData={yearData} awardType={awardType} />
            ))
          )}
        </div>
      </div>
    </PageLayout>
  );
}
