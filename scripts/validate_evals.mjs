#!/usr/bin/env node

import { assert, loadEvalCases } from './lib/catalog.mjs'

const evalCases = loadEvalCases()
const evalIds = new Set()
const validProfiles = new Set(['web', 'mixed', 'api-only'])
const validModes = new Set(['proceed', 'ask_override'])

for (const testCase of evalCases) {
  assert(typeof testCase.id === 'string' && testCase.id.length > 0, 'each eval case needs a non-empty id')
  assert(!evalIds.has(testCase.id), `duplicate eval case id: ${testCase.id}`)
  evalIds.add(testCase.id)

  assert(typeof testCase.prompt === 'string' && testCase.prompt.length > 0, `${testCase.id} must declare prompt`)
  assert(validProfiles.has(testCase.profile_expected), `${testCase.id} has invalid profile_expected`)
  assert(validModes.has(testCase.expected_mode), `${testCase.id} has invalid expected_mode`)
  assert(Array.isArray(testCase.required_patterns), `${testCase.id} must declare required_patterns`)
  assert(Array.isArray(testCase.forbidden_patterns), `${testCase.id} must declare forbidden_patterns`)
  assert(typeof testCase.must_ask_override === 'boolean', `${testCase.id} must declare must_ask_override`)
  assert(typeof testCase.must_name_rule === 'boolean', `${testCase.id} must declare must_name_rule`)

  if (testCase.id.startsWith('ok_')) {
    assert(testCase.expected_mode === 'proceed', `${testCase.id} must use expected_mode=proceed`)
    assert(!testCase.must_ask_override, `${testCase.id} must not ask for override`)
  }

  if (testCase.id.startsWith('violation_')) {
    assert(testCase.expected_mode === 'ask_override', `${testCase.id} must use expected_mode=ask_override`)
    assert(testCase.must_ask_override, `${testCase.id} must require override flow`)
    assert(testCase.must_name_rule, `${testCase.id} must require the blocking rule id`)
  }
}

console.log(`Eval validation passed: ${evalCases.length} cases checked.`)
