# Rule Catalog

`rules/manifest.json` is the canonical source of truth for this skill pack.

Use this file as the human-readable index:

- `hard_blocker`: the agent must stop, cite the rule id, ask exactly one short override question, and wait.
- `enforced_default`: the agent applies the rule by default, but it does not stop execution.
- `advisory`: the agent uses the rule as a tie-breaker or maintainability preference.

## Hard Blockers

- `hb.official-packages`: official AdonisJS packages, official setup flows, and `node ace` generators come first.
- `hb.data-stack`: Lucid for SQL persistence and Luxon `DateTime` for domain/model dates.
- `hb.validation-stack`: VineJS plus `request.validateUsing(...)`; no inline validation.
- `hb.auth-browser-stack`: `@adonisjs/auth` plus session/cookie auth for browser-driven flows.
- `hb.guard-names`: fixed guard names `web` and `api`.
- `hb.browser-csrf`: browser-facing Inertia apps keep `enableXsrfCookie: true`.
- `hb.access-tokens-external`: external clients use official access tokens with explicit expiration.
- `hb.web-ui-stack`: Inertia React plus Mantine for web UI; no second client router.
- `hb.official-side-effect-packages`: `@adonisjs/bouncer`, `@adonisjs/mail`, and `@adonisjs/drive` when those concerns apply.
- `hb.web-api-controller-separation`: mixed apps never reuse one controller for pages and JSON API endpoints.
- `hb.no-express-fastify-composition`: no Express/Fastify-style composition inside an AdonisJS app.
- `hb.no-repository-layer`: no repository layer over Lucid for ordinary app code.
- `hb.no-edge-feature-rendering`: Edge is only allowed for the minimal Inertia boot layout.
- `hb.no-request-all-only`: `request.all()` and `request.only()` never replace validation.
- `hb.no-any`: no `any`.
- `hb.no-raw-io-and-timers`: no raw `nodemailer`, no persistent raw `fs`, no ad hoc timers in HTTP runtime.
- `hb.no-client-fetch-stack`: no raw `fetch`, `axios`, `ky`, or `SWR` as the default client data stack.
- `hb.no-client-form-stack`: no `@mantine/form`, `react-hook-form`, `formik`, `zod`, `yup`, or `valibot` as the default form stack.
- `hb.no-custom-api-keys-default`: no custom API-key auth as the default external auth path.

## Enforced Defaults

- `ed.source-hierarchy`: official docs/packages, then repo conventions, then personal preference.
- `ed.application-profiles`: choose `web`, `mixed`, or `api-only` first and keep the profile stable.
- `ed.feature-order`: package coverage, env/config, migration, model, validator, policy, service, transformer, side effects, controller, routes, tests, UI.
- `ed.routing-and-kernel`: named routes, helpers, separate route groups, and middleware in `start/kernel.ts`.
- `ed.inertia-shared-props`: only `auth`, `flash`, `errors`, and `app { name, env }`.
- `ed.service-layer`: business logic in services with canonical verbs and domain returns.
- `ed.validator-layer`: one validator per action, prefer explicit duplication over inheritance.
- `ed.model-and-policy-layer`: model relations/hooks stay in models; policies stay explicit and default to `403`.
- `ed.mail-events-transformers-exceptions`: dedicated mail classes, class-based events/listeners, transformers, and named exceptions.
- `ed.config-and-env`: runtime config in `config/*`; env declarations in `start/env.ts`.
- `ed.auth-session-and-shield-config`: canonical auth/session/shield/inertia defaults, including remember-me and cookie policy.
- `ed.testing-layout`: `tests/functional` for request flows and `tests/unit` for isolated logic.
- `ed.inertia-filesystem-layout`: canonical `inertia/*` directory structure and server-owned business logic.
- `ed.frontend-library-and-state-policy`: Mantine-first UI, limited `@inertiajs/react`, UI-only Zustand, Tuyau for explicit client fetches, TanStack only when justified.
- `ed.generators-and-naming`: `node ace` generators and canonical names for routes, services, validators, policies, and commands.
- `ed.api-contracts`: `serialize(...)` with transformers, flat `{ code, message }` errors, canonical status codes.
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
