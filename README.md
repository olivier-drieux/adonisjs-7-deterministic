# adonisjs-7-deterministic

Fail-closed multi-agent skill pack for private AdonisJS v7 applications that need deterministic framework-native structure.

## Source Of Truth

Keep these layers in sync:

- [SKILL.md](./SKILL.md): short runtime protocol used by agents
- [rules/manifest.json](./rules/manifest.json): canonical machine-readable rules, protocol markers, and eval coverage
- [references/](./references/): longer human-readable guidance
- [assets/wrappers/](./assets/wrappers/): condensed cross-agent wrappers
- [MAINTENANCE.md](./MAINTENANCE.md): quarterly sync cadence, Context7 queries, divergence-report template, and fix workflow

If two files disagree, follow `rules/manifest.json`, then `SKILL.md`.

## Install

### Codex

Copy or symlink the folder to:

```text
~/.codex/skills/adonisjs-7-deterministic
```

Invoke it with:

```text
Use $adonisjs-7-deterministic to implement this AdonisJS 7 feature.
```

### Claude Code

Copy or symlink the folder to either:

```text
~/.claude/skills/adonisjs-7-deterministic
.claude/skills/adonisjs-7-deterministic
```

Then copy the project-level CLAUDE.md to every AdonisJS project:

```bash
cp assets/entrypoints/CLAUDE.md /path/to/project/CLAUDE.md
```

This ensures the skill is always invoked, even if auto-matching misses. The `<!-- BEGIN/END adonisjs-7-deterministic:managed -->` markers protect the skill block from accidental edits — add your own project-specific instructions outside the markers.

For company-wide enforcement, also add to `~/.claude/CLAUDE.md`:

```markdown
## AdonisJS projects

For any project that contains `adonisrc.ts` or has `@adonisjs/core` in its `package.json` dependencies, always invoke the skill `$adonisjs-7-deterministic` before any implementation or review task. Do not start coding without the skill loaded.
```

Use [assets/wrappers/claude.md](./assets/wrappers/claude.md) if you also want a short wrapper for a subagent prompt.

### Cursor

Copy [assets/entrypoints/.cursorrules](./assets/entrypoints/.cursorrules) to your project root:

```bash
cp assets/entrypoints/.cursorrules /path/to/project/.cursorrules
```

### GitHub Copilot

Copy [assets/entrypoints/copilot-instructions.md](./assets/entrypoints/copilot-instructions.md) to your project:

```bash
mkdir -p /path/to/project/.github
cp assets/entrypoints/copilot-instructions.md /path/to/project/.github/copilot-instructions.md
```

### Codex / opencode / Other Agents

Copy [assets/entrypoints/AGENTS.md](./assets/entrypoints/AGENTS.md) to your project root:

```bash
cp assets/entrypoints/AGENTS.md /path/to/project/AGENTS.md
```

### VS Code (generic instructions)

Use [assets/wrappers/vscode.instructions.md](./assets/wrappers/vscode.instructions.md) as a self-contained instruction layer for `.github/instructions/*.instructions.md`.

## Validation

Run the full strict pack validation with:

```bash
node scripts/validate_all.mjs
```

This runs:

- `scripts/validate_snippets.mjs`
- `scripts/validate_rules.mjs`
- `scripts/validate_evals.mjs`
- `scripts/validate_sync.mjs`

To score a captured model response against one portable eval case:

```bash
node scripts/score_eval.mjs --case ok_web_standard --response /path/to/response.txt
```

## Notes

- `rules/manifest.json` is the canonical source of truth, stored as plain JSON so the validation scripts stay zero-dependency.
- `eval/cases/*.json` are provider-neutral prompt fixtures.
- Wrappers stay short on purpose; they point back to `SKILL.md` and `rules/manifest.json` instead of duplicating the doctrine.
