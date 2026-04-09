#!/usr/bin/env node
//
// Local invariant check for the adonisjs-7-deterministic skill.
//
// Reads scripts/upstream_fixtures.json and asserts that:
//
//   1. Every `positive_fingerprint` is present in at least one canonical
//      doctrine file (SKILL.md, references/**/*.md, references/patterns/**/*.md).
//      A missing positive fingerprint is a WARNING (exit 0), not a hard fail:
//      it surfaces drift without breaking the build, because some fingerprints
//      may legitimately disappear when a section is restructured.
//
//   2. Every `anti_pattern` is ABSENT from the same canonical doctrine files
//      UNLESS the line explicitly contextualizes it as forbidden/old/wrong
//      (grep for a negation marker on the same line). An unguarded anti-pattern
//      occurrence is a HARD FAIL (exit 1): it means the skill has silently
//      regressed back to an obsolete form.
//
// This script does NOT fetch Context7 or any remote source. It is a fast,
// deterministic local regression guard. The quarterly Context7 sync documented
// in MAINTENANCE.md is what keeps upstream_fixtures.json itself current.
//

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

import { ROOT, relativeFromRoot, readJsonDocument } from './lib/catalog.mjs'

const FIXTURES_PATH = path.join(ROOT, 'scripts', 'upstream_fixtures.json')
const SKILL_PATH = path.join(ROOT, 'SKILL.md')
const REFERENCES_DIR = path.join(ROOT, 'references')
const PATTERNS_DIR = path.join(REFERENCES_DIR, 'patterns')

// Files where anti-patterns may legitimately appear as quoted counter-examples
// or validator source. These are NOT scanned for anti-pattern regressions.
// Every other doctrine file must keep anti-patterns guarded on the same line.
const ANTI_PATTERN_EXEMPT_FILES = new Set([
  // The fixtures file itself cites the anti-patterns as structured data.
  path.join(ROOT, 'scripts', 'upstream_fixtures.json'),
])

// Regex matching a negation marker that legitimizes an anti-pattern mention
// on the same line (e.g. "WRONG — do not use `vine.compile(vine.object(...))`").
// Must match case-insensitively.
const NEGATION_MARKERS =
  /\b(no\b|not\b|never\b|wrong\b|forbid|obsolet|legacy\b|anti-?pattern|deprecat|v6[- ]style|do\s+not\b|do\s+NOT\b|instead\b|rather\s+than|replaced?\s+by|old\b|former|previously|avoid\b|remove|removed\b|ban(?:ned)?\b|reject)/i

function collectMdFiles(dir) {
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.md'))
    .sort()
    .map((name) => path.join(dir, name))
}

function collectDoctrineFiles() {
  return [
    SKILL_PATH,
    ...collectMdFiles(REFERENCES_DIR),
    ...collectMdFiles(PATTERNS_DIR),
  ]
}

function readLines(filePath) {
  return fs.readFileSync(filePath, 'utf8').split('\n')
}

function findPositive(files, pattern) {
  const hits = []
  for (const file of files) {
    if (fs.readFileSync(file, 'utf8').includes(pattern)) {
      hits.push(file)
    }
  }
  return hits
}

function findAntiPatternLines(files, pattern) {
  // Return every `{ file, line, text }` match that is NOT guarded by a
  // negation marker on the same line.
  const unguarded = []
  for (const file of files) {
    if (ANTI_PATTERN_EXEMPT_FILES.has(file)) continue
    const lines = readLines(file)
    for (let i = 0; i < lines.length; i += 1) {
      const text = lines[i]
      if (!text.includes(pattern)) continue
      if (NEGATION_MARKERS.test(text)) continue
      unguarded.push({ file, line: i + 1, text: text.trim() })
    }
  }
  return unguarded
}

function main() {
  const fixtures = readJsonDocument(FIXTURES_PATH)
  const files = collectDoctrineFiles()

  const positives = Array.isArray(fixtures.positive_fingerprints)
    ? fixtures.positive_fingerprints
    : []
  const antiPatterns = Array.isArray(fixtures.anti_patterns)
    ? fixtures.anti_patterns
    : []

  const missingPositives = []
  for (const entry of positives) {
    const hits = findPositive(files, entry.pattern)
    if (hits.length === 0) {
      missingPositives.push(entry)
    }
  }

  const unguardedAntiPatterns = []
  for (const entry of antiPatterns) {
    const matches = findAntiPatternLines(files, entry.pattern)
    if (matches.length > 0) {
      unguardedAntiPatterns.push({ entry, matches })
    }
  }

  // Report warnings first (missing positives). Do not fail on warnings:
  // the quarterly Context7 sync is the moment to reconcile them.
  if (missingPositives.length > 0) {
    console.warn(
      `Upstream drift check — warning: ${missingPositives.length} positive fingerprint(s) missing from the doctrine files:\n`
    )
    for (const entry of missingPositives) {
      console.warn(`  - [${entry.rule_id}] ${entry.pattern}`)
      console.warn(`    topic: ${entry.topic}`)
      console.warn(`    why:   ${entry.why}`)
      console.warn('')
    }
  }

  // Hard fail on unguarded anti-patterns.
  if (unguardedAntiPatterns.length > 0) {
    const totalHits = unguardedAntiPatterns.reduce(
      (sum, { matches }) => sum + matches.length,
      0
    )
    console.error(
      `Upstream drift check FAILED: ${unguardedAntiPatterns.length} anti-pattern(s) reintroduced across ${totalHits} location(s).\n`
    )
    for (const { entry, matches } of unguardedAntiPatterns) {
      console.error(`  [${entry.rule_id}] ${entry.pattern}`)
      console.error(`    topic: ${entry.topic}`)
      console.error(`    why:   ${entry.why}`)
      for (const match of matches) {
        console.error(`    ${relativeFromRoot(match.file)}:${match.line}  ${match.text}`)
      }
      console.error('')
    }
    console.error(
      `If the anti-pattern is intentional (e.g. a counter-example), add a negation marker on the same line (not|never|wrong|forbidden|obsolete|...) or add the file to ANTI_PATTERN_EXEMPT_FILES in scripts/check_upstream.mjs.`
    )
    process.exit(1)
  }

  const matchedPositives = positives.length - missingPositives.length
  console.log(
    `Upstream drift check passed: ${matchedPositives}/${positives.length} positive fingerprints matched, ${antiPatterns.length} anti-patterns clean, ${files.length} files scanned.`
  )
}

main()
