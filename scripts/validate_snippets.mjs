#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const ROOT = path.resolve(import.meta.dirname, '..')
const REFERENCES_DIR = path.join(ROOT, 'references')
const DOC_FILES = [
  path.join(ROOT, 'SKILL.md'),
  ...fs
    .readdirSync(REFERENCES_DIR)
    .filter((name) => name.endsWith('.md'))
    .sort()
    .map((name) => path.join(REFERENCES_DIR, name)),
]

const FENCE_RE = /^```(ts|tsx)\s*$/
const PARTIAL_MARKERS = new Set(['// excerpt', '// partial snippet', '// partial example'])
const FORBIDDEN_SNIPPET_PATTERNS = [
  {
    pattern: /\brequest\.(all|only)\(/,
    message: 'uses `request.all()` or `request.only()`; validate with VineJS instead',
  },
  {
    pattern: /from\s+['"]@mantine\/form['"]/,
    message: 'uses `@mantine/form`; standard forms should use `@adonisjs/inertia/react` `Form` plus VineJS',
  },
  {
    pattern: /from\s+['"]react-hook-form['"]/,
    message: 'uses `react-hook-form`; standard forms should use `@adonisjs/inertia/react` `Form` plus VineJS',
  },
  {
    pattern: /from\s+['"]formik['"]/,
    message: 'uses `formik`; standard forms should use `@adonisjs/inertia/react` `Form` plus VineJS',
  },
  {
    pattern: /from\s+['"]zod['"]/,
    message: 'uses `zod`; standard forms should use server-side VineJS validation',
  },
  {
    pattern: /from\s+['"]yup['"]/,
    message: 'uses `yup`; standard forms should use server-side VineJS validation',
  },
  {
    pattern: /from\s+['"]valibot['"]/,
    message: 'uses `valibot`; standard forms should use server-side VineJS validation',
  },
  {
    pattern: /\bfetch\(/,
    message: 'uses raw `fetch`; use Inertia props or the typed Tuyau client when explicit client fetching is justified',
  },
  {
    pattern: /\baxios\b/,
    message: 'uses `axios`; use Inertia props or the typed Tuyau client when explicit client fetching is justified',
  },
  {
    pattern: /\bky\(/,
    message: 'uses `ky`; use Inertia props or the typed Tuyau client when explicit client fetching is justified',
  },
  {
    pattern: /\bSWR\b/,
    message: 'uses `SWR`; use Inertia props or the typed Tuyau client when explicit client fetching is justified',
  },
  {
    pattern: /from\s+['"]react-router-dom['"]/,
    message: 'uses `react-router-dom`; Inertia owns navigation in this doctrine',
  },
  {
    pattern: /\bnodemailer\b/,
    message: 'uses `nodemailer`; use `@adonisjs/mail` instead',
  },
  {
    pattern: /from\s+['"](node:fs|fs\/promises)['"]/,
    message: 'uses raw persistent `fs`; use `@adonisjs/drive` for application file storage',
  },
  {
    pattern: /\b(setInterval|setTimeout)\(/,
    message: 'uses ad hoc timer logic; move recurring work into idempotent Ace commands or listeners',
  },
  {
    pattern: /\b(class|interface|type)\s+\w*Repository\b|from\s+['"][^'"]*repositories?[^'"]*['"]/,
    message: 'introduces a repository layer; use Lucid models and services directly for ordinary app code',
  },
  {
    pattern: /response\.(ok|created|accepted)\(\s*\{\s*data\s*:/,
    message: 'adds a global `data` envelope; return serialized transformer output directly',
  },
  {
    pattern: /response\.(badRequest|unprocessableEntity|conflict|forbidden|notFound)\(\s*\{\s*error\s*:/,
    message: 'adds a global `error` envelope; use flat `{ code, message }` API errors',
  },
]

function extractBlocks(filePath) {
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

function isPartial(block) {
  for (const line of block.text.split('\n')) {
    const stripped = line.trim()
    if (!stripped) continue
    return PARTIAL_MARKERS.has(stripped)
  }

  return false
}

function hasImport(block, symbol) {
  const escaped = symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const patterns = [
    new RegExp(`import\\s+type\\s+\\{[^}]*\\b${escaped}\\b[^}]*\\}\\s+from\\s+`),
    new RegExp(`import\\s+\\{[^}]*\\b${escaped}\\b[^}]*\\}\\s+from\\s+`),
    new RegExp(`import\\s+${escaped}\\s+from\\s+`),
    new RegExp(`(?:export\\s+)?(?:const|let|var|function|class|type|interface)\\s+${escaped}\\b`),
  ]

  return patterns.some((pattern) => pattern.test(block.text))
}

function findValidateSymbols(block) {
  return Array.from(block.text.matchAll(/request\.validateUsing\((\w+)\)/g), (match) => match[1])
}

function relativeLabel(block) {
  return `${path.relative(ROOT, block.filePath)}:${block.startLine}`
}

function hasAnyTypeUsage(block) {
  const patterns = [
    /:\s*any\b/,
    /\bas\s+any\b/,
    /<\s*any\s*>/,
    /\bArray<any>\b/,
    /\bPromise<any>\b/,
  ]

  return patterns.some((pattern) => pattern.test(block.text))
}

function checkBlock(block) {
  const errors = []

  if (/#validators\/[\w/]+_validator\b/.test(block.text)) {
    errors.push('uses deprecated `#validators/*_validator` import path')
  }

  if (/^\s*return query;?\s*$/m.test(block.text)) {
    errors.push('returns a raw query builder; materialize with `exec()` or paginate it')
  }

  if (block.text.includes('response.created(serialize(')) {
    errors.push('nests `serialize(...)` inside `response.created(...)`; set status first, then return `serialize(...)`')
  }

  if (hasAnyTypeUsage(block)) {
    errors.push('uses `any`; canonical snippets must keep concrete types')
  }

  for (const { pattern, message } of FORBIDDEN_SNIPPET_PATTERNS) {
    if (pattern.test(block.text)) {
      errors.push(message)
    }
  }

  if (!isPartial(block)) {
    if (/return\s+\w+Transformer\.(transform|paginate)\(/.test(block.text)) {
      errors.push('returns transformer output directly; use `serialize(...)` in API controller snippets')
    }

    if (block.text.includes('HttpContext') && !hasImport(block, 'HttpContext')) {
      errors.push('uses `HttpContext` without importing it')
    }

    if (block.text.includes('User.') && !hasImport(block, 'User')) {
      errors.push('uses `User` without importing it')
    }

    for (const symbol of new Set(findValidateSymbols(block))) {
      if (!hasImport(block, symbol)) {
        errors.push(`uses \`${symbol}\` in \`request.validateUsing(...)\` without importing or defining it`)
      }
    }
  }

  return errors
}

const failures = []
let checkedBlocks = 0

for (const filePath of DOC_FILES) {
  for (const block of extractBlocks(filePath)) {
    checkedBlocks += 1
    const errors = checkBlock(block)
    if (errors.length > 0) {
      failures.push({ block, errors })
    }
  }
}

if (failures.length > 0) {
  console.error(`Snippet validation failed: ${failures.length} block(s) out of ${checkedBlocks} checked.\n`)
  for (const failure of failures) {
    console.error(relativeLabel(failure.block))
    for (const error of failure.errors) {
      console.error(`  - ${error}`)
    }
    console.error('')
  }
  process.exit(1)
}

console.log(`Snippet validation passed: ${checkedBlocks} block(s) checked.`)
