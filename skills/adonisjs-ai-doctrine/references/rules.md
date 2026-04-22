# Rule Catalog

`rules/manifest.json` is the canonical source of truth for this skill pack.

Use this file as the human-readable index:

- `hard_blocker`: the agent must stop, cite the rule id, ask exactly one short override question, and wait.
- `enforced_default`: the agent applies the rule by default, but it does not stop execution.
- `advisory`: the agent uses the rule as a tie-breaker or maintainability preference.

## Hard Blockers

- `hb.official-packages`: before implementing any non-trivial feature, (1) check https://packages.adonisjs.com/ for an AdonisJS package, (2) if none found, search https://www.npmjs.com/ for a well-maintained npm package. Use AdonisJS packages first, then vetted npm packages, then custom code as last resort.
- `hb.data-stack`: Lucid for SQL persistence and Luxon `DateTime` for domain/model dates.
- `hb.validation-stack`: VineJS with `vine.create(...)` as the root schema plus `request.validateUsing(...)`; no inline validation and no `vine.compile(vine.object(...))` at the root.
- `hb.auth-browser-stack`: `@adonisjs/auth` plus session/cookie auth for browser-driven flows.
- `hb.guard-names`: fixed guard names `web` and `api`.
- `hb.browser-csrf`: browser-facing Inertia apps keep `enableXsrfCookie: true`.
- `hb.access-tokens-external`: external clients use official access tokens with explicit expiration.
- `hb.web-ui-stack`: Inertia React plus Mantine for web UI; no second client router.
- `hb.official-side-effect-packages`: `@adonisjs/bouncer`, `@adonisjs/mail`, and `@adonisjs/drive` when those concerns apply.
- `hb.web-api-controller-separation`: mixed apps keep one controller per surface. A mixed app has five distinct surfaces (`web`, `api.internal`, `api.external`, `webhooks`, `runtime`); a single controller never straddles two of them, and `/mcp` / `/health` / bridges never get folded into an API controller.
- `hb.http-surface-inventory`: before any routing refactor, split, or reorganization, run an exhaustive HTTP surface inventory — read `start/routes.ts` and every transitive import, enumerate every mounted route (including atypical ones: `router.on`, `router.any`, `router.route`, closures, healthchecks, `/mcp` endpoints), and classify each by ROLE (caller, purpose), not URL prefix. Emit a written surface table before writing code. A route that does not fit `web` / `api.internal` / `api.external` / `webhooks` belongs to the `runtime` surface — never silently absorb it into `api.internal` or `api.external`.
- `hb.no-express-fastify-composition`: no Express/Fastify-style composition inside an AdonisJS app.
- `hb.no-repository-layer`: no repository layer over Lucid for ordinary app code.
- `hb.no-edge-feature-rendering`: Edge is only allowed for the minimal Inertia boot layout.
- `hb.no-request-all-only`: `request.all()` and `request.only()` never replace validation.
- `hb.no-any`: no `any`.
- `hb.no-raw-io-and-timers`: no raw `nodemailer`, no persistent raw `fs`, no ad hoc timers in HTTP runtime. Documented exceptions (isolated, justified, not the default path): short-lived temp-bridge files under `os.tmpdir()` for CLI/MCP/Ace subprocess integration, and bounded timers inside jobs/commands/integrations that run **outside** the HTTP request lifecycle.
- `hb.no-client-fetch-stack`: no raw `fetch`, `axios`, `ky`, or `SWR` as the default client data stack. Documented exceptions (isolated in a typed helper, justified by a real stack limitation, not the default path): incremental streaming (NDJSON/SSE/ReadableStream) that Tuyau and Inertia partial reloads cannot express, and multipart/progress uploads the typed client does not cover.
- `hb.no-client-form-stack`: no `@mantine/form`, `react-hook-form`, `formik`, `zod`, `yup`, or `valibot` as the default form stack.
- `hb.no-custom-api-keys-default`: no custom API-key auth as the default external auth path.
- `hb.queue-stack`: use `@adonisjs/queue` for background jobs. No raw BullMQ, bee-queue, agenda, or ad hoc Redis polling as the default queue path.
- `hb.encryption-sensitive-columns`: proactively detect sensitive data (SSN, credit cards, API secrets, medical records, phone numbers, etc.) in every model and migration. Stop, flag the columns, explain why they need encryption, and recommend the built-in `@adonisjs/core/services/encryption` service — even when the user has not mentioned security.

## Enforced Defaults

