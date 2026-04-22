# adonisjs-ai-doctrine

Fail-closed multi-agent skill pack for private AdonisJS v7 applications. Forces deterministic, framework-native structure with official AdonisJS packages across every AI coding agent (Claude Code, Codex, Cursor, GitHub Copilot, VS Code).

## What it does

When an agent loads this skill, it follows a strict 6-step protocol before writing any code:

1. **Select a profile** (`web`, `mixed`, or `api-only`)
2. **Load the right references** from a per-slice lookup table (e.g. `inertia-page` → `rendering.md`, `crud-web.md`, `inertia-libraries.md`)
3. **Apply hard blockers** — 21 rules that stop the agent and require explicit user override before deviating
4. **Detect conflicts** between the request, the repo, and the doctrine
5. **Ask one override question** if a hard blocker fires — then wait
6. **Produce compliance markers** (`selected-profile`, `override-status`, `hard-blocker-compliance`)

The agent cannot skip steps, cannot silently deviate, and must report what it did.

## What it enforces

| Category | Examples | Count |
|---|---|---|
| **Hard blockers** (stop + override question) | Lucid ORM only, VineJS `vine.create()` only, `@adonisjs/queue` for jobs, `@adonisjs/auth` for auth, Mantine + Inertia React for UI, no raw BullMQ/fetch/axios, proactive encryption of sensitive data, check packages.adonisjs.com before coding | 21 |
| **Enforced defaults** (applied silently) | CSS Modules styling, `InertiaProps<{}>` + `Data.*` typing, canonical build order, service-layer patterns, controller naming (`controllers.Posts`), `routeParams` prop, `BaseInertiaMiddleware`, `serialize()` envelope | 23 |
| **Advisory** (tie-breakers) | Thin controllers, prefer AdonisJS primitives, small duplication over clever abstractions | 6 |

## Stack

| Concern | Choice |
|---|---|
| Runtime | Node.js ≥ 24, npm ≥ 11, TypeScript 5.9/6.0 |
| Backend | AdonisJS v7, Lucid ORM, VineJS |
| Frontend | Inertia React, Mantine, Tabler Icons, CSS Modules |
| Auth | `@adonisjs/auth` (session for browser, access tokens for external) |
| Authorization | `@adonisjs/bouncer` |
| Mail | `@adonisjs/mail` |
| Files | `@adonisjs/drive` |
| Queue | `@adonisjs/queue` |
| Client fetching | Tuyau (exception path only) |
| State | React local state, Zustand for UI-only shared state |

## Repository structure

```
.claude-plugin/
  plugin.json                     Claude Code plugin manifest
  marketplace.json                Single-plugin marketplace catalog (source: ".")
MAINTENANCE.md                    Quarterly sync workflow + Context7 queries

skills/
  adonisjs-ai-doctrine/       Installed skill root (what Claude Code reads)
    SKILL.md                      Runtime protocol
    rules/manifest.json           Rules, profiles, reference slices
    references/                   routing.md, validation.md, lucid.md, auth.md,
                                  api.md, bouncer.md, mail.md, drive.md,
                                  queue.md, events.md, inertia-libraries.md,
                                  rendering.md, transformers.md, testing.md,
                                  setup.md, rules.md, examples.md
      patterns/                   crud-web.md, auth-flow.md, api-resource.md,
                                  frontend-bootstrap.md, advanced.md
    assets/
      wrappers/                   claude.md, codex.md, vscode.instructions.md
      entrypoints/                CLAUDE.md, AGENTS.md, copilot-instructions.md,
                                  .cursorrules
    agents/openai.yaml

eval/                             Dev tooling — not shipped in plugin install
  cases/                          Eval fixtures (ok_* + violation_*)
  expectations/                   Grader assertion files

scripts/                          Dev tooling — not shipped in plugin install
  validate_all.mjs                7 validators in one command
  validate_snippets.mjs           Regex guard
  typecheck_snippets.mjs          tsc --noEmit via stubs
  validate_rules.mjs              Manifest schema + coverage
  validate_evals.mjs              Eval fixture schema
  validate_eval_expectations.mjs  1:1 case↔expectation mapping
  validate_sync.mjs               SKILL.md ↔ wrappers ↔ manifest
  check_upstream.mjs              Positive fingerprints + anti-patterns
  run_eval.mjs                    Real LLM benchmark (claude -p)
  score_eval.mjs                  Score a captured response
  stubs/                          TypeScript stubs for snippet typecheck
```

## Install

### Claude Code (recommended — plugin + marketplace)

This repo is shipped as a Claude Code plugin and self-declared marketplace. One install command, one update command, no manual clone.

**Step 1 — Add the marketplace:**

