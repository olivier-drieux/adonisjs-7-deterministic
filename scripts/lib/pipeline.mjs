/**
 * pipeline.mjs — thin wrapper around `claude -p` for the eval pipeline.
 *
 * Spawns a non-interactive Claude Code session, captures the transcript,
 * records timing, and writes outputs to the designated run directory.
 */

import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

/**
 * @param {object} opts
 * @param {string} opts.prompt — full prompt to send to claude
 * @param {string} opts.runDir — directory to write transcript.md and timing.json
 * @param {string} [opts.model] — model override (e.g. 'sonnet', 'haiku')
 * @param {number} [opts.timeoutMs=300_000] — max wall-clock time (5 min default)
 * @param {boolean} [opts.allowWrite=false] — if true, skip all permission checks (used for grader)
 * @param {string} [opts.permissionMode] — --permission-mode value (e.g. 'acceptEdits' for executor)
 * @param {string[]} [opts.addDirs] — extra directories to grant tool access to (--add-dir)
 * @returns {{ status: number, durationMs: number, transcriptPath: string }}
 */
export function runCase({ prompt, runDir, model, timeoutMs = 300_000, allowWrite = false, permissionMode, addDirs = [] }) {
  fs.mkdirSync(runDir, { recursive: true })
  const outputsDir = path.join(runDir, 'outputs')
  fs.mkdirSync(outputsDir, { recursive: true })

  const args = [
    '-p',
    prompt,
    '--output-format',
    'text',
    '--no-session-persistence',
  ]

  if (allowWrite) {
    args.push('--dangerously-skip-permissions')
  } else if (permissionMode) {
    args.push('--permission-mode', permissionMode)
  }

  for (const dir of addDirs) {
    args.push('--add-dir', dir)
  }

  if (model) {
    args.push('--model', model)
  }

  const start = performance.now()
  const result = spawnSync('claude', args, {
    cwd: process.cwd(),
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
    timeout: timeoutMs,
  })
  const durationMs = Math.round(performance.now() - start)

  const stdout = result.stdout || ''
  const stderr = result.stderr || ''
  const transcript = stdout || `[claude exited with status ${result.status}]\n\n${stderr}`

  const transcriptPath = path.join(runDir, 'transcript.md')
  fs.writeFileSync(transcriptPath, transcript, 'utf8')

  const timingPath = path.join(runDir, 'timing.json')
  fs.writeFileSync(
    timingPath,
    JSON.stringify(
      {
        duration_ms: durationMs,
        duration_seconds: +(durationMs / 1000).toFixed(2),
        status: result.status,
        signal: result.signal || null,
      },
      null,
      2
    ),
    'utf8'
  )

  return {
    status: result.status ?? 1,
    durationMs,
    transcriptPath,
    outputsDir,
  }
}
