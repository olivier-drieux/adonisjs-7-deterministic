# AdonisJS 7 Deterministic — VS Code Instructions

Fail-closed doctrine for private AdonisJS v7 applications. This wrapper is self-contained: follow it even if the full skill tree is not loaded.

## Execution Protocol

1. **select-profile**: Choose exactly one profile before designing the solution.
   - `web`: Inertia React pages, session/cookie auth, no JSON-first page architecture.
   - `mixed`: five distinct surfaces — `web` (Inertia pages, session auth, CSRF on), `api.internal` (same-origin JSON from the app's own browser, session auth, CSRF on, prefix `/api` or `/api/internal`), `api.external` (external / mobile / machine clients, access tokens on `api` guard, CSRF off, prefix `/api` or `/api/external`), `webhooks` (inbound third-party JSON, per-provider signature verification, CSRF off, prefix `/webhooks`), and `runtime` (MCP tool servers, health/liveness/readiness probes, debug/introspection, local bridges, operator tooling — purpose-specific middleware, no session, no CSRF, no `api` guard by default; mounted on its own paths such as `/mcp` or `/health`). Classify every route by ROLE (caller, purpose), not URL prefix. Each surface has its own route group, middleware chain, and controllers; a single controller never straddles two surfaces. When two or more surfaces are mounted, route declarations are split one file per surface — `start/routes.ts` for `web`, `start/routes/<surface>.ts` for each of the others (`api_internal.ts`, `api_external.ts`, `webhooks.ts`, `runtime.ts`) — registered in the `adonisrc.ts` `preloads` array (`node ace make:preload routes/<surface> --environments=web`).
   - `api-only`: No Inertia pages. Use `router.resource(...).apiOnly()` for CRUD and explicit routes for everything else.
2. **load-targeted-references**: Read only references needed for that profile and feature (see `references/*` if the full skill is available).
3. **list-applicable-hard-blockers**: Apply every matching hard blocker below.
4. **detect-conflicts**: Compare the request, repo conventions, and blockers against the source hierarchy before proceeding.
5. **ask-one-override-question**: If a hard blocker conflicts, stop, cite the rule id, ask exactly one short override question, and wait.
6. **run-final-compliance-check**: Confirm the 3 markers below before finalizing.

## Final Answer Markers

- `selected-profile: <web|mixed|api-only>`
- `override-status: none|requested|approved`
- `hard-blocker-compliance: pass|override`

## Source Hierarchy

1. Official AdonisJS v7 docs and official packages.
2. Existing repository conventions (only when broader correction is out of scope).
3. Personal preference (only after the first two are exhausted).

## Hard Blockers

Each stops execution on conflict. Cite the rule id, ask one override question, wait.

- `hb.official-packages`: Before implementing any feature, (1) check https://packages.adonisjs.com/ for an AdonisJS package, (2) if none found, search https://www.npmjs.com/ for a vetted npm package. Custom code is a last resort.
- `hb.data-stack`: Use Lucid for SQL persistence and Luxon DateTime for model/domain dates. No Prisma, Drizzle, or plain Date for persisted domain dates.
- `hb.validation-stack`: HTTP validation uses VineJS with `vine.create(...)` as the root schema and `request.validateUsing(...)`. No inline controller validation, and no `vine.compile(vine.object(...))` at the root.
- `hb.auth-browser-stack`: Browser flows use `@adonisjs/auth` with session/cookie auth. No bearer-token-first browser flows.
- `hb.guard-names`: Keep guard names fixed to `web` and `api`.
- `hb.browser-csrf`: Browser-facing Inertia apps keep `enableXsrfCookie: true`.
- `hb.access-tokens-external`: External clients use official access tokens with explicit expiration.
- `hb.web-ui-stack`: Web UI uses Inertia React and Mantine. No second client router (no `react-router-dom`).
- `hb.official-side-effect-packages`: Use `@adonisjs/bouncer` for authorization, `@adonisjs/mail` for email, `@adonisjs/drive` for file storage. No CASL, raw nodemailer, or raw fs replacements.
- `hb.web-api-controller-separation`: Mixed apps keep one controller per surface. A single controller never straddles two of the five surfaces (`web`, `api.internal`, `api.external`, `webhooks`, `runtime`) — never reuses an `api.internal` controller for `api.external` (or vice versa), and never folds `/mcp` or `/health` into an API controller.
- `hb.http-surface-inventory`: Before any routing refactor, split, or reorganization, run an exhaustive HTTP surface inventory. Read `start/routes.ts` and every file it transitively imports or that `adonisrc.ts` preloads. Enumerate every mounted route. Detect atypical declarations that a URL-prefix scan misses — `router.on(...).renderInertia(...)`, `router.any(...)`, `router.route(path, verbs, ...)`, closure handlers, healthchecks (`router.get('/health/live', ...)`), MCP endpoints (`router.post('/mcp', ...)`), operator bridges. Classify every route by ROLE (caller, purpose), not URL prefix. Emit a written surface table (path, verb, handler, caller, surface) before writing any code. A route that does not fit `web` / `api.internal` / `api.external` / `webhooks` belongs to `runtime` — never silently absorb it into `api.internal` or `api.external`.
- `hb.no-express-fastify-composition`: Use framework-native routes, middleware, services, policies, and container primitives. No Express/Fastify-style composition.
- `hb.no-repository-layer`: No repository layer over Lucid for ordinary app code.
- `hb.no-edge-feature-rendering`: Edge is allowed only for the minimal `resources/views/inertia_layout.edge` boot layout.
- `hb.no-request-all-only`: `request.all()` and `request.only()` never replace validation.
- `hb.no-any`: No `any` in product code.
- `hb.no-raw-io-and-timers`: No raw `nodemailer`, no persistent raw `fs`, no ad hoc timers in the HTTP runtime. Two documented exceptions (not defaults): short-lived temp-bridge files under `os.tmpdir()` for Ace / CLI / MCP subprocess integration, and bounded timers inside jobs / commands / integrations that run **outside** the HTTP request lifecycle. Exceptions must be isolated, justified, and cite the rule id.
- `hb.no-client-fetch-stack`: No raw `fetch`, `axios`, `ky`, or `SWR` as the default client data stack. Two documented exceptions (not defaults): incremental streaming (NDJSON / SSE / ReadableStream) that Tuyau and Inertia partial reloads cannot express, and multipart / progress uploads the typed client does not cover. Exceptions must be isolated in a typed helper, justified, and cite the rule id.
- `hb.no-client-form-stack`: No `@mantine/form`, `react-hook-form`, `formik`, `zod`, `yup`, or `valibot` as the default form stack.
- `hb.no-custom-api-keys-default`: No custom API-key auth as the default external auth path.
- `hb.queue-stack`: Use `@adonisjs/queue` for background jobs. No raw BullMQ, bee-queue, agenda, or ad hoc Redis polling.
- `hb.encryption-sensitive-columns`: Proactively detect sensitive data (SSN, credit cards, API secrets, medical records, phone numbers) in models. Stop, flag the columns, explain the risk, and encrypt with `@adonisjs/core/services/encryption` — even when the user has not mentioned security.

## Override Handling

- Only hard blockers can stop execution.
- On conflict: cite the rule id, ask exactly one short override question, wait.
- Do not implement the divergent path until the user explicitly confirms a one-off override.
- Approved overrides do not weaken other rules and must be mentioned in the final answer.

## Source of Truth (when full skill is available)

- `SKILL.md`
- `rules/manifest.json`

## v7 API Notes (Critical)

These are exact v7 forms that LLMs frequently hallucinate:

- VineJS root schema: `vine.create({...})` — not `vine.compile(vine.object({...}))`. `vine.object` is still valid inside nested sub-schemas.
- Routes: `import { controllers } from '#generated/controllers'` then reference controllers as `controllers.Posts`, `controllers.Session`, `controllers.ApiPosts` — **not** `controllers.PostsController`.
- Inertia `Link` and `Form` from `@adonisjs/inertia/react`: pass route parameters with `routeParams={{ id: post.id }}` — **not** `params={{ id: post.id }}`. Tuyau's `urlFor('route', { id })` still uses a flat positional argument.
- Inertia shared-props middleware must `extends BaseInertiaMiddleware` from `@adonisjs/inertia/inertia_middleware`. Core shared keys are `user`, `flash`, and `errors`. Additional global shell metadata is allowed but must live under a single `app` namespace (for example `app.name`, `app.env`, `app.locale`, `app.version`); no arbitrary top-level keys outside the core. Augment `SharedProps` via `declare module '@adonisjs/inertia/types'`.
- Inertia page props: use `InertiaProps<{...}>` from `~/types` and `Data.<Resource>` from `@generated/data`.
- API response shape (framework doctrine): `serialize(...)` with a transformer produces `{ data }` for a resource, `{ data: [...] }` for a collection, and `{ data, meta }` for a paginator. Return it directly — never double-wrap it. This is **not** a universal rule that every endpoint must be `{ data }`: ad-hoc endpoints (signed URLs, counts, health probes, token-exchange responses) legitimately return their own typed shape. A uniform `{ data }` contract across every endpoint is an applicative-level choice, not a framework rule.
- `config/inertia.ts`: `entrypoint` removed; `history.encrypt` renamed to top-level `encryptHistory`; `sharedData` removed (use the middleware).
- Prerequisites: Node.js ≥ 24, npm ≥ 11. Scaffold with `npm create adonisjs@latest my-app -- --kit=<hypermedia|react|vue|api>`. Dev server: `node ace serve --hmr`.
- `adonisrc.ts` declares `hooks.init` with `indexEntities()` (mandatory), plus `indexPages({ framework: 'react' })`, `generateRegistry()`, and `indexPolicies()` per stack. These hooks produce `#generated/controllers`, `@generated/data`, and `@generated/registry`.
- `adonisrc.ts` `preloads` carries every `start/routes/<surface>.ts` file introduced by a `mixed` app with two or more surfaces (including `start/routes/runtime.ts` for `/mcp`, `/health`, and other infrastructure endpoints). AdonisJS does not auto-import files under `start/`; the `preloads` array is the official mechanism. Scaffold with `node ace make:preload routes/<surface> --environments=web`. A single `start/routes.ts` stacking every surface is forbidden whenever two or more of the five surfaces are mounted.
