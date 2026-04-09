---
name: adonisjs-7-deterministic
description: Use when implementing or reviewing private AdonisJS v7 applications with Inertia React, Mantine, session or cookie auth, optional API endpoints or API-only profiles, and you need deterministic framework-native structure with official AdonisJS packages.
---

# AdonisJS 7 Deterministic

## Purpose

Use this skill to keep private AdonisJS v7 work on one stable, framework-native path. Runtime doctrine is `fail-closed`.

`rules/manifest.json` is the canonical source of truth. This file is the short runtime protocol. Longer rationale stays in `references/*`.

Target stack prerequisites: **Node.js ≥ 24**, **npm ≥ 11**, TypeScript 5.9 or 6.0, Vite 7 for Inertia stacks. Use `npm create adonisjs@latest my-app -- --kit=<hypermedia|react|vue|api>` to scaffold, and `node ace serve --hmr` for development. The `api` kit is a Turborepo monorepo (`apps/backend` + `apps/frontend`) — all canonical paths in this skill apply inside `apps/backend`.

## Execution Protocol

1. `select-profile`: Choose exactly one profile: `web`, `mixed`, or `api-only`.
2. `load-targeted-references`: Read only the references needed for that profile and the current feature slice.
3. `list-applicable-hard-blockers`: Apply every matching `hard_blocker` from `rules/manifest.json`.
4. `detect-conflicts`: Compare the request, repo conventions, and blockers against the source hierarchy before proceeding.
5. `ask-one-override-question`: If a `hard_blocker` conflicts with the request, stop, cite the rule id, ask exactly one short override question, and wait.
6. `run-final-compliance-check`: Before finalizing, confirm the compliance markers below.

Final answer markers:

- `selected-profile: <web|mixed|api-only>`
- `override-status: none|requested|approved`
- `hard-blocker-compliance: pass|override`

## Profile Selection

- `web`: Inertia React only for pages, session or cookie auth for browser flows, no JSON-first page architecture.
- `mixed`: Inertia React for pages plus a separate `/api` group and separate API controllers. Browser clients inside the same app stay on session auth even when they hit `/api`.
- `api-only`: no `inertia/*` pages. Use `router.resource(...).apiOnly()` for pure CRUD and explicit routes for everything else.

## Hard Blockers

Apply every matching `hard_blocker` from `rules/manifest.json`. The sync core is:

- `hb.official-packages`: official AdonisJS packages and `node ace` setup/generators come first.
- `hb.data-stack`: use Lucid for SQL persistence and Luxon DateTime for model and domain dates.
- `hb.validation-stack`: HTTP validation uses VineJS with `vine.create(...)` as the root schema and `request.validateUsing(...)`.
- `hb.auth-browser-stack`: browser-driven flows use `@adonisjs/auth` with session or cookie auth.
- `hb.guard-names`: keep guard names fixed to `web` and `api`.
- `hb.browser-csrf`: browser-facing Inertia apps keep `enableXsrfCookie: true`.
- `hb.access-tokens-external`: external clients use official access tokens with explicit expiration.
- `hb.web-ui-stack`: web UI uses Inertia React and Mantine, with no second client router.
- `hb.official-side-effect-packages`: use `@adonisjs/bouncer` for authorization, `@adonisjs/mail` for email, and `@adonisjs/drive` for persistent file storage.
- `hb.web-api-controller-separation`: mixed apps never reuse the same controller for Inertia pages and JSON API endpoints.
- `hb.no-express-fastify-composition`: use framework-native routes, middleware, services, policies, and container primitives instead of Express or Fastify patterns.
- `hb.no-repository-layer`: no repository layer over Lucid for ordinary app code.
- `hb.no-edge-feature-rendering`: Edge is allowed only for the minimal `resources/views/inertia_layout.edge` boot layout.
- `hb.no-request-all-only`: `request.all()` and `request.only()` never replace validation.
- `hb.no-any`: no `any`.
- `hb.no-raw-io-and-timers`: no raw `nodemailer`, no persistent raw `fs`, no ad hoc timers in the HTTP runtime.
- `hb.no-client-fetch-stack`: no raw `fetch`, `axios`, `ky`, or `SWR` as the default client data stack.
- `hb.no-client-form-stack`: no `@mantine/form`, `react-hook-form`, `formik`, `zod`, `yup`, or `valibot` as the default form stack.
- `hb.no-custom-api-keys-default`: no custom API-key auth as the default external auth path.

## Enforced Defaults

When no `hard_blocker` is violated, apply the manifest defaults:

