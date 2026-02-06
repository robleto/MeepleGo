export const revalidate = 0 // ensure fresh data while debugging honor enrichment
import { getSupabaseServerClient } from '@/lib/supabaseServer'
import { inferHonorCategory } from '@/utils/honors'
import {
  TrophyIcon,
  CalendarIcon,
  UserGroupIcon,
  StarIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline'
import AwardCategoryPanel from '@/components/Components/Awards/AwardCategoryPanel'
import Heading from '@/components/Components/Heading'
import PageLayout from '@/components/Components/PageLayout'

// Award category configurations
const AWARD_CATEGORIES = {
  'golden-geek': {
    id: 'golden-geek',
    name: 'Golden Geek Awards',
    description:
      'Annual awards voted by the BoardGameGeek community, recognizing excellence across multiple categories.',
    icon: TrophyIcon,
    color: 'amber',
    website:
      'https://boardgamegeek.com/boardgamehonor/32396/golden-geek-awards',
  },
  'spiel-des-jahres': {
    id: 'spiel-des-jahres',
    name: 'Spiel des Jahres',
    description:
      'The prestigious German "Game of the Year" award, considered the Oscar of board gaming.',
    icon: TrophyIcon,
    color: 'yellow',
    website: 'https://www.spiel-des-jahres.de/',
  },
  'kinderspiel-des-jahres': {
    id: 'kinderspiel-des-jahres',
    name: 'Kinderspiel des Jahres',
    description:
      'The German "Children\'s Game of the Year" award, recognizing the best family-friendly games.',
    icon: TrophyIcon,
    color: 'green',
    website: 'https://www.spiel-des-jahres.de/',
  },
  'kennerspiel-des-jahres': {
    id: 'kennerspiel-des-jahres',
    name: 'Kennerspiel des Jahres',
    description:
      'The German "Connoisseur Game of the Year" award for more complex games.',
    icon: TrophyIcon,
    color: 'blue',
    website: 'https://www.spiel-des-jahres.de/',
  },
  'deutscher-spiele-preis': {
    id: 'deutscher-spiele-preis',
    name: 'Deutscher Spiele Preis',
    description:
      "Prominent German gamers' award emphasizing gamer opinion and depth.",
    icon: TrophyIcon,
    color: 'rose',
    website: 'https://www.dspielt.de/',
  },
  'origins-awards': {
    id: 'origins-awards',
    name: 'Origins Awards',
    description:
      'Historical industry awards from the Game Manufacturers Association (GAMA).',
    icon: TrophyIcon,
    color: 'violet',
    website: 'https://www.originsgamefair.com/',
  },
  'dice-tower-awards': {
    id: 'dice-tower-awards',
    name: 'The Dice Tower Gaming Awards',
    description:
      'Annual Dice Tower network selections across multiple categories.',
    icon: TrophyIcon,
    color: 'fuchsia',
    website: 'https://www.dicetower.com/awards',
  },
  'as-dor': {
    id: 'as-dor',
    name: "As d'Or",
    description: "French Game of the Year awards (Jeu de l'Année).",
    icon: TrophyIcon,
    color: 'orange',
    website: 'https://www.fij.fr/',
  },
  'international-gamers-award': {
    id: 'international-gamers-award',
    name: 'International Gamers Award',
    description:
      'Global strategy game recognition spanning multiplayer and two-player titles.',
    icon: TrophyIcon,
    color: 'cyan',
    website: 'https://www.internationalgamersaward.net/',
  },
  'ion-award': {
    id: 'ion-award',
    name: 'Ion Award',
    description:
      'Game design competition highlighting prototypes and emerging designers.',
    icon: TrophyIcon,
    color: 'emerald',
    website: 'https://saltcon.com/ion-award/',
  },
  'zenobia-award': {
    id: 'zenobia-award',
    name: 'Zenobia Award',
    description: 'Award encouraging diverse voices in historical game design.',
    icon: TrophyIcon,
    color: 'teal',
    website: 'https://zenobiaaward.org/',
  },
  'charles-s-roberts': {
    id: 'charles-s-roberts',
    name: 'Charles S. Roberts Award',
    description:
      'Historic recognition for excellence in wargame design & publication.',
    icon: TrophyIcon,
    color: 'slate',
    website: 'https://charlieawards.com/',
  },
  sxsw: {
    id: 'sxsw',
    name: 'SXSW',
    description:
      'South by Southwest tabletop game of the year & related honors.',
    icon: TrophyIcon,
    color: 'pink',
    website: 'https://www.sxsw.com/',
  },
  'board-game-quest': {
    id: 'board-game-quest',
    name: 'Board Game Quest',
    description: 'Board Game Quest Awards across production, strategy & more.',
    icon: TrophyIcon,
    color: 'indigo',
    website: 'https://www.boardgamequest.com/',
  },
  'juego-del-ano': {
    id: 'juego-del-ano',
    name: 'Juego del Año',
    description:
      'Spanish-language (Mexico / Tico) Game of the Year recognitions.',
    icon: TrophyIcon,
    color: 'amber',
    website: 'https://juegodelano.mx/',
  },
  'parents-choice': {
    id: 'parents-choice',
    name: "Parents' Choice Approved",
    description: 'Parents Choice award winners & approved recommendations.',
    icon: TrophyIcon,
    color: 'lime',
    website: 'https://www.parentschoice.org/',
  },
  guldbrikken: {
    id: 'guldbrikken',
    name: 'Guldbrikken',
    description: 'Danish awards (children, family, adult & special jury).',
    icon: TrophyIcon,
    color: 'yellow',
    website: 'https://www.guldbrikken.dk/',
  },
}

interface Honor {
  name: string
  year: number
  category: 'Winner' | 'Nominee' | 'Special'
  award_type: string
  title?: string
  position?: string
  description?: string
  subcategory?: string
  primary_winner?: boolean
  // Optional raw / enrichment fields (present in normalized honor JSON)
  slug?: string
  result_raw?: string | null
  derived_result?: string | null
  honor_id?: string
}
interface Game {
  bgg_id: number
  name: string
  year_published: number
  image_url?: string
  thumbnail_url?: string
  honors: Honor[]
}

interface AwardYearGroup {
  year: number
  primary: { game: Game; honor: Honor } | null
  categoryWinners: Array<{ subcategory: string; game: Game; honor: Honor }>
  nominees: Game[]
  special: Game[]
  // Add support for categorized structure
  categories?: Array<{
    name: string
    winner: Game | null
    nominees: Game[]
    special: Game[]
  }>
}

async function getAwardData(awardType: string): Promise<AwardYearGroup[]> {
  const supabase = await getSupabaseServerClient()

  try {
    // Create a pattern to match the award_set values
    let searchPattern = awardType

    // Handle special cases for pattern matching
    if (awardType === 'Golden Geek Awards') {
      searchPattern = '%Golden Geek%'
    } else if (awardType === 'Charles S. Roberts') {
      searchPattern = '%Charles S. Roberts%'
    } else if (awardType === 'Spiel des Jahres') {
      searchPattern = '%Spiel des Jahres%'
    } else if (awardType === 'Kinderspiel des Jahres') {
      searchPattern = '%Kinderspiel des Jahres%'
    } else if (awardType === 'Kennerspiel des Jahres') {
      searchPattern = '%Kennerspiel des Jahres%'
    } else if (awardType === 'Deutscher Spiele Preis') {
      searchPattern = '%Deutscher Spiele Preis%'
    } else if (awardType === 'Origins Awards') {
      searchPattern = '%Origins%'
    } else if (awardType === 'The Dice Tower Gaming Awards') {
      searchPattern = '%Dice Tower%'
    } else if (awardType === "As d'Or - Jeu de l'Année") {
      searchPattern = "%As d'Or%"
    } else if (awardType === 'Board Game Quest Awards') {
      searchPattern = '%Board Game Quest%'
    } else if (awardType === 'Parents Choice') {
      // Match with or without apostrophe in award_set
      searchPattern = '%Parents%Choice%'
    } else if (awardType === 'Juego del Año') {
      // Avoid strict diacritics matching in ilike pattern
      searchPattern = '%Juego del A%'
    } else {
      // For other awards, try to match the first part of the name
      const mainName = awardType.split(' ')[0]
      searchPattern = `%${mainName}%`
    }

    // Get awards with boardgames JSONB data from industry_awards table
    const { data: awards, error } = await supabase
      .from('industry_awards')
      .select(
        `
        id,
        year,
        award_set,
        category,
        status,
        boardgames
      `
      )
      .ilike('award_set', searchPattern)
      .order('year', { ascending: false })

    if (error) {
      console.warn('Warning: error fetching award data', { message: (error as any)?.message })
      return []
    }

    if (!awards || awards.length === 0) {
      return []
    }

    // Extract all unique BGG IDs from all awards to fetch game data in one query
    // Support both bggId and bgg_id keys from JSONB
    const allBggIds = new Set<number>()
    awards.forEach((award: any) => {
      const boardgames = award.boardgames || []
      boardgames.forEach((boardgame: any) => {
        const bggId =
          typeof boardgame.bggId === 'number'
            ? boardgame.bggId
            : typeof boardgame.bgg_id === 'number'
              ? boardgame.bgg_id
              : undefined
        if (typeof bggId === 'number') allBggIds.add(bggId)
      })
    })

    // Also consult link table (industry_award_games) if available to enrich bgg_ids and names
    const awardIds = (awards || []).map((a: any) => a.id).filter(Boolean)
    const linkByAward = new Map<string, Array<any>>()
    if (awardIds.length > 0) {
      const { data: links, error: linkErr } = await supabase
        .from('industry_award_games')
        .select('*')
        .in('award_id', awardIds as any)
      if (linkErr) {
        console.warn('Warning: error fetching industry_award_games', { message: (linkErr as any)?.message })
      } else if (Array.isArray(links)) {
        links.forEach((row: any) => {
          const aId = String(row.award_id)
          const bggIdFromLink = [
            row.bgg_id,
            row.game_bgg_id,
            row.bggId,
            typeof row.bgg_id_str === 'string' ? Number(row.bgg_id_str) : undefined,
          ].find((v: any) => typeof v === 'number')
          if (typeof bggIdFromLink === 'number') allBggIds.add(bggIdFromLink)
          const arr = linkByAward.get(aId) || []
          arr.push({
            bgg_id: typeof bggIdFromLink === 'number' ? bggIdFromLink : undefined,
            name: row.game_name || row.name || row.title || null,
            // Try a variety of likely image/thumbnail fields
            image_url:
              row.image_url || row.game_image_url || row.image || null,
            thumbnail_url:
              row.thumbnail_url ||
              row.game_thumbnail_url ||
              row.thumb_url ||
              row.thumb ||
              null,
            // Try to capture status/result indicators
            status_raw:
              row.status ||
              row.result ||
              row.award_status ||
              row.award_result ||
              row.recognition ||
              row.type ||
              null,
            is_winner:
              typeof row.is_winner === 'boolean'
                ? row.is_winner
                : typeof row.winner === 'boolean'
                  ? row.winner
                  : undefined,
            category_raw:
              row.category || row.subcategory || row.position || row.section || null,
          })
          linkByAward.set(aId, arr)
        })
      }
    }

    // Fetch all game metadata in one query
    let gamesData: any[] | null = null
    if (allBggIds.size > 0) {
      const { data, error: gamesError } = await supabase
        .from('games')
        .select(
          `
          bgg_id,
          name,
          year_published,
          image_url,
          thumbnail_url,
          min_players,
          max_players,
          playtime_minutes
        `
        )
        .in('bgg_id', Array.from(allBggIds))

      if (gamesError) {
        console.warn('Warning: error fetching games data', { message: (gamesError as any)?.message })
      }
      gamesData = data || null
    }

    // Create a map for quick game lookups by BGG ID
    const gamesMap = new Map<number, any>()
    if (gamesData) {
      gamesData.forEach((game) => {
        gamesMap.set(game.bgg_id, game)
      })
    }

    // Fallback: gather names for which we couldn't find a game by bgg_id, then try exact-name lookup
    const missingNames = new Set<string>()
    awards.forEach((award: any) => {
      const boardgames = Array.isArray(award.boardgames)
        ? award.boardgames
        : []
      boardgames.forEach((boardgame: any) => {
        const bggId =
          typeof boardgame.bggId === 'number'
            ? boardgame.bggId
            : typeof boardgame.bgg_id === 'number'
              ? boardgame.bgg_id
              : undefined
        if (typeof bggId === 'number') {
          if (!gamesMap.has(bggId) && typeof boardgame.name === 'string') {
            missingNames.add(boardgame.name)
          }
        } else if (typeof boardgame.name === 'string') {
          missingNames.add(boardgame.name)
        }
      })
      // Include names from link table for this award id
      const aId = String(award.id)
      const linkRows = linkByAward.get(aId) || []
      linkRows.forEach((lr: any) => {
        if (typeof lr?.bgg_id === 'number' && !gamesMap.has(lr.bgg_id)) {
          // we don't know the name yet, but if also provided include it
          if (typeof lr?.name === 'string') missingNames.add(lr.name)
        } else if (typeof lr?.name === 'string') {
          missingNames.add(lr.name)
        }
      })
    })

    const nameMap = new Map<string, any>()
    if (missingNames.size > 0) {
      const names = Array.from(missingNames).slice(0, 500) // guard against excessive IN list
      const { data: byName, error: byNameErr } = await supabase
        .from('games')
        .select(
          `
          bgg_id,
          name,
          year_published,
          image_url,
          thumbnail_url,
          min_players,
          max_players,
          playtime_minutes
        `
        )
        .in('name', names)
      if (byNameErr) {
        console.warn('Warning: error fetching games by name', { message: (byNameErr as any)?.message })
      } else if (byName) {
        byName.forEach((g) => nameMap.set(g.name, g))
      }
    }

    // Check if this award type has categories by examining the category field
    const hasCategories = awards.some((award: any) => {
      const c = (award.category || '').toString().trim().toLowerCase()
      return c && c !== 'overall' && !/game of the year/i.test(c)
    })

  // Note: avoid noisy server logs in RSC

    const yearMap = new Map<number, AwardYearGroup>()

    awards.forEach((award: any) => {
      // Extract games from the boardgames JSONB array safely
      const boardgames = Array.isArray(award.boardgames)
        ? award.boardgames
        : []

      boardgames.forEach((boardgame: any) => {
        try {
        // Convert database award to Honor interface format
        const honor: Honor = {
          name: award.award_set,
          year: award.year,
          category:
            award.status === 'Winner'
              ? 'Winner'
              : award.status === 'Nominee'
                ? 'Nominee'
                : 'Special',
          award_type: award.award_set,
          position: award.position,
          subcategory: award.category,
        }

        // Get full game data from our games table, fallback to basic boardgames data
          const bggId =
          typeof boardgame.bggId === 'number'
            ? boardgame.bggId
            : typeof boardgame.bgg_id === 'number'
              ? boardgame.bgg_id
              : undefined
        let fullGameData =
          typeof bggId === 'number' ? gamesMap.get(bggId) : undefined
        if (!fullGameData && typeof boardgame?.name === 'string') {
          fullGameData = nameMap.get(boardgame.name)
        }
        // If still missing, try to match via link table by normalized name
        let linkMatch: any | null = null
        if (!fullGameData) {
          const aId = String(award.id)
          const linkRows = linkByAward.get(aId) || []
          const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '')
          const bn = typeof boardgame?.name === 'string' ? norm(boardgame.name) : ''
          const match = linkRows.find((lr: any) => typeof lr?.name === 'string' && norm(lr.name) === bn)
          if (match) linkMatch = match
          if (match && typeof match.bgg_id === 'number') {
            fullGameData = gamesMap.get(match.bgg_id) || nameMap.get(match.name)
          }
        }
        // Skip if we have neither an id nor a name to show
        if (typeof bggId !== 'number' && !boardgame?.name) return
        const gameData: Game = {
          bgg_id: (typeof bggId === 'number' ? bggId : 0) as number,
          name: fullGameData?.name || boardgame.name || 'Unknown',
          year_published: fullGameData?.year_published || award.year || 0,
          image_url: fullGameData?.image_url || linkMatch?.image_url || undefined,
          thumbnail_url: fullGameData?.thumbnail_url || linkMatch?.thumbnail_url || undefined,
          honors: [honor], // Single honor for this context
        }

        if (!yearMap.has(award.year)) {
          yearMap.set(award.year, {
            year: award.year,
            primary: null,
            categoryWinners: [],
            nominees: [],
            special: [],
          })
        }

        const bucket = yearMap.get(award.year)!

        if (hasCategories) {
          // For categorized awards (like Golden Geek), group by position/category
          const categoryName =
            (award.category?.toString().trim() || '') || 'Category'

          // Initialize categories map if needed
          if (!bucket.categories) {
            bucket.categories = []
          }

          // Find or create category
          let category = bucket.categories.find((c) => c.name === categoryName)
          if (!category) {
            category = {
              name: categoryName,
              winner: null,
              nominees: [],
              special: [],
            }
            bucket.categories.push(category)
          }

          // Add game to appropriate section within the category
          if (award.status === 'Winner') {
            category.winner = gameData
          } else if (award.status === 'Nominee') {
            if (!category.nominees.find((g) => g.bgg_id === gameData.bgg_id)) {
              category.nominees.push(gameData)
            }
          } else {
            if (!category.special.find((g) => g.bgg_id === gameData.bgg_id)) {
              category.special.push(gameData)
            }
          }
        } else {
          // For simple awards (like Spiel des Jahres), use traditional structure
          if (award.status === 'Winner') {
            // Check if this is the main winner (no subcategory) or a category winner
            if (
              !award.category ||
              award.category === 'Overall' ||
              award.category === 'Game of the Year'
            ) {
              if (!bucket.primary) bucket.primary = { game: gameData, honor }
              else
                bucket.categoryWinners.push({
                  subcategory: award.category || 'Overall',
                  game: gameData,
                  honor,
                })
            } else {
              bucket.categoryWinners.push({
                subcategory: award.category || 'Category',
                game: gameData,
                honor,
              })
            }
          } else if (award.status === 'Nominee') {
            if (!bucket.nominees.find((g) => g.bgg_id === gameData.bgg_id)) {
              bucket.nominees.push(gameData)
            }
          } else {
            if (!bucket.special.find((g) => g.bgg_id === gameData.bgg_id)) {
              bucket.special.push(gameData)
            }
          }
        }
        } catch (e) {
          // Ignore malformed boardgame entries
        }
      })
      // If boardgames array is empty or incomplete, also fold in link-table rows as entries
      const aId = String(award.id)
      const linkRows = linkByAward.get(aId) || []
      if (linkRows.length > 0) {
        // Ensure bucket exists for this year
        if (!yearMap.has(award.year)) {
          yearMap.set(award.year, {
            year: award.year,
            primary: null,
            categoryWinners: [],
            nominees: [],
            special: [],
          })
        }
        const bucket = yearMap.get(award.year)!
        const norm = (s: string) => s.toLowerCase().trim()
        for (const lr of linkRows) {
          try {
            const bggId = typeof lr.bgg_id === 'number' ? lr.bgg_id : undefined
            let fullGameData = typeof bggId === 'number' ? gamesMap.get(bggId) : undefined
            if (!fullGameData && typeof lr?.name === 'string') {
              fullGameData = nameMap.get(lr.name)
            }
            if (typeof bggId !== 'number' && !lr?.name) continue

            // Derive status
            const raw = typeof lr.status_raw === 'string' ? lr.status_raw : (award.status || '')
            const rawNorm = norm(String(raw))
            let derivedStatus: 'Winner' | 'Nominee' | 'Special'
            if (lr.is_winner === true || /winner|won|game of the year|goty|gewinner/.test(rawNorm)) {
              derivedStatus = 'Winner'
            } else if (/nominee|nominated|shortlist|finalist|runner/.test(rawNorm)) {
              derivedStatus = 'Nominee'
            } else {
              derivedStatus = 'Special'
            }

            const catNameRaw = lr.category_raw || award.category || ''
            const categoryName = String(catNameRaw || '').toString().trim() || 'Category'

            const honor: Honor = {
              name: award.award_set,
              year: award.year,
              category: derivedStatus,
              award_type: award.award_set,
              subcategory: categoryName,
            }

            const gameData: Game = {
              bgg_id: (typeof bggId === 'number' ? bggId : 0) as number,
              name: fullGameData?.name || lr.name || 'Unknown',
              year_published: fullGameData?.year_published || award.year || 0,
              image_url: fullGameData?.image_url || lr.image_url || undefined,
              thumbnail_url: fullGameData?.thumbnail_url || lr.thumbnail_url || undefined,
              honors: [honor],
            }

            if (hasCategories) {
              // Ensure categories array exists
              if (!bucket.categories) bucket.categories = []
              let category = bucket.categories.find((c) => c.name === categoryName)
              if (!category) {
                category = { name: categoryName, winner: null, nominees: [], special: [] }
                bucket.categories.push(category)
              }
              if (derivedStatus === 'Winner') {
                // Only set if empty to avoid overriding actual JSON winner
                if (!category.winner) category.winner = gameData
              } else if (derivedStatus === 'Nominee') {
                if (!category.nominees.find((g) => g.bgg_id === gameData.bgg_id)) {
                  category.nominees.push(gameData)
                }
              } else {
                if (!category.special.find((g) => g.bgg_id === gameData.bgg_id)) {
                  category.special.push(gameData)
                }
              }
            } else {
              // Simple awards structure
              if (derivedStatus === 'Winner') {
                const overallLike = !award.category || /overall|game of the year|spiel des jahres|kinderspiel des jahres|kennerspiel des jahres/i.test(String(award.category))
                if (overallLike) {
                  if (!bucket.primary) bucket.primary = { game: gameData, honor }
                  else {
                    // If a primary winner already exists, treat additional winners as category winners
                    bucket.categoryWinners.push({ subcategory: categoryName || 'Category', game: gameData, honor })
                  }
                } else {
                  bucket.categoryWinners.push({ subcategory: categoryName || 'Category', game: gameData, honor })
                }
              } else if (derivedStatus === 'Nominee') {
                if (!bucket.nominees.find((g) => g.bgg_id === gameData.bgg_id)) bucket.nominees.push(gameData)
              } else {
                if (!bucket.special.find((g) => g.bgg_id === gameData.bgg_id)) bucket.special.push(gameData)
              }
            }
          } catch {}
        }
      }
    })

    const years: AwardYearGroup[] = Array.from(yearMap.values()).sort(
      (a, b) => b.year - a.year
    )

    // De-duplicate nominees & specials (a game may appear multiple honors same year)
    years.forEach((y) => {
      const dedupe = (arr: Game[]) =>
        Array.from(new Map(arr.map((g) => [g.bgg_id, g])).values())
      y.nominees = dedupe(y.nominees).sort((a, b) =>
        (a.name || '').localeCompare(b.name || '')
      )
      y.special = dedupe(y.special).sort((a, b) => (a.name || '').localeCompare(b.name || ''))
      // Sort category winners by subcategory then name
      y.categoryWinners.sort(
        (a, b) =>
          (a.subcategory || '').localeCompare(b.subcategory || '') ||
          (a.game.name || '').localeCompare(b.game.name || '')
      )

      // Sort categories if present
      if (y.categories) {
        y.categories.sort((a, b) => a.name.localeCompare(b.name))
        y.categories.forEach((cat) => {
          cat.nominees.sort((a, b) => a.name.localeCompare(b.name))
          cat.special.sort((a, b) => a.name.localeCompare(b.name))
        })
      }
    })

    return years
  } catch (error) {
    console.warn('Warning: exception in getAwardData', { message: (error as any)?.message })
    return []
  }
}

