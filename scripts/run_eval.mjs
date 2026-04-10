#!/usr/bin/env node
/**
 * run_eval.mjs — orchestrator for real LLM evaluation of the skill.
 *
 * Usage:
 *   node scripts/run_eval.mjs [options]
 *
 * Options:
 *   --cases id1,id2,...     Run only these eval case ids (default: all)
 *   --runs-per-config N     Number of runs per configuration (default: 2)
 *   --with-baseline         Also run each case WITHOUT the skill (default: false)
 *   --model name            Model override: sonnet, opus, haiku (default: sonnet)
 *   --timeout-ms N          Max wall-clock ms per run (default: 300000 = 5 min)
 *
 * Output:
 *   eval/workspace/iteration-NNN/
 *     eval-<case_id>/
 *       with_skill/run-1/{transcript.md, timing.json, outputs/, grading.json}
 *       without_skill/run-1/...   (only with --with-baseline)
 *     summary.json
 *
 * The grader is a second `claude -p` invocation per run. Total cost is
 * roughly (cases × configs × runs × 2) claude invocations.
 */

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

import { ROOT, readJsonDocument } from './lib/catalog.mjs'
import { runCase } from './lib/pipeline.mjs'
import { buildGraderPrompt } from './lib/grader_prompt.mjs'

const WORKSPACE_DIR = path.join(ROOT, 'eval', 'workspace')
const CASES_DIR = path.join(ROOT, 'eval', 'cases')
const EXPECTATIONS_DIR = path.join(ROOT, 'eval', 'expectations')
const SKILL_NAME = 'adonisjs-7-deterministic'

function parseArgs() {
  const args = process.argv.slice(2)
  const opts = {
    cases: null,
    runsPerConfig: 2,
    withBaseline: false,
    model: 'sonnet',
    timeoutMs: 300_000,
  }

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i]
    if (arg === '--cases' && args[i + 1]) {
      opts.cases = args[++i].split(',').map((s) => s.trim())
    } else if (arg === '--runs-per-config' && args[i + 1]) {
      opts.runsPerConfig = Number(args[++i])
    } else if (arg === '--with-baseline') {
      opts.withBaseline = true
    } else if (arg === '--model' && args[i + 1]) {
      opts.model = args[++i]
    } else if (arg === '--timeout-ms' && args[i + 1]) {
      opts.timeoutMs = Number(args[++i])
    } else if (arg === '--help' || arg === '-h') {
      console.log(`Usage: node scripts/run_eval.mjs [--cases id1,id2] [--runs-per-config N] [--with-baseline] [--model sonnet|opus|haiku] [--timeout-ms N]`)
      process.exit(0)
    }
  }

  return opts
}