- `ed.source-hierarchy`: official docs/packages first, then repo conventions, then personal preference.
- `ed.application-profiles`: choose one profile first and keep it stable.
- `ed.feature-order`: package coverage, env/config, migration, model, validator, policy, service, transformer, side effects, controller, routes, tests, UI.
- `ed.routing-and-kernel`: named routes, route helpers, separate route groups, and middleware in `start/kernel.ts`.
- `ed.inertia-shared-props`: middleware extends `BaseInertiaMiddleware`; share only `user`, `flash`, `errors`, and `app { name, env }`.
- `ed.service-layer`, `ed.validator-layer`, `ed.model-and-policy-layer`: keep logic, validation, models, and policies in the canonical layers.
- `ed.mail-events-transformers-exceptions`: dedicated mail classes, listeners for secondary side effects, transformers, named exceptions.
- `ed.config-and-env` and `ed.auth-session-and-shield-config`: keep runtime config in `config/*`, env declarations in `start/env.ts`, and use the canonical auth/session/shield defaults.
- `ed.testing-layout`: `tests/functional` for request flows and `tests/unit` for isolated logic.
- `ed.inertia-filesystem-layout` and `ed.frontend-library-and-state-policy`: keep the canonical `inertia/*` structure, Mantine-first UI, `@adonisjs/inertia/react` wrappers (`Link` and `Form` take a `routeParams` prop — never `params`), limited `@inertiajs/react`, UI-only Zustand, and Tuyau/TanStack only when justified.
- `ed.generators-and-naming`: use `node ace` generators and canonical names; reference controllers through `#generated/controllers` as `controllers.Posts` (PascalCase resource name, no `Controller` suffix).
- `ed.runtime-prerequisites`: Node.js ≥ 24, npm ≥ 11, `npm create adonisjs@latest ... -- --kit=<name>`, `node ace serve --hmr` for development.
- `ed.adonisrc-hooks`: `adonisrc.ts` declares the hooks pipeline (`indexEntities()` mandatory; `indexPages({ framework: 'react' })`, `generateRegistry()`, `indexPolicies()`, and `@adonisjs/vite/build_hook` per stack) so `#generated/controllers`, `@generated/data`, and `@generated/registry` are produced.
- `ed.api-contracts`, `ed.query-pagination`, `ed.transactions-side-effects-and-commands`, and `ed.web-mutations-and-browser-api-auth`: keep the canonical API, list, transaction, side-effect, command, and redirect/flash behavior. The framework `serialize(...)` helper already produces the canonical `{ data }` / `{ data, meta }` envelope — do not wrap it in a second custom envelope.

Advisory tie-breakers also live in the manifest: `adv.controller-boundaries`, `adv.prefer-adonis-primitives`, `adv.small-duplication`, `adv.service-when-unsure`, `adv.keep-doctrine-observable`, and `adv.verify-api-before-use`.

## Override Handling

- Only `hard_blocker` ids can stop execution.
- On conflict, cite the blocking rule id in one short sentence, ask exactly one short override question, and wait.
- Do not implement the divergent path until the user explicitly confirms a one-off override for the current task.
- Approved overrides do not weaken any other rule and must be mentioned in the final answer.
- `enforced_default` and `advisory` rules never trigger the override flow.

## Reference Map

- `rules/manifest.json`: canonical protocol, profiles, rule tiers, and eval coverage.
- `references/rules.md`: human-readable rule index.
- `references/setup.md`: prerequisites (Node 24 / npm 11), starter kits, `node ace serve --hmr`, `adonisrc.ts` hooks pipeline, monorepo layout.
- `references/routing.md`
- `references/validation.md`
- `references/lucid.md`
- `references/auth.md`
- `references/api.md`
- `references/bouncer.md`
- `references/mail.md`
- `references/drive.md`
- `references/events.md`
- `references/inertia-libraries.md`
- `references/rendering.md`
- `references/transformers.md`
- `references/testing.md`
- `references/patterns/crud-web.md`: standard Inertia CRUD pattern.
- `references/patterns/auth-flow.md`: login, session, and config patterns.
- `references/patterns/api-resource.md`: API-only CRUD and mixed-app API endpoints.
- `references/patterns/frontend-bootstrap.md`: Inertia app bootstrap, shared props, flash, Zustand, config.
- `references/patterns/advanced.md`: date widgets, file export, commands, tables, uploads.
- `references/examples.md`: few-shot interaction examples (prompt → expected behavior).
- `assets/wrappers/`: self-contained wrappers per agent (Claude, Codex, VS Code).
- `assets/entrypoints/`: ready-to-copy entry points (`.cursorrules`, `copilot-instructions.md`, `AGENTS.md`).
- `eval/cases/*.json`, `scripts/score_eval.mjs`, and `scripts/validate_all.mjs`
