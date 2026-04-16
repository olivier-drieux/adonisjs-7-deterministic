---
name: adonisjs-7-deterministic
description: Use when implementing or reviewing private AdonisJS v7 applications with Inertia React, Mantine, session or cookie auth, optional API endpoints or API-only profiles, and you need deterministic framework-native structure with official AdonisJS packages.
---

# AdonisJS 7 Deterministic

## Purpose

Use this skill to keep private AdonisJS v7 work on one stable, framework-native path. Runtime doctrine is `fail-closed`. `rules/manifest.json` is the canonical source of truth; this file is the short runtime protocol and `references/*` carries the rationale. Target stack: **Node.js ≥ 24**, **npm ≥ 11**, TypeScript 5.9 or 6.0, Vite 7 for Inertia stacks. Scaffold with `npm create adonisjs@latest my-app -- --kit=<hypermedia|react|vue|api>`, run `node ace serve --hmr` for development. See `references/setup.md` for the full `adonisrc.ts` hooks pipeline.

## Execution Protocol

1. `select-profile`: Choose exactly one profile: `web`, `mixed`, or `api-only`.
2. `load-targeted-references`: Look up the feature slice in `sync_contract.reference_slices` (in `rules/manifest.json`) and read the listed references before writing any code. Mention which references were loaded.
3. `list-applicable-hard-blockers`: Apply every matching `hard_blocker` from `rules/manifest.json`.
4. `detect-conflicts`: Compare the request, repo conventions, and blockers against the source hierarchy before proceeding.
5. `ask-one-override-question`: If a `hard_blocker` conflicts with the request, stop, cite the rule id, ask exactly one short override question, and wait.
6. `run-final-compliance-check`: Before finalizing, confirm the compliance markers below.

Final answer markers: `selected-profile: <web|mixed|api-only>`, `override-status: none|requested|approved`, `hard-blocker-compliance: pass|override`.

## Profile Selection

