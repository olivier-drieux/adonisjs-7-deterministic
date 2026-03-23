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

- `hb.official-packages`: Use official AdonisJS packages and `node ace` generators first.
- `hb.data-stack`: Lucid for SQL persistence, Luxon DateTime for dates. No Prisma/Drizzle.
- `hb.validation-stack`: VineJS with `request.validateUsing(...)`. No inline validation.
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
- `hb.no-raw-io-and-timers`: No raw nodemailer, raw fs, ad hoc timers in HTTP.
- `hb.no-client-fetch-stack`: No raw fetch/axios/ky/SWR as default.
- `hb.no-client-form-stack`: No @mantine/form, react-hook-form, formik, zod, yup, valibot.
- `hb.no-custom-api-keys-default`: No custom API-key auth as default.

## Canonical Build Order

package coverage → env/config → migration → model → validator → policy → service → transformer → side effects → controller → routes → tests → UI

## Key Defaults

- Named routes, route helpers, separate web and `/api` groups.
- Services: `list`, `findOrFail`, `create`, `update`, `delete`.
- One validator per action. One policy per resource. `denies(...)` checks.
- Web: redirect + flash. API: `serialize(...)`, flat `{ code, message }` errors, 201/200/204/403/404.
- Shared Inertia props: `auth`, `flash`, `errors`, `app { name, env }` only.
- SSR off. Mantine + Tabler icons. `@adonisjs/inertia/react` Link and Form.
- `tests/functional` for request flows, `tests/unit` for isolated logic.

## Source of Truth

- `SKILL.md` and `rules/manifest.json` in the `adonisjs-7-deterministic` skill pack.
