# Nightly Metadata Backfill Workflow (GitHub Actions)

Automates enrichment of game records (taglines + extended metadata) on a schedule or manual trigger without leaking secrets.

## 1. Prerequisites

Add these repository secrets (Settings → Secrets and variables → Actions → New repository secret):

Required:

- NEXT_PUBLIC_SUPABASE_URL (public Supabase project URL)
- NEXT_PUBLIC_SUPABASE_ANON_KEY (public anon key)
- SUPABASE_SERVICE_ROLE_KEY (service role key – keep private)

Optional (if used elsewhere):

- BGG_API_BASE_URL (defaults to https://boardgamegeek.com/xmlapi2)

Do NOT commit `.env` with real values.

## 2. Workflow File

Create: `.github/workflows/nightly-metadata-refresh.yml`

```yaml
name: Nightly Metadata Refresh

on:
  schedule:
    - cron: '15 5 * * *' # 05:15 UTC daily
  workflow_dispatch:
    inputs:
      limit:
        description: 'Limit games processed each phase'
        required: false
      concurrency:
        description: 'Override concurrency'
        required: false
      skipTaglines:
        description: 'Skip tagline phase'
        type: boolean
        required: false
      skipExtended:
        description: 'Skip extended phase'
        type: boolean
        required: false

jobs:
  refresh:
    runs-on: ubuntu-latest
    timeout-minutes: 120
    permissions:
      contents: read
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install deps
        run: npm ci

      # Create a transient .env for Node scripts only (not echoed)
      - name: Write .env (not printed)
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
        run: |
          {
            echo "NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL"
            echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY"
            echo "SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY"
          } >> .env
          # Restrict perms
          chmod 600 .env

      - name: Run chained backfill
        run: |
          CMD="npm run backfill:all --"
          [ -n "${{ github.event.inputs.limit }}" ] && CMD="$CMD --limit ${{ github.event.inputs.limit }}" \
            || CMD="$CMD --limit 500"  # sensible default for nightly
          [ -n "${{ github.event.inputs.concurrency }}" ] && CMD="$CMD --concurrency ${{ github.event.inputs.concurrency }}"
          [ "${{ github.event.inputs.skipTaglines }}" = "true" ] && CMD="$CMD --skip-taglines"
          [ "${{ github.event.inputs.skipExtended }}" = "true" ] && CMD="$CMD --skip-extended"
          echo "Executing: $CMD"
          eval "$CMD"
```

## 3. How Secrets Stay Safe

- Secrets injected via `env:` are not printed unless you explicitly `echo` them.
- The script never logs `.env` contents.
- Avoid `set -x` (bash trace) in steps with secrets.
- Service role key is only written to workspace (not committed) and ephemeral in CI.

## 4. Local Parity

Create `.env.local` (ignored) with same keys for local runs:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Then:

```
npm run backfill:all -- --limit 200 --concurrency 3
```

## 5. Scripts Overview

- `npm run backfill:taglines` – fills `tagline`
- `npm run backfill:bgg-extended` – fills artists, type, family codes, relationships
- `npm run backfill:all` – chained phases (accepts `--limit`, `--concurrency`, `--skip-taglines`, `--skip-extended`)

State/resume files (e.g. `.taglines-state.json`) allow safe restarts.

## 6. Manual Dispatch Usage

From Actions tab → select workflow → Run workflow:

- Provide `limit` for a focused refresh (e.g. 100)
- Use `skipTaglines` or `skipExtended` for partial runs

## 7. Rotation & Hardening (Optional)

- Rotate `SUPABASE_SERVICE_ROLE_KEY` periodically; update secret.
- Add environment protection rules if using GitHub Environments.
- If workflow forks are a concern, disable Actions for fork PRs or conditionally skip secrets for `pull_request` events (not used here).

## 8. Common Pitfalls

| Issue                         | Cause                                      | Fix                        |
| ----------------------------- | ------------------------------------------ | -------------------------- |
| Secrets show as `***` in logs | GitHub masking                             | Normal                     |
| 403 / unauthorized            | Wrong service role key                     | Regenerate & update secret |
| No changes processed          | Limit too low or all rows already enriched | Run without `--limit`      |
| Rate limits                   | BGG API throttling                         | Keep concurrency ≤ 3       |

## 9. Verifying After Run

Check workflow logs:

- Phase 1 and Phase 2 summaries
- No stack traces
- Sample game rows now have `tagline`, `artists`, `rank_families`, relationship arrays

Spot-check in database or the UI detail modal (Refresh BGG button triggers targeted import).

## 10. Updating the Workflow

When adding new enrichment phases:

1. Add new script.
2. Extend chained script invocation.
3. Add new skip flag and update this doc.

---

End of setup guide.
