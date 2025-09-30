#!/usr/bin/env node
/**
 * Guard script: fails if code imports from deprecated legacy paths.
 * Add patterns to the BLOCKED array as more folders are retired.
 */
import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

const ROOT = process.cwd()
const SRC = join(ROOT, 'src')

// Blocked import path substrings (normalized to forward slashes)
const BLOCKED = [
  'components/shared/',
  'components/_archived/',
  'components/features/', // if features dir fully retired
]

// Allowlist of extensions to scan
const EXTS = new Set(['.ts', '.tsx', '.js', '.jsx'])

const offenders = []

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) {
      // Skip node_modules and build artifacts
      if (
        entry === 'node_modules' ||
        entry.startsWith('.next') ||
        entry === 'storybook-static'
      )
        continue
      walk(full)
    } else {
      const ext = entry.slice(entry.lastIndexOf('.'))
      if (!EXTS.has(ext)) continue
      const rel = full.replace(ROOT + '/', '').replace(/\\/g, '/')
      const content = readFileSync(full, 'utf8')
      for (const pat of BLOCKED) {
        if (content.includes(pat)) {
          offenders.push({ file: rel, pattern: pat })
          break
        }
      }
    }
  }
}

walk(SRC)

if (offenders.length) {
  console.error('\nLegacy import guard failed:')
  for (const o of offenders) {
    console.error(` - ${o.file} imports blocked pattern "${o.pattern}"`)
  }
  console.error('\nRemove these imports or migrate the code before committing.')
  process.exit(1)
} else {
  console.log('Legacy import guard passed (no blocked imports found).')
}