function YearSection({
  yearData,
  awardType,
  isLast,
}: {
  yearData: AwardYearGroup
  awardType: string
  isLast: boolean
}) {
  // multi-equal flag retained for potential future labeling
  const multiEqual = /(Mensa Select|Meeples Choice Award)/i.test(awardType)

  // Check if this is a categorized award structure
  const hasCategories = yearData.categories && yearData.categories.length > 0
  // Build a normalized categories array so we can always use the categorized renderer.
  let normalizedCategories = yearData.categories
  if (!hasCategories) {
    normalizedCategories = []
    // Primary winner category
    if (yearData.primary) {
      normalizedCategories.push({
        name: 'Winner',
        winner: yearData.primary.game,
        nominees: [],
        special: [],
      })
    }
    // Category winners -> each its own category
    yearData.categoryWinners.forEach((cw) => {
      normalizedCategories!.push({
        name: cw.subcategory || 'Category Winner',
        winner: cw.game,
        nominees: [],
        special: [],
      })
    })
    // Unified nominees + special as a single "Nominees" category (winner null)
    const unifiedNominees = Array.from(
      new Map(
        [...yearData.nominees, ...yearData.special].map((g) => [g.bgg_id, g])
      ).values()
    ).sort((a, b) => a.name.localeCompare(b.name))
    if (unifiedNominees.length > 0) {
      normalizedCategories!.push({
        name: 'Nominees',
        winner: null,
        nominees: unifiedNominees,
        special: [],
      })
    }
  }

  return (
    <div className="relative flex">
      {/* Timeline rail (hidden on small screens) */}
      <div className="relative flex flex-col items-center w-12 md:w-24 shrink-0">
        {/* Vertical line */}
        <div
          className={`hidden md:block absolute top-0 ${!isLast ? 'bottom-0' : 'h-1/2'} left-1/2 -translate-x-1/2 w-0.5 bg-gradient-to-b from-gray-200 via-gray-200 to-transparent pointer-events-none`}
          aria-hidden="true"
        />
        {/* Year marker */}
        <div className="sticky top-24 flex flex-col items-center">
          <div className="relative w-10 h-16 md:h-20 flex items-center justify-center">
            {/* Dot */}
            <div className="absolute top-0 md:top-0 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-white ring-2 ring-gray-300 shadow flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-gray-300" />
            </div>
            {/* Rotated year positioned southwest of dot */}
            <span
              aria-hidden="true"
              className="hidden md:block absolute top-2 md:top-2 left-1/2 -translate-x-1/2 translate-y-1/2 -rotate-90 origin-center text-4xl font-extrabold text-gray-300 tracking-tight select-none pointer-events-none pr-6"
              style={{ transform: 'translate(-67%, 100%) rotate(-90deg)' }}
            >
              {yearData.year}
            </span>
            <span className="sr-only">{yearData.year}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 pb-16">
        {/* Mobile year heading */}
        <div className="md:hidden flex items-center gap-2 mb-4">
          <CalendarIcon className="w-5 h-5 text-gray-500" />
          <h2 className="text-xl font-bold text-gray-900 font-display tracking-tight">
            {yearData.year}
          </h2>
        </div>
        {/* Meta summary with icons */}
        <div className="text-xs text-gray-600 mb-6 font-medium flex flex-wrap items-center gap-x-6 gap-y-2">
          {(() => {
            if (hasCategories) {
              const categoriesCount = yearData.categories!.length
              const winnersCount = yearData.categories!.reduce(
                (sum, c) => sum + (c.winner ? 1 : 0),
                0
              )
              const nomineesCount = yearData.categories!.reduce(
                (sum, c) => sum + c.nominees.length,
                0
              )
              const specialCount = yearData.categories!.reduce(
                (sum, c) => sum + c.special.length,
                0
              )
              return (
                <>
                  <span className="inline-flex items-center gap-1.5"><Squares2X2Icon className="w-4 h-4 text-gray-500" /> {categoriesCount} {categoriesCount === 1 ? 'category' : 'categories'}</span>
                  <span className="inline-flex items-center gap-1.5"><TrophyIcon className="w-4 h-4 text-amber-500" /> {winnersCount} winner{winnersCount === 1 ? '' : 's'}</span>
                  <span className="inline-flex items-center gap-1.5"><UserGroupIcon className="w-4 h-4 text-gray-500" /> {nomineesCount} nominee{nomineesCount === 1 ? '' : 's'}</span>
                  {specialCount > 0 && (
                    <span className="inline-flex items-center gap-1.5"><StarIcon className="w-4 h-4 text-sky-500" /> {specialCount} special</span>
                  )}
                </>
              )
            }
            const winnersCount = (yearData.primary ? 1 : 0) + yearData.categoryWinners.length
            const nomineesCount = yearData.nominees.length
            const specialCount = yearData.special.length
            return (
              <>
                <span className="inline-flex items-center gap-1.5"><TrophyIcon className="w-4 h-4 text-amber-500" /> {winnersCount} winner{winnersCount === 1 ? '' : 's'}</span>
                <span className="inline-flex items-center gap-1.5"><UserGroupIcon className="w-4 h-4 text-gray-500" /> {nomineesCount} nominee{nomineesCount === 1 ? '' : 's'}</span>
                {specialCount > 0 && (
                  <span className="inline-flex items-center gap-1.5"><StarIcon className="w-4 h-4 text-sky-500" /> {specialCount} special</span>
                )}
              </>
            )
          })()}
        </div>

        {normalizedCategories &&
          normalizedCategories.map((category, idx) => {
            const hasRightContent =
              category.nominees.length > 0 || category.special.length > 0
            const combinedNominees = Array.from(
              new Map(
                [...category.nominees, ...category.special].map((g) => [
                  g.bgg_id,
                  g,
                ])
              ).values()
            ).sort((a, b) => a.name.localeCompare(b.name))
            const nomineeOnly =
              !category.winner &&
              combinedNominees.length > 0 &&
              category.name === 'Nominees'

            {
              /* Awards Winner/Nom Card */
            }
            return (
              <AwardCategoryPanel
                key={category.name}
                title={category.name}
                yearLabel={yearData.year}
                winner={category.winner}
                nominees={combinedNominees}
                nomineeOnly={nomineeOnly}
              />
            )
          })}
      </div>
    </div>
  )
}

