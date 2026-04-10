#!/usr/bin/env node
/**
 * Asserts that every eval case in eval/cases/ has a matching
 * eval/expectations/<id>.md file, and vice-versa.
 */

import fs from 'node:fs'
import path from 'node:path'

import { assert, ROOT } from './lib/catalog.mjs'

const CASES_DIR = path.join(ROOT, 'eval', 'cases')
const EXPECTATIONS_DIR = path.join(ROOT, 'eval', 'expectations')

const caseIds = fs
  .readdirSync(CASES_DIR)
  .filter((f) => f.endsWith('.json'))
  .map((f) => f.replace('.json', ''))
  .sort()

const expectationIds = fs
  .readdirSync(EXPECTATIONS_DIR)
  .filter((f) => f.endsWith('.md'))
  .map((f) => f.replace('.md', ''))
  .sort()

const missingExpectations = caseIds.filter((id) => !expectationIds.includes(id))
assert(
  missingExpectations.length === 0,
  `Eval cases missing expectations files: ${missingExpectations.join(', ')}`
)

const orphanExpectations = expectationIds.filter((id) => !caseIds.includes(id))
assert(
  orphanExpectations.length === 0,
  `Orphan expectations with no eval case: ${orphanExpectations.join(', ')}`
)

console.log(
  `Eval expectations validation passed: ${caseIds.length} case(s) matched to ${expectationIds.length} expectation(s).`
)
