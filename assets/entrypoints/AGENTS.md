# AdonisJS 7 Deterministic Doctrine

This project uses a fail-closed deterministic doctrine for AdonisJS v7. Every code change must comply with these rules.

## Execution Protocol

1. **select-profile**: Choose exactly one profile before designing the solution.
   - `web`: Inertia React pages, session/cookie auth, no JSON-first page architecture.
   - `mixed`: Inertia React pages + separate `/api` group with separate API controllers. Browser clients stay on session auth even when hitting `/api`.
   - `api-only`: No Inertia pages. Use `router.resource(...).apiOnly()` for CRUD.
2. **list-applicable-hard-blockers**: Apply every matching hard blocker below.
3. **detect-conflicts**: Compare the request against the blockers before proceeding.
4. **ask-one-override-question**: If a hard blocker conflicts, stop, cite the rule id, ask exactly one short override question, and wait.

## Source Hierarchy

1. Official AdonisJS v7 docs and packages.
2. Existing repository conventions.
3. Personal preference (last resort).

## Hard Blockers

Each stops execution on conflict. Cite the rule id and ask before proceeding.

- `hb.official-packages`: (1) Check https://packages.adonisjs.com/, (2) if none, search https://www.npmjs.com/. Custom code is a last resort.
- `hb.data-stack`: Lucid for SQL persistence, Luxon DateTime for dates. No Prisma/Drizzle.
- `hb.validation-stack`: VineJS with `vine.create(...)` as the root schema and `request.validateUsing(...)`. No inline validation, no `vine.compile(vine.object(...))` at the root.
- `hb.auth-browser-stack`: `@adonisjs/auth` session/cookie for browser flows.
- `hb.guard-names`: Fixed guard names `web` and `api`.
- `hb.browser-csrf`: `enableXsrfCookie: true` for browser-facing Inertia apps.
- `hb.access-tokens-external`: Official access tokens with explicit expiration for external clients.
- `hb.web-ui-stack`: Inertia React + Mantine. No `react-router-dom`.
- `hb.official-side-effect-packages`: `@adonisjs/bouncer`, `@adonisjs/mail`, `@adonisjs/drive`.
- `hb.web-api-controller-separation`: Separate web and API controllers in mixed apps.
- `hb.no-express-fastify-composition`: Framework-native patterns only.
- `hb.no-repository-layer`: No repository layer over Lucid.
- `hb.no-edge-feature-rendering`: Edge only for `inertia_layout.edge`.
- `hb.no-request-all-only`: No `request.all()` or `request.only()`.
- `hb.no-any`: No `any` type.
- `hb.no-raw-io-and-timers`: No raw nodemailer, raw fs, ad hoc timers in HTTP. Documented exceptions (not defaults): temp-bridge files under `os.tmpdir()` for Ace/CLI/MCP subprocess integration; bounded timers outside the HTTP request lifecycle. Must be isolated, justified, rule id cited.
- `hb.no-client-fetch-stack`: No raw fetch/axios/ky/SWR as default. Documented exceptions (not defaults): incremental streaming (NDJSON/SSE/ReadableStream); multipart/progress uploads. Must live in a typed helper, be justified, and cite the rule id.
- `hb.no-client-form-stack`: No @mantine/form, react-hook-form, formik, zod, yup, valibot.
- `hb.no-custom-api-keys-default`: No custom API-key auth as default.
- `hb.queue-stack`: Use `@adonisjs/queue` for background jobs. No raw BullMQ, bee-queue, agenda, or ad hoc Redis polling.
- `hb.encryption-sensitive-columns`: Detect sensitive data in models, stop, flag, and encrypt with the built-in encryption service.

## Canonical Build Order

package coverage → env/config → migration → model → validator → policy → service → transformer → side effects → controller → routes → tests → UI

## Key Defaults

- Named routes, route helpers, separate web and `/api` groups. Controllers imported via `import { controllers } from '#generated/controllers'` and referenced as `controllers.Posts`, not `controllers.PostsController`.
- Services: `list`, `findOrFail`, `create`, `update`, `delete`.
- One validator per action (built with `vine.create({...})`). One policy per resource. `denies(...)` checks.
- Web: redirect + flash. API (framework doctrine): `serialize(...)` with a transformer emits `{ data }` / `{ data: [...] }` / `{ data, meta }` — never double-wrap it. This is not a universal rule that every endpoint must be `{ data }`: ad-hoc endpoints (signed URLs, counts, health probes, token-exchange responses) legitimately return their own typed shape. A uniform `{ data }` contract across every endpoint is applicative-level, not framework-level. Errors stay flat `{ code, message }`. Statuses: 201 create, 200 update, 204 delete, 403 forbidden, 404 not found, 409 conflict.
- Shared Inertia props: core keys are `user`, `flash`, `errors`. Additional global shell metadata is allowed but must live under a single `app` namespace (for example `app.name`, `app.env`, `app.locale`, `app.version`); no arbitrary top-level keys outside the core. Middleware extends `BaseInertiaMiddleware`. Augment `SharedProps` via `declare module '@adonisjs/inertia/types'`.
- Inertia `Link` and `Form` from `@adonisjs/inertia/react` take `routeParams={{ id }}` — never `params={{ id }}`.
- Page props typed with `InertiaProps<{...}>` from `~/types` and `Data.<Resource>` from `@generated/data`.
- SSR off. Mantine + Tabler icons. `@adonisjs/inertia/react` Link and Form.
- `tests/functional` for request flows, `tests/unit` for isolated logic.

## Runtime Prerequisites

- Node.js ≥ 24, npm ≥ 11. TypeScript 5.9/6.0, Vite 7 for Inertia stacks.
- Scaffold: `npm create adonisjs@latest my-app -- --kit=<hypermedia|react|vue|api>`. All four kits produce a flat AdonisJS application.
- Dev server: `node ace serve --hmr`.
- `adonisrc.ts` must declare `hooks.init` with `indexEntities()` (mandatory), plus `indexPages({ framework: 'react' })`, `generateRegistry()`, and `indexPolicies()` per stack.

## Source of Truth

- `SKILL.md` and `rules/manifest.json` in the `adonisjs-7-deterministic` skill pack.
