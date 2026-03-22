#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'

import { assert, loadManifest, missingTerms, ROOT, WRAPPERS_DIR } from './lib/catalog.mjs'

const manifest = loadManifest()
const skillPath = path.join(ROOT, 'SKILL.md')
const openAiPath = path.join(ROOT, 'agents', 'openai.yaml')
const wrapperPaths = [
  path.join(WRAPPERS_DIR, 'codex.md'),
  path.join(WRAPPERS_DIR, 'claude.md'),
  path.join(WRAPPERS_DIR, 'vscode.instructions.md'),
]

const skillText = fs.readFileSync(skillPath, 'utf8')
const openAiText = fs.readFileSync(openAiPath, 'utf8')

let previousIndex = -1
for (const heading of manifest.sync_contract.required_headings) {
  const index = skillText.indexOf(heading)
  assert(index >= 0, `SKILL.md is missing heading: ${heading}`)
  assert(index > previousIndex, `SKILL.md headings are out of order around: ${heading}`)
  previousIndex = index
}

const sharedSkillTerms = [
  manifest.mode,
  ...manifest.protocol_steps.map((step) => step.id),
  ...manifest.sync_contract.core_blocker_ids,
  ...manifest.sync_contract.output_markers,
]

const missingInSkill = missingTerms(skillText, sharedSkillTerms)
assert(missingInSkill.length === 0, `SKILL.md is missing sync terms: ${missingInSkill.join(', ')}`)

const promptTerms = [
  ...manifest.sync_contract.required_prompt_terms,
  ...manifest.sync_contract.core_blocker_ids,
  ...manifest.sync_contract.output_markers,
]

const missingInPrompt = missingTerms(openAiText, promptTerms)
assert(missingInPrompt.length === 0, `agents/openai.yaml is missing sync terms: ${missingInPrompt.join(', ')}`)

const wrapperTerms = [
  ...manifest.sync_contract.required_wrapper_terms,
  ...manifest.sync_contract.core_blocker_ids,
  ...manifest.sync_contract.output_markers,
]

for (const wrapperPath of wrapperPaths) {
  const wrapperText = fs.readFileSync(wrapperPath, 'utf8')
  const missing = missingTerms(wrapperText, wrapperTerms)
  assert(missing.length === 0, `${path.basename(wrapperPath)} is missing sync terms: ${missing.join(', ')}`)
}

console.log(`Sync validation passed: SKILL.md, agents/openai.yaml, and ${wrapperPaths.length} wrappers are aligned.`)