- `web`: Inertia React only for pages, session or cookie auth for browser flows, no JSON-first page architecture.
- `mixed`: five distinct surfaces coexist — `web` (Inertia pages, session auth, CSRF on), `api.internal` (same-origin JSON from the app's own browser, session auth, CSRF on), `api.external` (JSON for external or mobile or machine clients, access tokens on the `api` guard, CSRF off), `webhooks` (inbound third-party JSON under `/webhooks`, per-provider signature verification, CSRF off), and `runtime` (infrastructure endpoints such as MCP tool servers, health/liveness/readiness probes, debug/introspection routes, and operator bridges — purpose-specific middleware, no session, no CSRF, no access-token guard by default; mounted on its own paths such as `/mcp` or `/health`). Classify every route by ROLE (caller, purpose), not URL prefix. Each surface has its own route group, middleware chain, and controllers. A single controller never straddles two surfaces. When two or more surfaces are actually mounted, route declarations are split across one file per surface (`start/routes.ts` for `web`, `start/routes/<surface>.ts` for the others — `api_internal.ts`, `api_external.ts`, `webhooks.ts`, `runtime.ts`) registered via `adonisrc.ts` `preloads`. See `references/api.md#mixed-app-surfaces` and `references/routing.md#multi-surface-route-files`.
- `api-only`: no `inertia/*` pages. Use `router.resource(...).apiOnly()` for pure CRUD and explicit routes for everything else.

## Hard Blockers

Apply every matching `hard_blocker` from `rules/manifest.json`. See `references/rules.md` for the full catalog with statements. The sync core: `hb.official-packages`, `hb.data-stack`, `hb.validation-stack`, `hb.auth-browser-stack`, `hb.guard-names`, `hb.browser-csrf`, `hb.access-tokens-external`, `hb.web-ui-stack`, `hb.official-side-effect-packages`, `hb.web-api-controller-separation`, `hb.no-express-fastify-composition`, `hb.no-repository-layer`, `hb.no-edge-feature-rendering`, `hb.no-request-all-only`, `hb.no-any`, `hb.no-raw-io-and-timers`, `hb.no-client-fetch-stack`, `hb.no-client-form-stack`, `hb.no-custom-api-keys-default`, `hb.queue-stack`, `hb.encryption-sensitive-columns`, `hb.http-surface-inventory`.

## Enforced Defaults

When no `hard_blocker` is violated, apply every `enforced_default` from `rules/manifest.json`. See `references/rules.md#enforced-defaults` for the full list. Load-bearing reminders to keep in mind at all times:

- **Before implementing any non-trivial feature**, check https://packages.adonisjs.com/ first, then https://www.npmjs.com/ if nothing is found. Do not code from scratch what a published package already provides (`hb.official-packages`).
- Controllers are imported via `import { controllers } from '#generated/controllers'` and referenced by PascalCase resource name (`controllers.Posts`, not `controllers.PostsController`).
- `@adonisjs/inertia/react` `Link` and `Form` components take a **`routeParams`** prop — never `params`.
- HTTP validation uses `vine.create({...})` as the root schema. `vine.compile(vine.object(...))` is the v6 form and must not appear.
- Inertia shared props live in a middleware that `extends BaseInertiaMiddleware`. Core keys are `user`, `flash`, and `errors`. Additional global shell metadata is allowed but must live under a single `app` namespace (for example `app.name`, `app.env`, `app.locale`, `app.version`); no arbitrary top-level keys outside the core.
- Framework doctrine for API responses: `serialize(...)` with a transformer produces the canonical AdonisJS v7 shape (`{ data }` for a resource, `{ data: [...] }` for a collection, `{ data, meta }` for a paginator). Never double-wrap it. This is **not** a universal rule that every endpoint must return `{ data }` — ad-hoc endpoints (signed URLs, counts, health probes, token-exchange responses) legitimately return their own small typed shape. A uniform `{ data }` contract across every endpoint is an applicative-level choice, not a framework rule.
- `hb.no-client-fetch-stack` has two documented exceptions: incremental streaming (NDJSON / SSE / ReadableStream) and multipart / progress uploads. Both must be isolated in a typed helper module, justified by a real Tuyau or Inertia limitation, and cite the rule id plus the exception clause. They are not alternative defaults.
- `hb.no-raw-io-and-timers` has two documented exceptions: short-lived temp-bridge files under `os.tmpdir()` for Ace / CLI / MCP subprocess integration, and bounded timers inside jobs / commands / integrations that run **outside** the HTTP request lifecycle. Both must be isolated, justified, and cite the rule id plus the exception clause.
- `adonisrc.ts` must declare `hooks.init` with `indexEntities()` (mandatory) plus the per-stack hooks that generate `#generated/controllers`, `@generated/data`, and `@generated/registry`.
- `mixed` apps mounting two or more of the five surfaces (`web`, `api.internal`, `api.external`, `webhooks`, `runtime`) split route declarations into one file per surface — `start/routes.ts` for `web`, `start/routes/<surface>.ts` for each of the others (including `start/routes/runtime.ts` for `/mcp`, `/health`, and other infrastructure endpoints) — and register each additional surface file in the `adonisrc.ts` `preloads` array. Scaffold with `node ace make:preload routes/<surface> --environments=web`. Stacking every surface inside one `start/routes.ts` is not allowed.
- **Before any routing refactor, split, or reorganization**, run the HTTP surface inventory required by `hb.http-surface-inventory`: read `start/routes.ts` and every file it transitively imports or that `adonisrc.ts` preloads; enumerate every mounted route; detect atypical declarations (`router.on(...).renderInertia(...)`, `router.any(...)`, `router.route(path, verbs, ...)`, closure handlers, healthchecks, `/mcp` endpoints, operator bridges); classify each route by ROLE (caller and purpose), not URL prefix; emit a written surface table before writing code. A route that does not fit `web` / `api.internal` / `api.external` / `webhooks` belongs to the `runtime` surface — never absorb it into `api.internal` or `api.external` because it happens to return JSON or sit under an `/api`-adjacent import.

Advisory tie-breakers also live in the manifest: `adv.controller-boundaries`, `adv.prefer-adonis-primitives`, `adv.small-duplication`, `adv.service-when-unsure`, `adv.keep-doctrine-observable`, and `adv.verify-api-before-use`.

## Override Handling

- Only `hard_blocker` ids can stop execution.
- On conflict, cite the blocking rule id in one short sentence, ask exactly one short override question, and wait.
- Do not implement the divergent path until the user explicitly confirms a one-off override for the current task.
- Approved overrides do not weaken any other rule and must be mentioned in the final answer.
- `enforced_default` and `advisory` rules never trigger the override flow.

## Reference Map

- **Source of truth**: `rules/manifest.json`, `references/rules.md`, `MAINTENANCE.md` (sync cadence and fix workflow).
- **Setup**: `references/setup.md` (Node 24 / npm 11, starter kits, `node ace serve --hmr`, `adonisrc.ts` hooks).
- **Core references**: `routing.md`, `validation.md`, `lucid.md`, `auth.md`, `api.md`, `bouncer.md`, `mail.md`, `drive.md`, `queue.md`, `events.md`, `inertia-libraries.md`, `rendering.md`, `transformers.md`, `testing.md`, `examples.md`.
- **Patterns**: `patterns/crud-web.md`, `patterns/auth-flow.md`, `patterns/api-resource.md`, `patterns/frontend-bootstrap.md`, `patterns/advanced.md`.
- **Distribution**: `assets/wrappers/` (per-agent Claude, Codex, VS Code), `assets/entrypoints/` (`CLAUDE.md`, `copilot-instructions.md`, `AGENTS.md`).
- **Validation**: `eval/cases/*.json`, `scripts/validate_all.mjs`.
