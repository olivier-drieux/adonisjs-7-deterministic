# Maintenance

This document is the operator manual for keeping `adonisjs-ai-doctrine` in sync with the AdonisJS v7 upstream documentation and its own internal invariants. It is written for a single human maintainer and describes a reproducible process, not a CI pipeline. The validators under `scripts/` run on every commit; the Context7 sync described here runs on a cadence.

## Cadence

- **Quarterly full sync.** Run the 10 Context7 queries below, produce a divergence report, apply fixes. Bump `last_synced` at the bottom of this file.
- **Opportunistic sync.** Trigger the full process on any of:
  - A new AdonisJS minor or major release (`@adonisjs/core`, `@adonisjs/inertia`, `@adonisjs/auth`, `@adonisjs/lucid`).
  - A breaking change on any official side-effect package (`@adonisjs/bouncer`, `@adonisjs/mail`, `@adonisjs/drive`).
  - A rename of a `node ace` generator or an `adonisrc.ts` hook.
  - A reported drift against a live project using the skill.

`last_synced` at the bottom of this file is the source of truth for "when did this skill last see upstream docs". Bump it at the end of every sync, even if the divergence report was empty.

## Ownership

Single maintainer: **@olivier** (git user `Olivier Drieux`).

Every PR must:

1. Pass `node scripts/validate_all.mjs` green.
2. If the sync introduced doctrine changes, include a divergence report entry in the commit message using the template below.
3. Not bypass any validator (`--no-verify`, skipping `typecheck_snippets.mjs`, etc.).

## The 10 canonical Context7 queries

Run these against the Context7 library id `/adonisjs/v7-docs` (or `/adonisjs/docs` once v7 becomes the default). Paste each phrase into `mcp__context7__query-docs` one at a time and read the response in full. Do **not** shortcut to a single broad query — each topic targets a different area of the upstream docs.

1. `Node.js npm version prerequisites installation requirements`
2. `starter kits available kit options hypermedia react vue api`
3. `authentication session cookie access tokens guard names v7`
4. `Lucid ORM model migration query builder v7 changes`
5. `VineJS validation request.validateUsing v7`
6. `Inertia React shared props middleware setup v7`
7. `node ace generators commands v7`
8. `routing named routes middleware kernel v7`
9. `bouncer mail drive official packages v7`
10. `adonisrc.ts hooks indexEntities indexPages indexPolicies generateRegistry`

After reading the response for each topic, note any delta against the current skill state in the divergence report (next section). Do not apply fixes while collecting divergences — the report is the input for the fix step.

## Divergence report template

Append one block per divergence found. Keep blocks terse; they exist to anchor the fix, not to document the upstream docs in full.

```
### <short title>

- Topic: <one of the 10 Context7 topics>
- Current skill state: <exact file path and line, or rule id>
- Upstream state: <short summary of what docs.adonisjs.com says>
- Delta: <what is wrong in the skill — renamed API, new default, removed surface, etc.>
- Proposed fix: <concrete action — "rename X to Y in references/auth.md", "add Z to rules/manifest.json">
- Affected rule ids: <hb.* or ed.* ids touched>
- Affected files:
  - path/to/file.md
  - rules/manifest.json
```

## Fix workflow

Once the divergence report is complete:

1. Create a branch: `git checkout -b sync/context7-YYYY-MM-DD`.
2. Run `node scripts/check_upstream.mjs` to confirm no regression against the known-good local fixtures **before** applying changes. This snapshot is what you are about to update.
3. Apply fixes **in references first**, then patterns, then the rules manifest, then SKILL.md, then the wrappers and entrypoints. This order minimizes the chance of validator churn.
4. Run `node scripts/typecheck_snippets.mjs` after every references edit — the stub workspace at `scripts/stubs/` catches missing symbols and broken imports early.
5. Run the full validation: `node scripts/validate_all.mjs`. Every validator must pass.
6. If a rule id changed in the manifest, update the matching `eval/cases/*.json` `test_ids` fields and regenerate `scripts/upstream_fixtures.json` if the canonical wording of a fingerprint changed.
7. Update `scripts/upstream_fixtures.json` if a new canonical pattern should be enforced, or if an anti-fingerprint needs to be added.
8. Bump `last_synced` at the bottom of this file.
9. Commit with a message that follows the repo convention (`fix(skill-doctrine): ...` for bug fixes against upstream, `feat(skill-doctrine): ...` for new surface).

