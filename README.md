# adonisjs-7-deterministic

Private Codex skill for building AdonisJS 7 applications in a stable, recognizable, framework-native way.

This skill is intentionally opinionated. It is designed for teams or individuals who want the agent to converge toward the same implementation structure every time, instead of improvising between multiple valid AdonisJS patterns.

## Table Of Contents

- [What This Skill Enforces](#what-this-skill-enforces)
- [Source Of Truth](#source-of-truth)
- [Install For Codex](#install-for-codex)
  - [User-level install](#user-level-install)
  - [Invocation](#invocation)
- [Install For Claude Code](#install-for-claude-code)
  - [User-level install](#user-level-install-1)
  - [Project-level install](#project-level-install)
  - [Invocation](#invocation-1)
  - [Alternative: `CLAUDE.md` or subagents](#alternative-claudemd-or-subagents)
- [Install For VS Code](#install-for-vs-code)
  - [VS Code + Codex IDE extension](#1-vs-code--codex-ide-extension)
  - [VS Code chat agents and instructions](#2-vs-code-chat-agents-and-instructions)
- [Validate Snippets](#validate-snippets)
- [Practical Recommendation](#practical-recommendation)

## What This Skill Enforces

- Inertia React for every web UI.
- Mantine for standard React UI, `@tabler/icons-react` for icons, and `@mantine/notifications` for flash toasts.
- Session or cookie auth for browser-driven flows.
- Guards auth figés sur `web` et `api`, session navigateur par défaut, et cookies conservateurs (`httpOnly`, `sameSite: 'lax'`, `secure` en production).
- Official AdonisJS access tokens only for external API clients.
- A strict split between web/Inertia controllers and JSON API controllers.
- Lucid, VineJS, Bouncer, Mail, Drive, Luxon `DateTime`, services, policies, transformers, and tests used in a predictable order.
- Redirect + flash/session feedback for standard web mutations.
- Shared props globales limitées à `auth`, `flash`, `errors`, et `app { name, env }`.
- SSR désactivé par défaut, bootstrap Inertia/Mantine figé, et XSRF cookie activé pour les apps browser Inertia.
- No client-side form stack on top of Inertia. Standard forms use `@adonisjs/inertia/react` `Form` plus VineJS.
- No client-side fetching by default. If explicitly needed, use the documented Tuyau client in `inertia/client.ts` and TanStack Query.
- No Edge feature rendering, no generic Node.js patterns, no repository layer over Lucid by default.

## Source Of Truth

This `README.md` is a human guide only.

The authoritative runtime doctrine lives in:

- [SKILL.md](./SKILL.md)
- [references/](./references/)

If this README and `SKILL.md` ever disagree, follow `SKILL.md`.

## Validate Snippets

This repository includes a lightweight validation script for the canonical TypeScript snippets:

```bash
node scripts/validate_snippets.mjs
```

It checks the recurring documentation regressions that matter most for this skill:

- missing imports for `request.validateUsing(...)` validators in standalone snippets
- deprecated validator module paths like `#validators/*_validator`
- API transformer responses that bypass `serialize(...)`
- raw `return query` service snippets that leak a Lucid query builder
- `response.created(serialize(...))` style response nesting

If a snippet is intentionally partial and not meant to be copied as-is, mark its first code line with:

```ts
// excerpt
```

The validator skips those excerpt blocks and only enforces strict rules on snippets that claim to be standalone.

## Install For Codex

This is the native format for Codex.

### User-level install

Copy or symlink the folder to:

```text
~/.codex/skills/adonisjs-7-deterministic
```

Expected structure:

```text
~/.codex/skills/adonisjs-7-deterministic/
  SKILL.md
  agents/openai.yaml
  references/
```

### Invocation

Ask Codex explicitly to use it:

```text
Use $adonisjs-7-deterministic to implement this AdonisJS 7 feature.
```

Or let Codex auto-select it when the task clearly matches the skill.

### Notes

- Codex skills are available across the Codex app, CLI, and IDE extension.
- If you want one canonical private copy, keep the source folder in a repo or dotfiles directory and symlink it into `~/.codex/skills/`.

References:

- OpenAI Codex app and skills: https://openai.com/index/introducing-the-codex-app/
- OpenAI Codex availability: https://openai.com/index/codex-now-generally-available/

## Install For Claude Code

Claude Code natively supports `SKILL.md` skills.

You can install this skill in either of Claude Code’s native skill locations.

### User-level install

Copy or symlink the folder to:

```text
~/.claude/skills/adonisjs-7-deterministic
```

Expected structure:

```text
~/.claude/skills/adonisjs-7-deterministic/
  SKILL.md
  references/
```

### Project-level install

Copy or symlink the folder to:

```text
.claude/skills/adonisjs-7-deterministic
```

This makes the skill available only for the current repository.

### Invocation

You can let Claude Code auto-load it when the request matches the `description`, or invoke it directly with:

```text
/adonisjs-7-deterministic
```

### Notes

- `SKILL.md` is the required entrypoint.
- `references/` is compatible with Claude Code skills and can be loaded on demand.
- `agents/openai.yaml` is ignored by Claude Code and can simply remain in the folder.

### Alternative: `CLAUDE.md` or subagents

If you want the doctrine always present even without explicit skill invocation, you can still reference it from `CLAUDE.md`.

If you want a dedicated Claude subagent, create:

```text
.claude/agents/adonisjs-7-deterministic.md
```

and adapt the doctrine into Claude’s subagent format.

### Notes

- `./CLAUDE.md` is team-shared project memory.
- `~/.claude/CLAUDE.md` is user memory across projects.
- `.claude/skills/` and `~/.claude/skills/` are the native locations for Claude Code skills.
- `.claude/agents/` and `~/.claude/agents/` are the native locations for Claude subagents.

References:

- Claude Code memory: https://docs.anthropic.com/en/docs/claude-code/memory
- Claude Code skills: https://code.claude.com/docs/fr/skills
- Claude Code subagents: https://docs.anthropic.com/en/docs/claude-code/sub-agents
- Claude Code setup: https://docs.anthropic.com/en/docs/claude-code/getting-started

## Install For VS Code

There are two different cases.

### 1. VS Code + Codex IDE extension

Use the Codex installation above.

Codex skills follow your Codex environment, and Codex is available in its IDE extension as well as in the app and CLI.

### 2. VS Code chat agents and instructions

Plain VS Code does not natively load Codex `SKILL.md` skill folders, but it does support persistent instruction files.

Use one of these formats:

```text
.github/copilot-instructions.md
AGENTS.md
CLAUDE.md
.github/instructions/*.instructions.md
```

Recommended choices:

- `.github/copilot-instructions.md` for repository-wide Copilot instructions
- `AGENTS.md` if you want a more agent-oriented, tool-agnostic instruction file
- `CLAUDE.md` if you also want compatibility with Claude-based tooling in the same workspace

Suggested minimum instruction set to port:

- Use AdonisJS official packages first.
- Inertia React only for web UI.
- Session/cookie auth for browser flows.
- Access tokens only for external API clients.
- Separate web controllers and API controllers.
- VineJS validation, Lucid models, services, policies, transformers, and tests are required by default.
- Web mutations return redirect + flash/session feedback.

### Notes

- This is an adaptation, not native Codex skill loading.
- If you use Codex inside VS Code, prefer the Codex install path instead of translating the skill into Copilot instructions.

References:

- VS Code custom instructions: https://code.visualstudio.com/docs/copilot/customization/custom-instructions
- GitHub Copilot repository instructions: https://docs.github.com/en/copilot/how-tos/configure-custom-instructions/add-repository-instructions

## Practical Recommendation

If you want the same private doctrine everywhere:

1. Keep one canonical copy of this folder in a private repo or dotfiles repo.
2. Symlink it into `~/.codex/skills/` for Codex.
3. Symlink it into `~/.claude/skills/` for Claude Code, or `.claude/skills/` per project.
4. Port only the condensed rules into `.github/copilot-instructions.md` when using GitHub Copilot in VS Code.

That keeps `SKILL.md` as the real source of truth and avoids maintaining three different doctrine files by hand.