- `ed.source-hierarchy`: official docs/packages, then repo conventions, then personal preference.
- `ed.application-profiles`: choose `web`, `mixed`, or `api-only` first and keep the profile stable.
- `ed.feature-order`: check https://packages.adonisjs.com/ first, then env/config, migration, model, validator, policy, service, transformer, side effects, controller, routes, tests, UI.
- `ed.routing-and-kernel`: named routes, helpers, separate route groups, and middleware in `start/kernel.ts`.
- `ed.inertia-shared-props`: middleware extends `BaseInertiaMiddleware`. Core shared props are `user`, `flash`, and `errors`. Additional global shell metadata is allowed but must live under the single `app` namespace (for example `app.name`, `app.env`, `app.locale`, `app.version`). Do not add arbitrary top-level keys outside the core. Augment `SharedProps` via `declare module '@adonisjs/inertia/types'`.
- `ed.service-layer`: business logic in services with canonical verbs and domain returns.
- `ed.validator-layer`: one validator per action, prefer explicit duplication over inheritance.
- `ed.model-and-policy-layer`: model relations/hooks stay in models; policies stay explicit and default to `403`.
- `ed.mail-events-transformers-exceptions`: dedicated mail classes, class-based events/listeners, transformers, and named exceptions.
- `ed.config-and-env`: runtime config in `config/*`; env declarations in `start/env.ts`.
- `ed.auth-session-and-shield-config`: canonical auth/session/shield/inertia defaults, including remember-me and cookie policy.
- `ed.testing-layout`: `tests/functional` for request flows and `tests/unit` for isolated logic.
- `ed.inertia-filesystem-layout`: canonical `inertia/*` directory structure and server-owned business logic.
- `ed.inertia-page-typing`: Inertia page components MUST type props with `InertiaProps<{...}>` from `~/types` and `Data.<Resource>` from `@generated/data`. Never define inline interfaces for transformer-typed data.
- `ed.inertia-component-decomposition`: never declare a React component inside another component's body — nested declarations remount the sub-tree on every render, drop local state, and re-fire effects. Keep small single-use helpers at module scope in the same file; extract to `inertia/components/**/*` as soon as the helper has its own state, effects, reuse across pages, or grows past ~20 lines. Render-prop callbacks (`<Form>{({ errors }) => ...}</Form>`) are not components and stay allowed.
- `ed.frontend-library-and-state-policy`: Mantine-first UI, always use Mantine components over raw HTML when an equivalent exists, limited `@inertiajs/react`, UI-only Zustand, Tuyau for explicit client fetches, TanStack only when justified.
- `ed.css-modules-styling`: CSS Modules (`.module.css`) for all custom styling. `className` for root, `classNames` for Mantine inner parts. Use Mantine CSS variables. No Tailwind, styled-components, Emotion, or global unscoped CSS.
- `ed.generators-and-naming`: `node ace` generators and canonical names for routes, services, validators, policies, and commands. Reference controllers as `controllers.Posts` through `#generated/controllers`, not `controllers.PostsController`.
- `ed.runtime-prerequisites`: Node.js ≥ 24, npm ≥ 11, `npm create adonisjs@latest ... -- --kit=<name>`, `node ace serve --hmr`.
- `ed.adonisrc-hooks`: `adonisrc.ts` declares `hooks.init` with `indexEntities()` (mandatory), `indexPages({ framework: 'react' })`, `generateRegistry()`, and `indexPolicies()` per stack; `buildStarting` wires `@adonisjs/vite/build_hook` for Vite apps.
- `ed.api-contracts`: framework doctrine — `serialize(...)` with a transformer produces the canonical AdonisJS v7 shape (`{ data }` for a resource, `{ data: [...] }` for a collection, `{ data, meta }` for a paginator). Do not double-wrap that output. This is **not** a universal rule that every endpoint must return `{ data }`: ad-hoc endpoints (signed URLs, counts, health, status) legitimately return their own typed shape. A uniform `{ data }` contract across every endpoint is an applicative-level choice, not a framework-level one, and the skill does not impose it. Errors stay flat `{ code, message }`; statuses: 201 create, 200 update, 204 delete, 403 forbidden, 404 not found, 409 conflict.
- `ed.query-pagination`: dedicated list validators, `page`, `perPage`, `q`, `sort`, `direction`, default `20`, max `100`.
- `ed.transactions-side-effects-and-commands`: services orchestrate writes, transactions stay explicit, external I/O stays outside when possible, recurring Ace commands are idempotent.
- `ed.web-mutations-and-browser-api-auth`: redirects plus flash for web mutations, session auth for browser-called `/api`, tokens for external APIs.

## Advisory

- `adv.controller-boundaries`: controllers stay thin and observable.
- `adv.prefer-adonis-primitives`: prefer framework-native services, middleware, URL builders, helpers, fakes, and container features.
- `adv.small-duplication`: explicit duplication beats vague generic helpers.
- `adv.service-when-unsure`: if the structure is ambiguous, extract a service.
- `adv.keep-doctrine-observable`: keep rule ids, profile markers, and compliance markers visible in prompts and evals.

## Coverage

- `eval/cases/*.json` holds the portable prompt fixtures.
- `scripts/score_eval.mjs` scores a captured model response against one fixture.
- `scripts/validate_rules.mjs` enforces rule coverage and schema integrity.
