# BGG Trends Run Log

This project automatically scrapes BoardGameGeek trend pages nightly and weekly via GitHub Actions (`weekly-bgg-trends.yml`).

## Environment
Secrets required in the repository:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `BGG_LIST_OWNER_ID` (UUID of system profile that owns public BGG lists)

## Tables
`bgg_trend_runs` captures each run with:

| Field | Description |
|-------|-------------|
| started_at / finished_at | Run timing |
| pages | JSON object per page with counts (total scraped, list_size) |
| total_ids | Union unique ids scraped |
| new_ids | Count not previously in games table |
| imported / failed | Import outcomes |
| api_used / inline_used | Path usage distribution |
| duration_seconds | Total run duration |
| error | Top-level error (if any) |

Retention: periodically prune old rows > 90 days if desired.

## Lists Generated
Public lists updated each run:

- `BGG Bestsellers` (list_type: `bgg_bestsellers`)
- `BGG Hotness` (`bgg_hotness`)
- `BGG Trending Plays` (`bgg_trendingplays`)
- `BGG Most Played` (`bgg_mostplayed`)

Each list is fully replaced (delete + insert) preserving current ordering using `ranking` column in `game_list_items`.

## Dry Run
Trigger workflow manually with `dryRun=true` to test without DB writes (lists skipped, run log recorded in dry-run mode only if creation not disabled).
