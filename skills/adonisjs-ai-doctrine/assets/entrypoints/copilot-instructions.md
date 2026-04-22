# AdonisJS 7 Deterministic Doctrine

This project uses a fail-closed deterministic doctrine for AdonisJS v7. Every code suggestion, generation, and review must comply with these rules.

## Profiles

Before writing any code, determine the application profile:
- **web**: Inertia React pages, session/cookie auth, no JSON-first page architecture.
- **mixed**: five distinct surfaces — `web` (Inertia pages, session auth, CSRF on), `api.internal` (same-origin JSON from the app's own browser, session auth, CSRF on, prefix `/api` or `/api/internal`), `api.external` (external / mobile / machine clients, access tokens on `api` guard, CSRF off, prefix `/api` or `/api/external`), `webhooks` (inbound third-party JSON, per-provider signature verification, CSRF off, prefix `/webhooks`), and `runtime` (MCP tool servers, health/liveness/readiness probes, debug/introspection, local bridges, operator tooling — purpose-specific middleware, no session, no CSRF, no `api` guard by default; mounted on its own paths such as `/mcp` or `/health`). Classify every route by ROLE (caller, purpose), not URL prefix. Each surface has its own route group, middleware chain, and controllers; a single controller never straddles two surfaces. When two or more surfaces are mounted, route declarations are split one file per surface — `start/routes.ts` for `web`, `start/routes/<surface>.ts` for each of the others (`api_internal.ts`, `api_external.ts`, `webhooks.ts`, `runtime.ts`) — registered in `adonisrc.ts` `preloads` (`node ace make:preload routes/<surface> --environments=web`).
- **api-only**: No Inertia pages. `router.resource(...).apiOnly()` for CRUD.

## Hard Blockers — Forbidden Patterns

These patterns are **never** allowed by default. If the user explicitly requests one, ask for confirmation first.

| Forbidden | Use Instead | Rule |
|---|---|---|
| Prisma, Drizzle | Lucid ORM + Luxon DateTime | `hb.data-stack` |
| `request.all()`, `request.only()` | `request.validateUsing(validator)` | `hb.no-request-all-only` |
| Inline controller validation | VineJS validator file + `request.validateUsing(...)` | `hb.validation-stack` |
| `vine.compile(vine.object({...}))` as a root schema | `vine.create({...})` (v7 canonical form) | `hb.validation-stack` |
| `<Link params={{ id }}>` / `<Form params={{ id }}>` | `<Link routeParams={{ id }}>` / `<Form routeParams={{ id }}>` | `ed.inertia-filesystem-layout` |
| `controllers.PostsController` from `#generated/controllers` | `controllers.Posts` (PascalCase resource name, no suffix) | `ed.generators-and-naming` |
| `InertiaMiddleware` without a base class | `extends BaseInertiaMiddleware` from `@adonisjs/inertia/inertia_middleware` | `ed.inertia-shared-props` |
| Wrapping `serialize(...)` in a second `{ data: ... }` envelope | Return `serialize(...)` directly — the helper already emits `{ data }` / `{ data, meta }` | `ed.api-contracts` |
| Bearer tokens for browser auth | `@adonisjs/auth` session/cookie auth | `hb.auth-browser-stack` |
| Renamed guard names | Fixed `web` and `api` guard names | `hb.guard-names` |
| Disabling CSRF for Inertia | `enableXsrfCookie: true` | `hb.browser-csrf` |
| Custom API-key auth | Official access tokens with expiration | `hb.no-custom-api-keys-default` |
| Raw BullMQ, bee-queue, agenda, Redis polling for jobs | `@adonisjs/queue` Job classes + `node ace queue:work` | `hb.queue-stack` |
| Sensitive data (SSN, cards, secrets, phone) stored in plaintext | `@adonisjs/core/services/encryption` via `@beforeSave()` hooks | `hb.encryption-sensitive-columns` |
| Vue, Edge feature pages | Inertia React + Mantine | `hb.web-ui-stack` |
| `react-router-dom` | Inertia navigation | `hb.web-ui-stack` |
| CASL | `@adonisjs/bouncer` | `hb.official-side-effect-packages` |
| Raw nodemailer | `@adonisjs/mail` | `hb.official-side-effect-packages` |
| Raw `fs` for app storage | `@adonisjs/drive` | `hb.official-side-effect-packages` |
| Express/Fastify patterns | Framework-native routes, middleware, services | `hb.no-express-fastify-composition` |
| Repository layer over Lucid | Direct model + service usage | `hb.no-repository-layer` |
| Edge for feature rendering | Only `inertia_layout.edge` boot layout | `hb.no-edge-feature-rendering` |
| `any` type | Concrete types | `hb.no-any` |
| `nodemailer`, raw `fs`, `setInterval` in HTTP | Official packages, Ace commands, listeners. Exceptions (not defaults, isolated + justified + rule id cited): `os.tmpdir()` temp-bridge files for Ace/CLI/MCP subprocess integration; bounded timers outside the HTTP request lifecycle. | `hb.no-raw-io-and-timers` |
| `fetch(`, `axios`, `ky`, `SWR` | Inertia props/redirects, Tuyau when justified. Exceptions (not defaults, isolated in a typed helper + justified + rule id cited): incremental streaming (NDJSON/SSE/ReadableStream); multipart/progress uploads. | `hb.no-client-fetch-stack` |
| `@mantine/form`, `react-hook-form`, `formik` | `@adonisjs/inertia/react` Form + VineJS | `hb.no-client-form-stack` |
| `zod`, `yup`, `valibot` | Server-side VineJS validation | `hb.no-client-form-stack` |
| A single controller serving two of the five surfaces | One controller per surface: `web`, `api.internal`, `api.external`, `webhooks`, `runtime`. `/mcp`, `/health`, and operator bridges never get folded into an API controller | `hb.web-api-controller-separation` |
| A single `start/routes.ts` stacking two or more surfaces in a mixed app | One route file per surface — `start/routes.ts` for `web`, `start/routes/<surface>.ts` for each of the others (including `start/routes/runtime.ts` for `/mcp`, `/health`, operator bridges) — registered in `adonisrc.ts` `preloads` | `ed.routing-and-kernel` |
| Routing refactor without reading `start/routes.ts` and enumerating every mounted route (including `router.on`, `router.any`, `router.route`, closures, healthchecks, `/mcp`) | Run the HTTP surface inventory first — read `start/routes.ts` and every file it transitively imports + `adonisrc.ts` preloads, enumerate every route, detect atypical declarations, classify each route by ROLE (caller, purpose) not URL prefix, emit a written surface table before writing code. A route that does not fit `web` / `api.internal` / `api.external` / `webhooks` belongs to `runtime` — never silently absorbed into `api.internal` or `api.external` | `hb.http-surface-inventory` |

## Canonical Build Order

package coverage → env/config → migration → model → validator → policy → service → transformer → side effects → controller → routes → tests → UI

## Key Defaults

- Named routes and route helpers, separate web and `/api` groups. Controllers via `import { controllers } from '#generated/controllers'` and referenced as `controllers.Posts`. In `mixed` apps mounting two or more of the five surfaces, split routes one file per surface (`start/routes.ts` for `web`; `start/routes/<surface>.ts` for each of the others — including `start/routes/runtime.ts` for `/mcp`, `/health`, and operator bridges — registered via `adonisrc.ts` `preloads`). Before any routing refactor, run the HTTP surface inventory required by `hb.http-surface-inventory`.
- Services with canonical verbs: `list`, `findOrFail`, `create`, `update`, `delete`.
- One validator per action built with `vine.create({...})`. One policy per protected resource. Prefer `denies(...)` checks.
- Web mutations: redirect + flash. API (framework doctrine): `serialize(...)` with a transformer produces `{ data }` for a resource, `{ data: [...] }` for a collection, `{ data, meta }` for a paginator — never double-wrap it. This is **not** a universal rule that every endpoint must be `{ data }`: ad-hoc endpoints (signed URLs, counts, health probes, token-exchange responses) legitimately return their own typed shape. A uniform `{ data }` contract across every endpoint is an applicative-level choice, not a framework rule. Errors stay flat `{ code, message }`.
- Status codes: 201 create, 200 update, 204 delete, 403 forbidden, 404 not found, 409 conflict.
- Shared Inertia props: core keys are `user`, `flash`, `errors`. Additional global shell metadata is allowed but must live under a single `app` namespace (for example `app.name`, `app.env`, `app.locale`, `app.version`); no arbitrary top-level keys outside the core. Middleware extends `BaseInertiaMiddleware`.
- Page props typed with `InertiaProps<{...}>` from `~/types` and `Data.<Resource>` from `@generated/data`.
- Inertia `Link` and `Form` take `routeParams={{ id }}` — never `params={{ id }}`.
- SSR off by default. Mantine + Tabler icons. `@adonisjs/inertia/react` Link and Form.
- Tests: `tests/functional` for request flows, `tests/unit` for isolated logic.

## Runtime Prerequisites

- Node.js ≥ 24, npm ≥ 11.
- Scaffold: `npm create adonisjs@latest my-app -- --kit=<hypermedia|react|vue|api>`. All four kits produce a flat AdonisJS application.
- Dev server: `node ace serve --hmr`.
- `adonisrc.ts` must declare `hooks.init` with `indexEntities()` (mandatory), plus `indexPages({ framework: 'react' })`, `generateRegistry()`, and `indexPolicies()` per stack. The `preloads` array carries every `start/routes/<surface>.ts` file introduced by a `mixed` app with two or more of the five surfaces — including `start/routes/runtime.ts` for `/mcp`, `/health`, and operator bridges.

## Source of Truth

For the complete rules, see the `adonisjs-ai-doctrine` skill pack in this repository.
