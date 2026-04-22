# Reviewing this skill

Read this **before** proposing any change to `rules/manifest.json`, `SKILL.md`, the wrappers, or the entrypoints. It exists because well-meaning reviewers (human and LLM) routinely misread this skill as a generic AdonisJS pack and propose to "loosen" rules that are deliberately tight.

## Audience

- **Single maintainer**, single set of private projects.
- **Not** a community pack. **Not** intended to fit other people's stacks.
- If you are a different developer who likes the structure: **fork** and adapt the `stack-lockin` rules to your own choices.

## What the three rule categories mean

Every rule in `rules/manifest.json` carries an `enforcement_rationale`:

| Rationale | Meaning | Reviewer freedom |
|---|---|---|
| `framework-doctrine` | The official AdonisJS v7 docs / official packages mandate this (e.g. `vine.create` as root schema, `enableXsrfCookie: true` for Inertia, `@adonisjs/queue` for jobs) | Open to correction if the official docs change. Always check `context7` `/adonisjs/v7-docs` before proposing changes. |
| `stack-lockin` | The maintainer's deliberate stack choice (Inertia React + Mantine, Inertia Form + VineJS, Inertia/Tuyau client data, Inertia-only rendering) | **Closed.** The override-flow friction is the feature. Do not propose retiering. |
| `team-discipline` | Transverse engineering rituals (HTTP surface inventory, sensitive-column encryption scan, no `any`, no repository layer, 5-surface controller separation) | Open to refinement if a clearly better ritual is proposed, but tier should stay. |

`scripts/validate_rules.mjs` enforces that the four canonical `stack-lockin` `hard_blocker` rules — `hb.web-ui-stack`, `hb.no-edge-feature-rendering`, `hb.no-client-fetch-stack`, `hb.no-client-form-stack` — stay at `hard_blocker` tier. Trying to downgrade them will fail validation.

## Acceptable changes

- **Update `framework-doctrine` rules** when the AdonisJS v7 docs evolve. Cite the doc URL. Re-run `node scripts/check_upstream.mjs` after.
- **Add new `framework-doctrine` rules** when AdonisJS publishes new official packages.
- **Refine `team-discipline` ritual statements** if the ritual itself can be made tighter or clearer without loosening the doctrine.
- **Add new `stack-lockin` rules** when the maintainer adopts a new opinionated choice across projects. Mark them `stack-lockin` and choose a tier.
- **Improve references** (`references/*.md`) — add concrete examples, fix outdated patterns, link to current AdonisJS v7 docs.
- **Expand eval coverage** (`eval/cases/*.json` and `eval/expectations/*.md`) — add `ok_*` and `violation_*` cases for under-tested rules.
- **Tighten typings, fix typos, improve clarity** anywhere.

## Anti-recommendations (refused by default)

These have been considered and **rejected**. Do not re-propose them without explicit maintainer approval.

| Anti-recommendation | Why refused |
|---|---|
| "Reclassify `hb.web-ui-stack` (Mantine) to `enforced_default` for broader applicability" | Broader applicability is an explicit non-goal. The skill exists to enforce Mantine across the maintainer's projects; the override-flow friction is the feature. |
| "Allow Tailwind / styled-components / Emotion as alternative styling" | `ed.css-modules-styling` is a `stack-lockin` choice. CSS Modules + Mantine variables is the chosen path. |
| "Allow TanStack Query / SWR / axios / ky as default client data libraries" | `hb.no-client-fetch-stack` is a `stack-lockin` rule. The Inertia/Tuyau-first path is the chosen behavior. The streaming and multipart-upload exception clauses cover the legitimate raw-fetch use cases. |
| "Allow `@mantine/form` / `react-hook-form` / `formik` / `zod` / `yup` / `valibot` as default form libraries" | `hb.no-client-form-stack` is a `stack-lockin` rule. Inertia Form + server VineJS is the chosen path. |
| "Allow Edge templates for feature pages alongside Inertia" | `hb.no-edge-feature-rendering` is a `stack-lockin` rule. Inertia is the chosen rendering path. |
| "Allow a repository layer over Lucid for cleaner separation" | `hb.no-repository-layer` is `team-discipline`. Direct model + service is the chosen structure. The maintainer has tried both and prefers this. |
| "Drop the 5-surface taxonomy in `mixed` apps — it's overkill for small apps" | `hb.web-api-controller-separation` and the surface inventory are `team-discipline` choices. The taxonomy prevents `/mcp`, `/health`, and operator endpoints from being silently absorbed into API controllers. |
| "Drop the proactive sensitive-column encryption scan — it slows feature work" | `hb.encryption-sensitive-columns` is `team-discipline`. The proactive scan is the point. |
| "Stop requiring `controllers.PascalCase` and allow the v6-style `controllers.PostsController`" | `controllers.Posts` is the v7 official barrel format from `#generated/controllers`. This is `framework-doctrine`, not negotiable. |

## Reviewing checklist

Before submitting any rule change, confirm:

- [ ] You have read the `## Design Intent` section of `SKILL.md`.
- [ ] You know which `enforcement_rationale` category your change falls into.
- [ ] If touching a `stack-lockin` rule, you have explicit maintainer approval.
- [ ] If touching a `framework-doctrine` rule, you cited the relevant section of the AdonisJS v7 docs (preferably via context7 `/adonisjs/v7-docs`).
- [ ] `node scripts/validate_all.mjs` passes locally.
- [ ] You updated SKILL.md, `references/rules.md`, the wrappers, the entrypoints, and `agents/openai.yaml` if rule IDs or the hard-blocker list changed.
- [ ] You added or updated eval cases (`eval/cases/*.json` and `eval/expectations/*.md`) when adding a new rule or changing semantics.