## Updating `scripts/upstream_fixtures.json`

`check_upstream.mjs` reads `scripts/upstream_fixtures.json` and asserts that every **positive** fingerprint is present in `SKILL.md`, `references/**/*.md`, and `references/patterns/**/*.md`, and that every **anti-pattern** is absent (excluding `FORBIDDEN.md`-style contrarian files).

When the Context7 sync reveals that a canonical API has been renamed:

1. Add the **new** canonical form to `fixtures.positive`.
2. Add the **old** form to `fixtures.anti_patterns`.
3. Run `node scripts/check_upstream.mjs`. It will fail until every reference is updated.
4. Update references, patterns, SKILL.md, and the wrappers/entrypoints one file at a time until the script passes.
5. Commit fixtures and content updates in the same commit so the snapshot stays consistent.

Do not remove old positive fingerprints when they are no longer canonical; promote them to anti-patterns instead. An explicit anti-pattern prevents silent reintroduction via copy-paste from old AdonisJS v6 code.

## Sync completion checklist

Before considering a sync done:

- [ ] All 10 Context7 topics were queried and read in full.
- [ ] Every divergence found has an entry in the divergence report.
- [ ] Every divergence report entry has a corresponding code change.
- [ ] `node scripts/validate_all.mjs` passes locally.
- [ ] `scripts/upstream_fixtures.json` is updated if any canonical surface changed.
- [ ] `SKILL.md`, `rules/manifest.json`, `references/**/*.md`, `assets/wrappers/*.md`, and `assets/entrypoints/*.md` all reflect the new doctrine.
- [ ] No validator was bypassed with `--no-verify` or an equivalent.
- [ ] `last_synced` bumped at the bottom of this file.
- [ ] Commit message follows the repo convention and cites affected rule ids.

## Running real evals

`scripts/run_eval.mjs` launches real `claude -p` invocations against the eval cases, grades each response via a grader subagent, and produces a `summary.json` with pass rate, timing, and delta (with-skill vs baseline).

### Quick start (pilot — 2 cases, 1 run each)

```sh
node scripts/run_eval.mjs --cases ok_web_standard,violation_custom_api_key --runs-per-config 1
```

### Full run (all 25 cases, 2 runs each, with baseline comparison)

```sh
node scripts/run_eval.mjs --with-baseline --runs-per-config 2
```

### Options

| Flag | Default | Description |
|---|---|---|
| `--cases id1,id2` | all 25 | Comma-separated case ids to run |
| `--runs-per-config N` | 2 | Number of runs per configuration |
| `--with-baseline` | off | Also run each case WITHOUT the skill for delta comparison |
| `--model name` | sonnet | Model override: `sonnet`, `opus`, `haiku` |
| `--timeout-ms N` | 300000 | Max wall-clock ms per run (5 min) |

### Cost estimate

Each run invokes `claude -p` twice (executor + grader). Approximate cost per full run with baseline:

| Model | Approx. cost for 25 cases × 2 configs × 2 runs = 200 invocations |
|---|---|
| Sonnet 4.6 | ~$2–5 (API key) or ~5–10% of Max weekly quota |
| Haiku 4.5 | ~$0.50–1 |
| Opus 4.6 | ~$10–20 |

### Output structure

```
eval/workspace/iteration-NNN/
  eval-<case_id>/
    with_skill/run-1/{transcript.md, timing.json, outputs/, grading.json}
    without_skill/run-1/...   (only with --with-baseline)
  summary.json
```

### Expected thresholds

After a clean sync, expect:

- `with_skill.pass_rate.mean ≥ 0.80`
- `without_skill.pass_rate.mean ≤ 0.45` (baseline Claude without skill guidance)
- `delta ≥ 0.35`

A pass rate regression after a doctrine change signals a problem. Check the per-case `grading.json` files for the `eval_feedback.suggestions` field — the grader explains why expectations failed.

### When to run

- **Quarterly**: after each Context7 sync, to confirm the sync did not degrade skill effectiveness.
- **Before release**: after any structural change to SKILL.md, wrappers, or the manifest.
- **On demand**: when comparing two formulations of a rule (run both, pick the one with higher pass rate).

No LLM runs are required during routine maintenance. The pre-commit validators (`validate_all.mjs`) remain the fast guard; `run_eval.mjs` is the measurement layer.

---

last_synced: 2026-04-09 (Context7 sync: monorepo correction + FORBIDDEN.md removal + phase 1 rollout)
