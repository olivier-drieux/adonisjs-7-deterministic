import fs from 'node:fs'
import path from 'node:path'

import { SKILL_ROOT } from './catalog.mjs'

export const REFERENCES_DIR = path.join(SKILL_ROOT, 'references')
export const PATTERNS_DIR = path.join(REFERENCES_DIR, 'patterns')

export const FENCE_RE = /^```(ts|tsx|typescript)\s*$/
export const PARTIAL_MARKERS = new Set(['// excerpt', '// partial snippet', '// partial example'])

// Doctrine-exception markers: a block may opt out of specific rule-tagged forbidden
// patterns by declaring `// doctrine-exception: <rule-id>` anywhere inside it.
// This is how the documented exceptions for `hb.no-client-fetch-stack` (streaming,
// multipart uploads) and `hb.no-raw-io-and-timers` (temp-bridge files, bounded
// timers outside HTTP) are expressed as real, validator-visible code.
export const DOCTRINE_EXCEPTION_RE = /\/\/\s*doctrine-exception:\s*([a-z0-9.-]+)/i

export function collectDoctrineExceptions(block) {
  const exceptions = new Set()
  for (const line of block.text.split('\n')) {
    const match = line.match(DOCTRINE_EXCEPTION_RE)
    if (match) exceptions.add(match[1])
  }
  return exceptions
}

function collectMdFiles(dir) {
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.md'))
    .sort()
    .map((name) => path.join(dir, name))
}

export const DOC_FILES = [
  path.join(SKILL_ROOT, 'SKILL.md'),
  ...collectMdFiles(REFERENCES_DIR),
  ...collectMdFiles(PATTERNS_DIR),
]

export function extractBlocks(filePath) {
  const lines = fs.readFileSync(filePath, 'utf8').split('\n')
  const blocks = []
  let inBlock = false
  let lang = ''
  let startLine = 0
  let buffer = []

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]

    if (!inBlock) {
      const match = line.match(FENCE_RE)
      if (match) {
        inBlock = true
        lang = match[1]
        startLine = index + 2
        buffer = []
      }
      continue
    }

    if (line.trim() === '```') {
      blocks.push({ filePath, startLine, lang, text: buffer.join('\n') })
      inBlock = false
      lang = ''
      buffer = []
      continue
    }

    buffer.push(line)
  }

  return blocks
}

export function isPartial(block) {
  for (const line of block.text.split('\n')) {
    const stripped = line.trim()
    if (!stripped) continue
    return PARTIAL_MARKERS.has(stripped)
  }

  return false
}

export function hasImport(block, symbol) {
  const escaped = symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const patterns = [
    new RegExp(`import\\s+type\\s+\\{[^}]*\\b${escaped}\\b[^}]*\\}\\s+from\\s+`),
    new RegExp(`import\\s+\\{[^}]*\\b${escaped}\\b[^}]*\\}\\s+from\\s+`),
    new RegExp(`import\\s+${escaped}\\s+from\\s+`),
    new RegExp(`(?:export\\s+)?(?:const|let|var|function|class|type|interface)\\s+${escaped}\\b`),
  ]

  return patterns.some((pattern) => pattern.test(block.text))
}

export function relativeLabel(block) {
  return `${path.relative(ROOT, block.filePath)}:${block.startLine}`
}
