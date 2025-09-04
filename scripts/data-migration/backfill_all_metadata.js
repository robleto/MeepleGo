#!/usr/bin/env node
/**
 * Chained backfill runner: taglines first (cheap HTML scrape) then extended metadata.
 * Respects existing state files created by individual scripts, and will skip a stage
 * if a --skip-* flag is provided. Basic usage:
 *   node scripts/backfill_all_metadata.js [--limit 500] [--concurrency 3]
 * Flags:
 *   --limit N         Limit number of games processed in each phase
 *   --concurrency N   Override default concurrency passed to underlying scripts
 *   --skip-taglines   Skip tagline phase
 *   --skip-extended   Skip extended phase
 */

const { spawn } = require('child_process')
const path = require('path')

function parseArgs() {
  const args = process.argv.slice(2)
  const opts = { limit: null, concurrency: null, skipTaglines: false, skipExtended: false }
  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (a === '--limit') opts.limit = Number(args[++i])
    else if (a === '--concurrency') opts.concurrency = Number(args[++i])
    else if (a === '--skip-taglines') opts.skipTaglines = true
    else if (a === '--skip-extended') opts.skipExtended = true
  }
  return opts
}

async function runScript(relPath, baseArgs) {
  return new Promise((resolve, reject) => {
    const abs = path.join(__dirname, relPath)
    const proc = spawn(process.execPath, [abs, ...baseArgs], { stdio: 'inherit' })
    proc.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${relPath} exited with code ${code}`))
    })
  })
}

async function main() {
  const { limit, concurrency, skipTaglines, skipExtended } = parseArgs()
  const sharedArgs = []
  if (limit) sharedArgs.push('--limit', String(limit))
  if (concurrency) sharedArgs.push('--concurrency', String(concurrency))

  if (!skipTaglines) {
    console.log('\n=== Phase 1: Taglines Backfill ===')
    await runScript('backfill_bgg_taglines.js', sharedArgs)
  } else {
    console.log('Skipping taglines phase')
  }

  if (!skipExtended) {
    console.log('\n=== Phase 2: Extended Metadata Backfill ===')
    await runScript('backfill_bgg_extended.js', sharedArgs)
  } else {
    console.log('Skipping extended phase')
  }

  console.log('\nAll requested backfill phases complete.')
}

main().catch((err) => {
  console.error('Backfill chain failed:', err)
  process.exit(1)
})
