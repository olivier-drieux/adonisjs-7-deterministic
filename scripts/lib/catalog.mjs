import fs from 'node:fs'
import path from 'node:path'

export const ROOT = path.resolve(import.meta.dirname, '../..')
export const SKILL_ROOT = path.join(ROOT, 'skills', 'adonisjs-ai-doctrine')
export const MANIFEST_PATH = path.join(SKILL_ROOT, 'rules', 'manifest.json')
export const EVAL_CASES_DIR = path.join(ROOT, 'eval', 'cases')
export const WRAPPERS_DIR = path.join(SKILL_ROOT, 'assets', 'wrappers')

export function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

export function relativeFromRoot(filePath) {
  return path.relative(ROOT, filePath)
}

export function readJsonDocument(filePath) {
  const text = fs.readFileSync(filePath, 'utf8').trim()

  try {
    return JSON.parse(text)
  } catch (error) {
    throw new Error(
      `Failed to parse ${relativeFromRoot(filePath)} as JSON: ${error.message}`
    )
  }
}

export function loadManifest() {
  return readJsonDocument(MANIFEST_PATH)
}

export function loadEvalCases() {
  return fs
    .readdirSync(EVAL_CASES_DIR)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => {
      const filePath = path.join(EVAL_CASES_DIR, name)
      return { filePath, ...readJsonDocument(filePath) }
    })
}

export function normalizeText(value) {
  return String(value).toLowerCase()
}

export function missingTerms(text, terms) {
  const normalized = normalizeText(text)
  return terms.filter((term) => !normalized.includes(normalizeText(term)))
}

export function countQuestions(text) {
  const stripped = String(text).replace(/```[\s\S]*?```/g, '')
  return Array.from(stripped.matchAll(/\?/g)).length
}

export function looksLikeRuleId(value) {
  return /^(hb|ed|adv)\.[a-z0-9.-]+$/.test(value)
}
