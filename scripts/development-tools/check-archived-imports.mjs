#!/usr/bin/env node
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = process.cwd()
const SRC = join(ROOT, 'src')
let failures = []

/** Recursively walk directory */
function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(full)
    } else if (entry.isFile()) {
      if (!/\.(tsx?|jsx?)$/.test(entry.name)) continue
      const content = readFileSync(full, 'utf8')
      if (content.includes('_archived/')) {
        failures.push(full.replace(ROOT + '/', ''))
      }
    }
  }
}

walk(SRC)

if (failures.length) {
  console.error('\n[FAIL] Archived import references detected:')
  for (const f of failures) console.error(' - ' + f)
  console.error('\nRemove or migrate these imports. (_archived/ usage is disallowed)')
  process.exit(1)
} else {
  console.log('[OK] No _archived import paths found.')
}
