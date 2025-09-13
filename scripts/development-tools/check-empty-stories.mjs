#!/usr/bin/env node
import { readdir, stat, readFile } from 'fs/promises'
import { join } from 'path'

// Scan only active story roots (exclude archived + legacy placeholders)
const roots = [
  'src/components/Components',
  'src/components/Elements',
  'src/components/Foundations',
  'src/stories',
]

const STORY_REGEX = /\.stories\.(t|j)sx?$/
const DUPLICATE_SUFFIX_REGEX = /2\.stories\.(t|j)sx?$/
const MIN_NON_WHITESPACE = 20 // characters threshold to consider 'non-empty'

let failures = []

async function scan(dir) {
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return
  }
  for (const e of entries) {
    const full = join(dir, e.name)
    if (e.isDirectory()) {
      await scan(full)
    } else if (STORY_REGEX.test(e.name)) {
      // Guard against duplicate numbered variants like *2.stories.tsx
      if (DUPLICATE_SUFFIX_REGEX.test(e.name)) {
        failures.push(full + ' (duplicate filename pattern)')
        continue
      }
      const content = await readFile(full, 'utf8')
      const stripped = content
        .replace(/[/][*][\s\S]*?[*][/]|\/\/.*$/gm, '')
        .trim()
      if (
        stripped.length < MIN_NON_WHITESPACE ||
        !/export\s+default\s+/m.test(stripped)
      ) {
        failures.push(full)
      }
    }
  }
}

for (const r of roots) await scan(r)

if (failures.length) {
  console.error(
    `Empty or invalid story files detected (missing default export or too short):\n` +
      failures.map((f) => ` - ${f}`).join('\n')
  )
  console.error(
    '\nArchive or implement these stories, or exclude the directories.'
  )
  process.exit(1)
} else {
  console.log('No empty legacy story files found.')
}
