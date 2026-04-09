#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { spawnSync } from 'node:child_process'

import { ROOT } from './lib/catalog.mjs'
import { DOC_FILES, extractBlocks, isPartial, relativeLabel } from './lib/snippets.mjs'

const STUBS_DIR = path.join(ROOT, 'scripts', 'stubs')
const CACHE_DIR = path.join(STUBS_DIR, '.snippets-cache')
const TSCONFIG_PATH = path.join(STUBS_DIR, 'tsconfig.snippets.json')
const TYPESCRIPT_VERSION = '5.9.3'

function cleanCacheDir() {
  if (fs.existsSync(CACHE_DIR)) {
    fs.rmSync(CACHE_DIR, { recursive: true, force: true })
  }
  fs.mkdirSync(CACHE_DIR, { recursive: true })
}

function sanitize(relativePath) {
  return relativePath.replace(/[\\/]/g, '__').replace(/\./g, '_')
}

function writeSnippets() {
  const index = []
  for (const filePath of DOC_FILES) {
    const blocks = extractBlocks(filePath)
    for (const block of blocks) {
      if (isPartial(block)) continue
      const relative = path.relative(ROOT, block.filePath)
      const slug = sanitize(relative)
      const isTsx = block.lang === 'tsx'
      const fileName = `${slug}_L${block.startLine}.${isTsx ? 'tsx' : 'ts'}`
      const outPath = path.join(CACHE_DIR, fileName)
      fs.writeFileSync(outPath, block.text, 'utf8')
      index.push({
        outPath,
        fileName,
        sourceFile: relative,
        startLine: block.startLine,
      })
    }
  }
  return index
}

function runTsc() {
  // `npx --yes -p typescript@X tsc ...` resolves the `tsc` binary from the
  // typescript package. Passing `typescript@X` as the positional argument
  // (instead of `-p`) makes npm look up a binary literally named
  // `typescript`, which does not exist and errors out with
  // "could not determine executable to run".
  const args = [
    '--yes',
    '-p',
    `typescript@${TYPESCRIPT_VERSION}`,
    'tsc',
    '--noEmit',
    '--pretty',
    'false',
    '--project',
    TSCONFIG_PATH,
  ]
  const result = spawnSync('npx', args, {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
  })
  if (result.error) {
    return { status: 127, stdout: '', stderr: String(result.error) }
  }
  return {
    status: typeof result.status === 'number' ? result.status : 1,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
  }
}

function parseTscOutput(output, index) {
  // tsc line format: "scripts/stubs/.snippets-cache/foo.tsx(3,5): error TS2345: message"
  const errorRe = /^(.+?)\((\d+),(\d+)\):\s*(error|warning)\s+(TS\d+):\s*(.*)$/
  const indexByName = new Map(index.map((entry) => [entry.fileName, entry]))
  const mapped = []
  const unmapped = []
  for (const rawLine of output.split('\n')) {
    const line = rawLine.trim()
    if (!line) continue
    const match = line.match(errorRe)
    if (!match) {
      if (
        line.startsWith('Found ') ||
        line.startsWith('error TS') ||
        line.includes('Cannot find')
      ) {
        unmapped.push(line)
      }
      continue
    }
    const [, filePath, stubLine, column, severity, code, message] = match
    const fileName = path.basename(filePath)
    const entry = indexByName.get(fileName)
    if (!entry) {
      unmapped.push(`${filePath}(${stubLine},${column}): ${severity} ${code}: ${message}`)
      continue
    }
    const sourceLine = entry.startLine + Number(stubLine) - 1
    mapped.push({
      sourceFile: entry.sourceFile,
      sourceLine,
      severity,
      code,
      message,
    })
  }
  return { mapped, unmapped }
}

function formatErrors(mapped, unmapped) {
  const lines = []
  const bySource = new Map()
  for (const error of mapped) {
    const key = error.sourceFile
    if (!bySource.has(key)) bySource.set(key, [])
    bySource.get(key).push(error)
  }
  for (const [source, errors] of [...bySource.entries()].sort()) {
    lines.push(source)
    errors.sort((a, b) => a.sourceLine - b.sourceLine)
    for (const error of errors) {
      lines.push(`  L${error.sourceLine}: ${error.code} ${error.message}`)
    }
    lines.push('')
  }
  if (unmapped.length > 0) {
    lines.push('Unmapped tsc diagnostics:')
    for (const line of unmapped) {
      lines.push(`  ${line}`)
    }
    lines.push('')
  }
  return lines.join('\n')
}

function main() {
  cleanCacheDir()
  const index = writeSnippets()
  let partialSkipped = 0
  for (const filePath of DOC_FILES) {
    for (const block of extractBlocks(filePath)) {
      if (isPartial(block)) partialSkipped += 1
    }
  }

  const { status, stdout, stderr } = runTsc()
  const combined = `${stdout}\n${stderr}`.trim()

  if (status === 127 || /not found/.test(stderr)) {
    console.error('Typecheck skipped: `npx` is not available on PATH.')
    console.error('Install Node.js (which ships with npx) or add it to PATH, then re-run.')
    process.exit(1)
  }

  if (status !== 0) {
    const { mapped, unmapped } = parseTscOutput(combined, index)
    const totalDiagnostics = mapped.length + unmapped.length
    console.error(
      `Snippet typecheck failed: ${mapped.length} mapped error(s) across ${index.length} block(s) checked, ${partialSkipped} partial skipped.\n`
    )
    if (totalDiagnostics === 0) {
      // tsc/npx crashed before producing TS diagnostics — show the raw
      // subprocess output so the failure is visible (missing binary, bad
      // tsconfig, etc.).
      console.error('No TypeScript diagnostics were produced. Raw subprocess output:\n')
      console.error(combined)
    } else {
      console.error(formatErrors(mapped, unmapped))
    }
    // Leave the cache dir in place for inspection when tsc fails, so a dev
    // can open the offending .tsx file at the reported line. It is cleaned
    // up at the start of the next run.
    process.exit(1)
  }

  console.log(
    `Snippet typecheck passed: ${index.length} block(s) checked, ${partialSkipped} partial skipped.`
  )

  // Clean up temp files on success.
  cleanCacheDir()
  fs.rmSync(CACHE_DIR, { recursive: true, force: true })
}

main()