function nextIterationDir() {
  fs.mkdirSync(WORKSPACE_DIR, { recursive: true })
  const existing = fs.readdirSync(WORKSPACE_DIR).filter((d) => d.startsWith('iteration-'))
  const maxNum = existing.reduce((max, d) => {
    const n = Number(d.replace('iteration-', ''))
    return Number.isFinite(n) && n > max ? n : max
  }, 0)
  const next = `iteration-${String(maxNum + 1).padStart(3, '0')}`
  const dir = path.join(WORKSPACE_DIR, next)
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

function loadCases(filterIds) {
  const allFiles = fs
    .readdirSync(CASES_DIR)
    .filter((f) => f.endsWith('.json'))
    .sort()

  const cases = allFiles.map((f) => readJsonDocument(path.join(CASES_DIR, f)))

  if (filterIds) {
    const filtered = cases.filter((c) => filterIds.includes(c.id))
    const missing = filterIds.filter((id) => !filtered.some((c) => c.id === id))
    if (missing.length > 0) {
      console.error(`Unknown case ids: ${missing.join(', ')}`)
      process.exit(1)
    }
    return filtered
  }
  return cases
}

function loadExpectations(caseId) {
  const filePath = path.join(EXPECTATIONS_DIR, `${caseId}.md`)
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing expectations file: eval/expectations/${caseId}.md`)
  }
  return fs.readFileSync(filePath, 'utf8')
}

function buildPrompt(evalCase, config) {
  if (config === 'with_skill') {
    return evalCase.prompt
  }
  // Strip the skill invocation prefix for baseline
  return evalCase.prompt
    .replace(/^Use \$adonisjs-7-deterministic to /i, '')
    .replace(/^use \$adonisjs-7-deterministic /i, '')
}

function grade({ expectations, transcriptPath, runDir, model, timeoutMs }) {
  const transcript = fs.readFileSync(transcriptPath, 'utf8')
  const gradingPath = path.join(runDir, 'grading.json')

  const prompt = buildGraderPrompt({
    expectations,
    transcript,
    gradingOutputPath: gradingPath,
  })

  console.log('    grading...')
  runCase({
    prompt,
    runDir: path.join(runDir, '_grader_work'),
    model,
    timeoutMs,
  })

  // The grader should have written grading.json directly via the prompt.
  // If it didn't (e.g. the grader wrote it to _grader_work instead), try to
  // find it and move it.
  if (!fs.existsSync(gradingPath)) {
    // Search in _grader_work outputs
    const graderWorkDir = path.join(runDir, '_grader_work')
    const candidates = [
      path.join(graderWorkDir, 'grading.json'),
      path.join(graderWorkDir, 'outputs', 'grading.json'),
    ]
    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        fs.copyFileSync(candidate, gradingPath)
        break
      }
    }
  }

  if (fs.existsSync(gradingPath)) {
    try {
      return readJsonDocument(gradingPath)
    } catch {
      console.warn(`    warning: grading.json exists but is not valid JSON`)
      return null
    }
  }

  console.warn(`    warning: grader did not produce grading.json`)
  return null
}

function summarize(allResults) {
  const byConfig = {}
  for (const result of allResults) {
    const config = result.configuration
    if (!byConfig[config]) byConfig[config] = []
    byConfig[config].push(result)
  }

  const stats = (key, entries) => {
    const values = entries.map((e) => e[key]).filter((v) => typeof v === 'number')
    if (values.length === 0) return { mean: 0, stddev: 0, min: 0, max: 0 }
    const mean = values.reduce((a, b) => a + b, 0) / values.length
    const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length
    return {
      mean: +mean.toFixed(4),
      stddev: +Math.sqrt(variance).toFixed(4),
      min: +Math.min(...values).toFixed(4),
      max: +Math.max(...values).toFixed(4),
    }
  }

  const runSummary = {}
  for (const [config, entries] of Object.entries(byConfig)) {
    runSummary[config] = {
      pass_rate: stats('pass_rate', entries),
      time_seconds: stats('time_seconds', entries),
    }
  }

  const delta = {}
  if (runSummary.with_skill && runSummary.without_skill) {
    delta.pass_rate = `${runSummary.with_skill.pass_rate.mean >= runSummary.without_skill.pass_rate.mean ? '+' : ''}${(runSummary.with_skill.pass_rate.mean - runSummary.without_skill.pass_rate.mean).toFixed(4)}`
    delta.time_seconds = `${runSummary.with_skill.time_seconds.mean >= runSummary.without_skill.time_seconds.mean ? '+' : ''}${(runSummary.with_skill.time_seconds.mean - runSummary.without_skill.time_seconds.mean).toFixed(1)}`
  }

  return {
    metadata: {
      skill_name: SKILL_NAME,
      timestamp: new Date().toISOString(),
      total_runs: allResults.length,
    },
    runs: allResults,
    run_summary: runSummary,
    delta,
  }
}

async function main() {
  const opts = parseArgs()
  const cases = loadCases(opts.cases)
  const iterDir = nextIterationDir()
  const iterName = path.basename(iterDir)
  const configs = ['with_skill']
  if (opts.withBaseline) configs.push('without_skill')

  const totalRuns = cases.length * configs.length * opts.runsPerConfig
  console.log(`\n${iterName}: ${cases.length} case(s) × ${configs.length} config(s) × ${opts.runsPerConfig} run(s) = ${totalRuns} total invocations\n`)
  console.log(`Model: ${opts.model}, timeout: ${opts.timeoutMs}ms`)
  console.log(`Output: ${path.relative(ROOT, iterDir)}\n`)

  const allResults = []

  for (const evalCase of cases) {
    const expectations = loadExpectations(evalCase.id)
    const caseDir = path.join(iterDir, `eval-${evalCase.id}`)
    fs.mkdirSync(caseDir, { recursive: true })

    for (const config of configs) {
      const configDir = path.join(caseDir, config)

      for (let run = 1; run <= opts.runsPerConfig; run += 1) {
        const runDir = path.join(configDir, `run-${run}`)
        const prompt = buildPrompt(evalCase, config)

        console.log(`  [${evalCase.id}] ${config} run-${run}`)
        console.log('    executing...')

        const execResult = runCase({
          prompt,
          runDir,
          model: opts.model,
          timeoutMs: opts.timeoutMs,
        })

        console.log(`    done in ${(execResult.durationMs / 1000).toFixed(1)}s (exit ${execResult.status})`)

        // Grade the run
        const grading = grade({
          expectations,
          transcriptPath: execResult.transcriptPath,
          runDir,
          model: opts.model,
          timeoutMs: opts.timeoutMs,
        })

        const result = {
          eval_id: evalCase.id,
          eval_name: evalCase.id,
          configuration: config,
          run_number: run,
          pass_rate: grading?.summary?.pass_rate ?? 0,
          time_seconds: +(execResult.durationMs / 1000).toFixed(2),
          passed: grading?.summary?.passed ?? 0,
          failed: grading?.summary?.failed ?? 0,
          total: grading?.summary?.total ?? 0,
          graded: grading !== null,
        }

        allResults.push(result)
        console.log(`    pass_rate: ${result.pass_rate} (${result.passed}/${result.total})`)
        console.log('')
      }
    }
  }

  // Write summary
  const summary = summarize(allResults)
  const summaryPath = path.join(iterDir, 'summary.json')
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf8')

  // Print summary
  console.log('─'.repeat(60))
  console.log(`${iterName} complete. ${allResults.length} run(s) graded.\n`)

  for (const [config, configSummary] of Object.entries(summary.run_summary)) {
    console.log(`  ${config}:`)
    console.log(`    pass_rate: ${configSummary.pass_rate.mean} ± ${configSummary.pass_rate.stddev}`)
    console.log(`    time:      ${configSummary.time_seconds.mean}s ± ${configSummary.time_seconds.stddev}s`)
    console.log('')
  }

  if (summary.delta.pass_rate) {
    console.log(`  delta pass_rate: ${summary.delta.pass_rate}`)
    console.log(`  delta time:      ${summary.delta.time_seconds}s`)
    console.log('')
  }

  console.log(`Summary written to: ${path.relative(ROOT, summaryPath)}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