export default async function AwardPage({
  params,
}: {
  params: Promise<{ award: string }>
}) {
  const { award } = await params
  const awardConfig = AWARD_CATEGORIES[award as keyof typeof AWARD_CATEGORIES]

  if (!awardConfig) {
    return (
      <PageLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900">Award Not Found</h1>
          <p className="text-gray-600 mt-2">
            The award category you're looking for doesn't exist.
          </p>
        </div>
      </PageLayout>
    )
  }

  // Map award page slugs to database award_type values
  const awardTypeMap: Record<string, string> = {
    'golden-geek': 'Golden Geek Awards',
    'spiel-des-jahres': 'Spiel des Jahres',
    'kinderspiel-des-jahres': 'Kinderspiel des Jahres',
    'kennerspiel-des-jahres': 'Kennerspiel des Jahres',
    'deutscher-spiele-preis': 'Deutscher Spiele Preis',
    'origins-awards': 'Origins Awards',
    'dice-tower-awards': 'The Dice Tower Gaming Awards',
    'as-dor': "As d'Or - Jeu de l'Année",
    'international-gamers-award': 'International Gamers Award',
    'ion-award': 'Ion Award',
    'zenobia-award': 'Zenobia Award',
    'charles-s-roberts': 'Charles S. Roberts',
    sxsw: 'SXSW',
    'board-game-quest': 'Board Game Quest Awards',
    'juego-del-ano': 'Juego del Año',
    'parents-choice': 'Parents Choice',
    guldbrikken: 'Guldbrikken',
  }

  const awardType = awardTypeMap[award]

  // Use unified data fetching for all awards
  const awardData = await getAwardData(awardType)

  const IconComponent = awardConfig.icon

  // Global stats across all years (support both categorized and non-categorized structures)
  const globalStats = (() => {
    return awardData.reduce(
      (acc, y) => {
        if (Array.isArray(y.categories) && y.categories.length) {
          acc.categories += y.categories.length
          acc.winners += y.categories.reduce(
            (s, c) => s + (c.winner ? 1 : 0),
            0
          )
          acc.nominees += y.categories.reduce(
            (s, c) => s + c.nominees.length,
            0
          )
          acc.special += y.categories.reduce(
            (s, c) => s + c.special.length,
            0
          )
        } else {
          const winnersCount = (y.primary ? 1 : 0) + y.categoryWinners.length
          const categoriesCount = winnersCount // treat each winner slot as a category
          acc.categories += categoriesCount
          acc.winners += winnersCount
          acc.nominees += y.nominees.length
          acc.special += y.special.length
        }
        return acc
      },
      { categories: 0, winners: 0, nominees: 0, special: 0 }
    )
  })()

  return (
    <PageLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div
              className={`p-4 rounded-full ${
                awardConfig.color === 'amber'
                  ? 'bg-amber-100'
                  : awardConfig.color === 'yellow'
                    ? 'bg-yellow-100'
                    : awardConfig.color === 'green'
                      ? 'bg-green-100'
                      : 'bg-blue-100'
              }`}
            >
              <IconComponent
                className={`w-10 h-10 ${
                  awardConfig.color === 'amber'
                    ? 'text-amber-600'
                    : awardConfig.color === 'yellow'
                      ? 'text-yellow-600'
                      : awardConfig.color === 'green'
                        ? 'text-green-600'
                        : 'text-blue-600'
                }`}
              />
            </div>
          </div>
          <Heading
            as="h1"
            size="display"
            gradient
            weightScale
            align="center"
            displayFont
            className="mb-4"
          >
            {awardConfig.name}
          </Heading>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
            {awardConfig.description}
          </p>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 text-[11px] uppercase tracking-wide text-gray-500 font-medium">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              {awardData.length} Years
            </div>
            <div className="flex items-center gap-2">
              <TrophyIcon className="w-4 h-4" />
              {globalStats.winners}{' '}
              Winners
            </div>
            <div className="flex items-center gap-2">
              <UserGroupIcon className="w-4 h-4" />
              {globalStats.nominees + globalStats.special}{' '}
              Other Recognitions
            </div>
          </div>
        </div>

        {/* Award data by year */}
        <div className="space-y-8">
          {awardData.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                No award data available for this category yet.
              </p>
            </div>
          ) : (
            awardData.map((yearData, idx) => (
              <YearSection
                key={yearData.year}
                yearData={yearData}
                awardType={awardType}
                isLast={idx === awardData.length - 1}
              />
            ))
          )}
        </div>
      </div>
    </PageLayout>
  )
}
