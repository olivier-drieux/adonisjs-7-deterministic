#!/usr/bin/env node

import { assert, loadEvalCases, loadManifest, looksLikeRuleId } from './lib/catalog.mjs'

const manifest = loadManifest()
const evalCases = loadEvalCases()
const evalCaseIds = new Set(evalCases.map((testCase) => testCase.id))

assert(manifest.version === 1, 'manifest.version must be 1')
assert(manifest.mode === 'fail-closed', 'manifest.mode must be `fail-closed`')
assert(Array.isArray(manifest.source_hierarchy) && manifest.source_hierarchy.length === 3, 'source_hierarchy must contain 3 ordered entries')
assert(Array.isArray(manifest.protocol_steps) && manifest.protocol_steps.length === 6, 'protocol_steps must contain 6 ordered steps')
assert(Array.isArray(manifest.output_contract) && manifest.output_contract.length === 3, 'output_contract must contain 3 markers')
assert(Array.isArray(manifest.profiles) && manifest.profiles.length === 3, 'profiles must contain web, mixed, and api-only')
assert(Array.isArray(manifest.rules) && manifest.rules.length > 0, 'rules must be a non-empty array')

const protocolStepIds = new Set()
for (const step of manifest.protocol_steps) {
  assert(typeof step.id === 'string' && step.id.length > 0, 'each protocol step needs a non-empty id')
  assert(!protocolStepIds.has(step.id), `duplicate protocol step id: ${step.id}`)
  assert(typeof step.instruction === 'string' && step.instruction.length > 0, `protocol step ${step.id} needs an instruction`)
  protocolStepIds.add(step.id)
}

const outputIds = new Set()
for (const item of manifest.output_contract) {
  assert(typeof item.id === 'string' && item.id.length > 0, 'each output contract item needs a non-empty id')
  assert(!outputIds.has(item.id), `duplicate output contract id: ${item.id}`)
  assert(typeof item.marker === 'string' && item.marker.length > 0, `output contract ${item.id} needs a marker`)
  outputIds.add(item.id)
}

const profileIds = manifest.profiles.map((profile) => profile.id).sort()
assert(
  JSON.stringify(profileIds) === JSON.stringify(['api-only', 'mixed', 'web']),
  'profiles must be exactly web, mixed, and api-only'
)

assert(manifest.sync_contract && typeof manifest.sync_contract === 'object', 'sync_contract is required')
assert(Array.isArray(manifest.sync_contract.required_headings) && manifest.sync_contract.required_headings.length === 8, 'sync_contract.required_headings must contain 8 headings')
assert(Array.isArray(manifest.sync_contract.required_prompt_terms) && manifest.sync_contract.required_prompt_terms.length > 0, 'sync_contract.required_prompt_terms must be a non-empty array')
assert(Array.isArray(manifest.sync_contract.required_wrapper_terms) && manifest.sync_contract.required_wrapper_terms.length > 0, 'sync_contract.required_wrapper_terms must be a non-empty array')
assert(Array.isArray(manifest.sync_contract.output_markers) && manifest.sync_contract.output_markers.length === 3, 'sync_contract.output_markers must contain 3 markers')
assert(Array.isArray(manifest.sync_contract.core_blocker_ids) && manifest.sync_contract.core_blocker_ids.length > 0, 'sync_contract.core_blocker_ids must be a non-empty array')

const validTiers = new Set(['hard_blocker', 'enforced_default', 'advisory'])
const validRationales = new Set(['framework-doctrine', 'stack-lockin', 'team-discipline'])
const ruleIds = new Set()
const hardBlockerIds = new Set()
const stackLockinHardBlockerIds = new Set()
const referencedEvalIds = new Set()

for (const rule of manifest.rules) {
  assert(typeof rule.id === 'string' && looksLikeRuleId(rule.id), `invalid rule id: ${rule.id}`)
  assert(!ruleIds.has(rule.id), `duplicate rule id: ${rule.id}`)
  ruleIds.add(rule.id)

  assert(validTiers.has(rule.tier), `invalid tier for ${rule.id}: ${rule.tier}`)
  assert(
    validRationales.has(rule.enforcement_rationale),
    `${rule.id} must declare enforcement_rationale ∈ {framework-doctrine, stack-lockin, team-discipline} (got: ${rule.enforcement_rationale ?? 'missing'})`
  )
  assert(Array.isArray(rule.applies_to) && rule.applies_to.length > 0, `${rule.id} must declare applies_to`)
  assert(typeof rule.statement === 'string' && rule.statement.length > 0, `${rule.id} must declare statement`)
  assert(Array.isArray(rule.required_patterns), `${rule.id} must declare required_patterns`)
  assert(Array.isArray(rule.forbidden_patterns), `${rule.id} must declare forbidden_patterns`)
  assert(typeof rule.conflict_behavior === 'string' && rule.conflict_behavior.length > 0, `${rule.id} must declare conflict_behavior`)
  assert(typeof rule.override_allowed === 'boolean', `${rule.id} must declare override_allowed`)
  assert(Array.isArray(rule.test_ids) && rule.test_ids.length > 0, `${rule.id} must declare at least one test_id`)

  for (const testId of rule.test_ids) {
    assert(evalCaseIds.has(testId), `${rule.id} references missing eval case: ${testId}`)
    referencedEvalIds.add(testId)
  }

  if (rule.tier === 'hard_blocker') {
    hardBlockerIds.add(rule.id)
    assert(rule.override_allowed, `${rule.id} must allow explicit one-off overrides`)
    assert(
      rule.test_ids.some((testId) => testId.startsWith('ok_')),
      `${rule.id} needs at least one ok_* test`
    )
    assert(
      rule.test_ids.some((testId) => testId.startsWith('violation_')),
      `${rule.id} needs at least one violation_* test`
    )
    if (rule.enforcement_rationale === 'stack-lockin') {
      stackLockinHardBlockerIds.add(rule.id)
    }
  } else {
    assert(!rule.override_allowed, `${rule.id} must not allow override flow`)
  }
}

// Regression guard: every stack-lockin rule that was deliberately placed at hard_blocker tier
// must stay there. The override-flow friction on stack-lockin hard blockers is the feature, not
// a calibration mistake. If you are tempted to downgrade one to enforced_default, read the
// "Design Intent" section of SKILL.md and REVIEWING.md first.
const REQUIRED_STACK_LOCKIN_HARD_BLOCKERS = new Set([
  'hb.web-ui-stack',
  'hb.no-edge-feature-rendering',
  'hb.no-client-fetch-stack',
  'hb.no-client-form-stack',
])
for (const requiredId of REQUIRED_STACK_LOCKIN_HARD_BLOCKERS) {
  assert(
    stackLockinHardBlockerIds.has(requiredId),
    `${requiredId} must remain a stack-lockin hard_blocker (see SKILL.md Design Intent and REVIEWING.md). Downgrading defeats the purpose of the skill.`
  )
}

for (const blockerId of manifest.sync_contract.core_blocker_ids) {
  assert(hardBlockerIds.has(blockerId), `sync core blocker id is not a hard blocker: ${blockerId}`)
}

for (const testCase of evalCases) {
  assert(referencedEvalIds.has(testCase.id), `eval case is not referenced by any rule: ${testCase.id}`)
}

console.log(
  `Rules validation passed: ${manifest.rules.length} rules, ${hardBlockerIds.size} hard blockers, ${evalCases.length} eval cases.`
)
