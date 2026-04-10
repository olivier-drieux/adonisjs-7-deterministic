#!/usr/bin/env node

import path from 'node:path'
import process from 'node:process'
import { execFileSync } from 'node:child_process'

const scripts = [
  'validate_snippets.mjs',
  'typecheck_snippets.mjs',
  'validate_rules.mjs',
  'validate_evals.mjs',
  'validate_eval_expectations.mjs',
  'validate_sync.mjs',
  'check_upstream.mjs',
]

for (const script of scripts) {
  const scriptPath = path.join(import.meta.dirname, script)
  execFileSync(process.execPath, [scriptPath], { stdio: 'inherit' })
}

console.log('Strict validation passed.')
