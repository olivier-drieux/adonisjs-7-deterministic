# AdonisJS 7 Deterministic Doctrine

This project uses a fail-closed deterministic doctrine for AdonisJS v7. Every code suggestion, generation, and review must comply with these rules.

## Profiles

Before writing any code, determine the application profile:
- **web**: Inertia React pages, session/cookie auth, no JSON-first page architecture.
- **mixed**: Inertia React pages + separate `/api` group with separate API controllers. Browser clients stay on session auth.
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
| Vue, Edge feature pages | Inertia React + Mantine | `hb.web-ui-stack` |
| `react-router-dom` | Inertia navigation | `hb.web-ui-stack` |
| CASL | `@adonisjs/bouncer` | `hb.official-side-effect-packages` |
| Raw nodemailer | `@adonisjs/mail` | `hb.official-side-effect-packages` |
| Raw `fs` for app storage | `@adonisjs/drive` | `hb.official-side-effect-packages` |
| Express/Fastify patterns | Framework-native routes, middleware, services | `hb.no-express-fastify-composition` |
| Repository layer over Lucid | Direct model + service usage | `hb.no-repository-layer` |
| Edge for feature rendering | Only `inertia_layout.edge` boot layout | `hb.no-edge-feature-rendering` |
| `any` type | Concrete types | `hb.no-any` |
| `nodemailer`, raw `fs`, `setInterval` in HTTP | Official packages, Ace commands, listeners | `hb.no-raw-io-and-timers` |
| `fetch(`, `axios`, `ky`, `SWR` | Inertia props/redirects, Tuyau when justified | `hb.no-client-fetch-stack` |
| `@mantine/form`, `react-hook-form`, `formik` | `@adonisjs/inertia/react` Form + VineJS | `hb.no-client-form-stack` |
| `zod`, `yup`, `valibot` | Server-side VineJS validation | `hb.no-client-form-stack` |
| Mixed page+API controller | Separate web and API controllers | `hb.web-api-controller-separation` |

## Canonical Build Order

package coverage → env/config → migration → model → validator → policy → service → transformer → side effects → controller → routes → tests → UI

## Key Defaults

- Named routes and route helpers, separate web and `/api` groups. Controllers via `import { controllers } from '#generated/controllers'` and referenced as `controllers.Posts`.
- Services with canonical verbs: `list`, `findOrFail`, `create`, `update`, `delete`.
- One validator per action built with `vine.create({...})`. One policy per protected resource. Prefer `denies(...)` checks.
- Web mutations: redirect + flash. API: `serialize(...)` with transformers (already produces `{ data }` / `{ data, meta }`), flat `{ code, message }` errors.
- Status codes: 201 create, 200 update, 204 delete, 403 forbidden, 404 not found.
- Shared Inertia props: only `user`, `flash`, `errors`, `app { name, env }`. Middleware extends `BaseInertiaMiddleware`.
- Page props typed with `InertiaProps<{...}>` from `~/types` and `Data.<Resource>` from `@generated/data`.
- Inertia `Link` and `Form` take `routeParams={{ id }}` — never `params={{ id }}`.
- SSR off by default. Mantine + Tabler icons. `@adonisjs/inertia/react` Link and Form.
- Tests: `tests/functional` for request flows, `tests/unit` for isolated logic.

## Runtime Prerequisites

- Node.js ≥ 24, npm ≥ 11.
- Scaffold: `npm create adonisjs@latest my-app -- --kit=<hypermedia|react|vue|api>`. All four kits produce a flat AdonisJS application.
- Dev server: `node ace serve --hmr`.
- `adonisrc.ts` must declare `hooks.init` with `indexEntities()` (mandatory), plus `indexPages({ framework: 'react' })`, `generateRegistry()`, and `indexPolicies()` per stack.

## Source of Truth

For the complete rules, see the `adonisjs-7-deterministic` skill pack in this repository.
