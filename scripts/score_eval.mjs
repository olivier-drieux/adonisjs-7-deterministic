#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

import {
  countQuestions,
  loadEvalCases,
  loadManifest,
  normalizeText,
  readJsonDocument,
  ROOT,
} from './lib/catalog.mjs'

function parseArgs(argv) {
  const args = {}

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]
    const nextToken = argv[index + 1]

    if (token === '--case' && nextToken) {
      args.case = nextToken
      index += 1
    } else if (token === '--response' && nextToken) {
      args.response = nextToken
      index += 1
    }
  }

  return args
}

function loadCase(caseArg) {
  const knownCases = loadEvalCases()
  const directMatch = knownCases.find((testCase) => testCase.id === caseArg)
  if (directMatch) return directMatch

  const resolvedPath = path.resolve(ROOT, caseArg)
  return { filePath: resolvedPath, ...readJsonDocument(resolvedPath) }
}

const args = parseArgs(process.argv.slice(2))

if (!args.case || !args.response) {
  console.error('Usage: node scripts/score_eval.mjs --case <case-id|path> --response <path>')
  process.exit(1)
}

const manifest = loadManifest()
const evalCase = loadCase(args.case)
const responseText = fs.readFileSync(path.resolve(ROOT, args.response), 'utf8')
const normalizedResponse = normalizeText(responseText)
const knownRuleIdPattern = new RegExp(
  manifest.rules.map((rule) => rule.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'),
  'i'
)

const checks = []

for (const pattern of evalCase.required_patterns) {
  checks.push({
    kind: 'required_pattern',
    pattern,
    passed: normalizedResponse.includes(normalizeText(pattern)),
  })
}

for (const pattern of evalCase.forbidden_patterns) {
  checks.push({
    kind: 'forbidden_pattern',
    pattern,
    passed: !normalizedResponse.includes(normalizeText(pattern)),
  })
}

const questionCount = countQuestions(responseText)

checks.push({
  kind: 'override_question_count',
  expected: evalCase.must_ask_override ? 1 : 0,
  actual: questionCount,
  passed: evalCase.must_ask_override ? questionCount === 1 : questionCount === 0,
})

checks.push({
  kind: 'rule_id_named',
  expected: evalCase.must_name_rule,
  passed: evalCase.must_name_rule ? knownRuleIdPattern.test(responseText) : true,
})

const passedChecks = checks.filter((check) => check.passed).length
const score = checks.length === 0 ? 1 : passedChecks / checks.length
const passed = passedChecks === checks.length

console.log(
  JSON.stringify(
    {
      case: evalCase.id,
      passed,
      score,
      passed_checks: passedChecks,
      total_checks: checks.length,
      checks,
    },
    null,
    2
  )
)

if (!passed) {
  process.exit(1)
}
