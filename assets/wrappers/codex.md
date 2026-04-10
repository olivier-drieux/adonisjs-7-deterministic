# AdonisJS 7 Deterministic — Codex Wrapper

Fail-closed doctrine for private AdonisJS v7 applications. This wrapper is self-contained: follow it even if the full skill tree is not loaded.

## Execution Protocol

1. **select-profile**: Choose exactly one profile before designing the solution.
   - `web`: Inertia React pages, session/cookie auth, no JSON-first page architecture.
   - `mixed`: Inertia React pages + separate `/api` group with separate API controllers. Browser clients stay on session auth even when hitting `/api`.
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

- `hb.official-packages`: Use official AdonisJS packages and `node ace` generators first. No third-party replacements when an official package exists.
- `hb.data-stack`: Use Lucid for SQL persistence and Luxon DateTime for model/domain dates. No Prisma, Drizzle, or plain Date for persisted domain dates.
- `hb.validation-stack`: HTTP validation uses VineJS with `vine.create(...)` as the root schema and `request.validateUsing(...)`. No inline controller validation, and no `vine.compile(vine.object(...))` at the root.
- `hb.auth-browser-stack`: Browser flows use `@adonisjs/auth` with session/cookie auth. No bearer-token-first browser flows.
- `hb.guard-names`: Keep guard names fixed to `web` and `api`.
- `hb.browser-csrf`: Browser-facing Inertia apps keep `enableXsrfCookie: true`.
- `hb.access-tokens-external`: External clients use official access tokens with explicit expiration.
- `hb.web-ui-stack`: Web UI uses Inertia React and Mantine. No second client router (no `react-router-dom`).
- `hb.official-side-effect-packages`: Use `@adonisjs/bouncer` for authorization, `@adonisjs/mail` for email, `@adonisjs/drive` for file storage. No CASL, raw nodemailer, or raw fs replacements.
- `hb.web-api-controller-separation`: Mixed apps never reuse the same controller for Inertia pages and JSON API endpoints.
- `hb.no-express-fastify-composition`: Use framework-native routes, middleware, services, policies, and container primitives. No Express/Fastify-style composition.
- `hb.no-repository-layer`: No repository layer over Lucid for ordinary app code.
- `hb.no-edge-feature-rendering`: Edge is allowed only for the minimal `resources/views/inertia_layout.edge` boot layout.
- `hb.no-request-all-only`: `request.all()` and `request.only()` never replace validation.
- `hb.no-any`: No `any` in product code.
- `hb.no-raw-io-and-timers`: No raw `nodemailer`, no persistent raw `fs`, no ad hoc timers in the HTTP runtime.
- `hb.no-client-fetch-stack`: No raw `fetch`, `axios`, `ky`, or `SWR` as the default client data stack.
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
- Inertia shared-props middleware must `extends BaseInertiaMiddleware` from `@adonisjs/inertia/inertia_middleware`; share `user`, `flash`, `errors`, and `app { name, env }` only; augment `SharedProps` via `declare module '@adonisjs/inertia/types'`.
- Inertia page props: use `InertiaProps<{...}>` from `~/types` and `Data.<Resource>` from `@generated/data`.
- API response shape: `serialize(...)` produces `{ data }` or `{ data, meta }` natively. Return it directly — never wrap it in a second custom envelope.
- `config/inertia.ts`: `entrypoint` removed; `history.encrypt` renamed to top-level `encryptHistory`; `sharedData` removed (use the middleware).
- Prerequisites: Node.js ≥ 24, npm ≥ 11. Scaffold with `npm create adonisjs@latest my-app -- --kit=<hypermedia|react|vue|api>`. Dev server: `node ace serve --hmr`.
- `adonisrc.ts` declares `hooks.init` with `indexEntities()` (mandatory), plus `indexPages({ framework: 'react' })`, `generateRegistry()`, and `indexPolicies()` per stack. These hooks produce `#generated/controllers`, `@generated/data`, and `@generated/registry`.
