# adonisjs-7-deterministic

Fail-closed multi-agent skill pack for private AdonisJS v7 applications that need deterministic framework-native structure.

## Source Of Truth

Keep these layers in sync:

- [SKILL.md](./SKILL.md): short runtime protocol used by agents
- [rules/manifest.yaml](./rules/manifest.yaml): canonical machine-readable rules, protocol markers, and eval coverage
- [references/](./references/): longer human-readable guidance
- [assets/wrappers/](./assets/wrappers/): condensed cross-agent wrappers

If two files disagree, follow `rules/manifest.yaml`, then `SKILL.md`.

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

Use [assets/wrappers/claude.md](./assets/wrappers/claude.md) if you also want a short wrapper for `CLAUDE.md` or a subagent prompt.

### VS Code

VS Code does not natively load `SKILL.md` skills. Use [assets/wrappers/vscode.instructions.md](./assets/wrappers/vscode.instructions.md) as the condensed instruction layer for:

```text
.github/copilot-instructions.md
AGENTS.md
CLAUDE.md
.github/instructions/*.instructions.md
```

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

- `rules/manifest.yaml` is stored as JSON-compatible YAML so the validation scripts stay zero-dependency.
- `eval/cases/*.json` are provider-neutral prompt fixtures.
- Wrappers stay short on purpose; they point back to `SKILL.md` and `rules/manifest.yaml` instead of duplicating the doctrine.