```
/plugin marketplace add https://gitlab.com/Linkweb-Tech/adonisjs-ai-doctrine.git
```

**Step 2 — Install the plugin:**

```
/plugin install adonisjs-ai-doctrine@adonisjs-ai-doctrine
```

**Step 3 — Enable auto-invocation (optional):**

Add to `~/.claude/CLAUDE.md` (create if missing):

```markdown
## AdonisJS projects

For any project that contains `adonisrc.ts` or has `@adonisjs/core` in its `package.json` dependencies, always invoke the skill `$adonisjs-ai-doctrine` before any implementation or review task. Do not start coding without the skill loaded.
```

**Step 4 — (Optional) Drop the project-level CLAUDE.md into each Adonis project:**

```bash
cp ~/.claude/plugins/adonisjs-ai-doctrine/assets/entrypoints/CLAUDE.md \
  /path/to/my-adonis-project/CLAUDE.md
```

The `<!-- BEGIN/END adonisjs-ai-doctrine:managed -->` markers protect the skill block — add project-specific instructions outside them.

**Updating:**

```
/plugin marketplace update adonisjs-ai-doctrine
/plugin update
```

Pulls the latest `main`, no manual `git pull` needed.

### Codex

```bash
git clone https://gitlab.com/Linkweb-Tech/adonisjs-ai-doctrine.git /tmp/adonisjs-skill
cp -r /tmp/adonisjs-skill/skills/adonisjs-ai-doctrine ~/.codex/skills/
```

Then invoke with:

```
Use $adonisjs-ai-doctrine to implement this AdonisJS 7 feature.
```

### Cursor

```bash
cp skills/adonisjs-ai-doctrine/assets/entrypoints/.cursorrules /path/to/project/.cursorrules
```

### GitHub Copilot

```bash
mkdir -p /path/to/project/.github
cp skills/adonisjs-ai-doctrine/assets/entrypoints/copilot-instructions.md \
  /path/to/project/.github/copilot-instructions.md
```

### Codex / opencode / Other Agents

```bash
cp skills/adonisjs-ai-doctrine/assets/entrypoints/AGENTS.md /path/to/project/AGENTS.md
```

### VS Code (generic instructions)

Use [skills/adonisjs-ai-doctrine/assets/wrappers/vscode.instructions.md](./skills/adonisjs-ai-doctrine/assets/wrappers/vscode.instructions.md) as `.github/instructions/*.instructions.md`.

## Validation

Run the full strict pack:

```bash
node scripts/validate_all.mjs
```

Output:

```
Snippet validation passed: 72 block(s) checked.
Snippet typecheck passed: 41 block(s) checked, 31 partial skipped.
Rules validation passed: 50 rules, 21 hard blockers, 27 eval cases.
Eval validation passed: 27 cases checked.
Eval expectations validation passed: 27 case(s) matched to 27 expectation(s).
Sync validation passed: SKILL.md, agents/openai.yaml, and 3 wrappers are aligned.
Upstream drift check passed: 12/12 positive fingerprints matched, 8 anti-patterns clean, 24 files scanned.
Strict validation passed.
```

7 validators, zero dependencies (TypeScript resolved via `npx` on demand).

### Real LLM benchmark (optional)

Measure actual skill effectiveness with `claude -p` runs:

```bash
# Pilot (2 cases, fast)
node scripts/run_eval.mjs --cases ok_web_standard,violation_custom_api_key --runs-per-config 1

# Full benchmark with baseline comparison
node scripts/run_eval.mjs --with-baseline --runs-per-config 2
```

Results are written to `eval/workspace/iteration-NNN/summary.json`. See [MAINTENANCE.md](./MAINTENANCE.md) for expected thresholds and cost estimates.

## Maintenance

The skill must stay in sync with the AdonisJS v7 upstream docs. The full process is documented in [MAINTENANCE.md](./MAINTENANCE.md):

- **Quarterly sync** via 10 canonical Context7 queries against `/adonisjs/v7-docs`
- **Divergence report** template for each finding
- **Fix workflow**: references → patterns → manifest → SKILL.md → wrappers → validate
- **Upstream drift guard**: `scripts/check_upstream.mjs` catches regressions between syncs (12 positive fingerprints, 8 anti-patterns)
- **`last_synced` footer** tracks when the skill was last verified

## Source of truth

If two files disagree:

1. `skills/adonisjs-ai-doctrine/rules/manifest.json` — canonical machine-readable rules
2. `skills/adonisjs-ai-doctrine/SKILL.md` — short runtime protocol
3. `skills/adonisjs-ai-doctrine/references/*.md` — long-form rationale
4. `skills/adonisjs-ai-doctrine/assets/wrappers/*.md` — condensed per-agent copies

Higher numbers defer to lower numbers.
