---
name: adonisjs-7-deterministic
description: Use when implementing or reviewing private AdonisJS v7 applications with Inertia React, Mantine, session or cookie auth, optional API endpoints or API-only profiles, and you need deterministic framework-native structure with official AdonisJS packages.
---

# AdonisJS 7 Deterministic

## Purpose

Use this skill to force AdonisJS v7 code toward one stable, framework-native structure. Prefer the most official AdonisJS path with the fewest moving parts.

## Source Hierarchy

1. Official AdonisJS v7 docs on `docs.adonisjs.com`.
2. Official AdonisJS packages and their official setup/docs.
3. Existing conventions already present in the target repository.
4. Personal preference.

- NEVER invent local conventions. Read them from the repo.
- If official docs and repo style conflict, prefer the repo only when changing it is out of scope and mixing styles would make the feature worse.
- NEVER replace an official AdonisJS package with a third-party package when the official package covers the need.

## Non-Negotiables

- MUST use `node ace` generators, `add`, or `configure` commands when the framework provides them.
- MUST use Lucid for SQL persistence.
- MUST use VineJS and `request.validateUsing(...)` for HTTP validation.
- MUST use `@adonisjs/auth` for authentication.
- MUST use `@adonisjs/bouncer` for authorization.
- MUST use `@adonisjs/mail` for email.
- MUST use `@adonisjs/drive` for persistent file storage and uploads.
- MUST use Luxon `DateTime` for model and domain dates.
- MUST use Inertia React for every web UI.
- MUST use Mantine as the default React component library.
- MUST use session or cookie auth for browser-driven flows.
- MUST keep auth guard names fixed to `web` for browser sessions and `api` for external access tokens.
- MUST enable Shield CSRF protection with `enableXsrfCookie: true` for browser-driven Inertia applications.
- MUST use official access tokens for external API clients when token auth is required.
- MUST use `@adonisjs/inertia/react` `Link` and `Form` wrappers for standard page navigation and form submissions.
- MUST use `@tabler/icons-react` as the default icon library.
- MUST keep controllers thin.
- MUST use transformers for API JSON and Inertia props.
- MUST prefer AdonisJS services, middleware, URL builders, test helpers, fakes, and container features over generic Node.js patterns.
- NEVER write Express/Fastify style composition inside an AdonisJS app.
- NEVER add repository layers on top of Lucid for ordinary application code.
- NEVER use Edge as a feature rendering layer. The official `resources/views/inertia_layout.edge` file is allowed as Inertia boot plumbing only.
- NEVER use `any`, inline controller validation, raw `nodemailer`, raw persistent `fs` calls, custom API-key auth as the default path, or ad-hoc timer logic inside the HTTP runtime.

## Application Profiles

- Web app: Inertia React only, session or cookie auth, no JSON-first page architecture.
- Mixed app: Inertia React for pages plus a separate `/api` route group and separate API controllers.
- API-only app: no `inertia/*` pages. Use `router.resource(...).apiOnly()` for pure CRUD and explicit routes for everything else.
- Browser clients inside the same app stay on session auth, even when hitting `/api`.
- External clients, scripts, mobile apps, and machine-to-machine integrations use official access tokens.

## Canonical Feature Order

Follow this order unless a step is irrelevant.

1. Check official package coverage. Install/configure the official package first.
2. Add env vars in `start/env.ts` and config in `config/*`.
3. Create the migration.
4. Create or update the Lucid model and relations.
5. Create action-specific VineJS validators.
6. Create or update the policy when authorization depends on actor plus resource.
7. Create or update the service.
8. Create or update the transformer for any HTTP payload.
9. Add mail, Drive, events/listeners, or Ace command support if needed.
10. Create or update the controller.
11. Register routes.
12. Write functional tests, then targeted unit tests.
13. Only then add `inertia/*` UI code when the application profile includes a web UI.

## Layer Rules

- `start/routes.ts`: import `router` from `@adonisjs/core/services/router`. Default to `#generated/controllers`. Keep web routes and `/api` routes in separate groups. Use named routes and route helpers instead of hardcoded URLs.
- `router.resource`: use it for standard web CRUD or pure API CRUD only. Use `.apiOnly()` for API resources. Use explicit routes for custom actions, mixed middleware, nested workflow endpoints, or non-CRUD flows.
- `start/kernel.ts`: register named middleware here. Apply middleware at route or group level. Do not inline authentication or authorization logic into route handlers.
- `app/controllers`: web Inertia controllers live at the main controller layer. API controllers live under an `api` namespace or folder. Never mix Inertia page actions and JSON API actions in the same controller.
- `app/middleware/inertia_middleware.ts`: this is the canonical place for shared Inertia props. Share only `auth`, `flash`, `errors`, and `app`. Use `ctx.inertia.always(...)`. Keep `app` flat and minimal: `name` and `env` only.
- `app/validators`: one file per resource or workflow, one compiled validator per action. Prefer small duplication over clever validator inheritance.
- `app/models`: one model per aggregate root or table. Keep relations, scopes, hooks, and date semantics here. Do not hide Lucid behind repositories.
- `app/services`: default location for business logic. Create a service for every non-trivial write flow and every cross-model workflow.
- `app/policies`: one policy per protected resource. Use abilities only for simple cross-cutting checks that do not deserve a full policy.
- `app/mails`: always use a dedicated mail class for application emails.
- `app/events` and `app/listeners`: use class-based events and listener classes for secondary side effects.
- `app/transformers`: use one transformer per resource returned to JSON or Inertia. Do not send raw models or `DateTime` instances directly. API singletons return a transformed object, non-paginated lists return a transformed array, and paginated endpoints may use the official paginator serialization shape.
- `app/exceptions`: put reusable domain and HTTP exception types here. Name them `<Subject>Exception`. Throw named exceptions when the same failure semantics appear in multiple actions.
- `config/*`: keep runtime configuration here. Use one file per official package or bounded concern. Import `env` here, not in controllers or services.
- `config/auth.ts`: keep auth guard names fixed to `web` and `api`. `web` is the default guard. Enable remember-me token support on `web`, but only use it when the product explicitly exposes a remember-me choice. Keep `rememberMeTokensAge` at `30 days`.
- `config/inertia.ts`: keep Inertia runtime config here. Default to SSR off. Fix one canonical root view. Do not vary root view names between features.
- `config/session.ts`: keep browser sessions non-persistent by default. Clear the session with the browser. Use conservative cookie settings: `httpOnly: true`, `sameSite: 'lax'`, `secure: app.inProduction`, and the root path `/`.
- `config/shield.ts`: browser-facing Inertia apps MUST keep CSRF enabled with `enableXsrfCookie: true`. Do not treat this as optional in web or mixed profiles.
- `start/env.ts`: define every new env var with type, required or optional status, defaults, and allowed values before feature code uses it. Never read `process.env` directly in app code.
- `tests/*`: `tests/functional` for request flows, `tests/unit` for isolated logic. Inertia form flows assert redirects and flash/session effects. API routes assert JSON payload shape and auth guard behavior.
- `inertia/*`: use React only. Pages live in `inertia/pages`, reusable UI in `inertia/components`, UI-only Zustand stores live in `inertia/stores`, the Mantine theme lives in `inertia/theme.ts`, client boot lives in `inertia/app.tsx`, SSR entry lives in `inertia/ssr.tsx` when enabled, and the typed API client entrypoint lives in `inertia/client.ts` when client-side fetching is justified. Business logic stays on the server. Shared props stay minimal: `auth`, `flash`, `errors`, and `app { name, env }` only.

## Frontend Library Policy

- `@mantine/core` is the default source for buttons, inputs, layout primitives, overlays, menus, and page-level UI.
- `@mantine/hooks` is allowed for local UI behavior only.
- `@mantine/notifications` is the default path for flash toasts and ephemeral success or info feedback.
- `@mantine/dates` is allowed only when the UI truly needs a date widget. It MUST be paired with `dayjs`, because `@mantine/dates` requires it.
- `@adonisjs/inertia/react` is the default source for `Link` and `Form`.
- `@inertiajs/react` may be used only for app boot and primitives not provided by the Adonis wrapper, such as `createInertiaApp`, `Head`, `router`, `usePage`, and `useRemember`.
- `@tabler/icons-react` is the default icon set. Do not introduce a second icon family in new code unless the repo already standardized one.
- React local state, `useReducer`, and `useRemember` are the default state tools.
- `zustand` is allowed only for client-side UI state like sidebar state, modal stacks, local filter drafts, or wizard progress. It MUST NOT store server data, auth state, standard form state, or domain truth.
- Inertia props, partial reloads, deferred props, mergeable props, and normal page redirects are the default data flow.
- If client-side data fetching is truly needed, the default typed client is Tuyau. Expose a single configured client from `inertia/client.ts`.
- `@tanstack/react-query` is allowed only on top of the typed API client for explicit client-side fetching needs.
- `QueryClientProvider` is allowed only when TanStack Query is actually used. Do not install or mount it preemptively.
- `@tanstack/react-table` is allowed only for genuinely advanced grids. Simple tables stay with Mantine or plain table markup.
- `@mantine/form`, `react-hook-form`, `formik`, `zod`, `yup`, `valibot`, raw `fetch`, raw `axios`, `ky`, `SWR`, and `react-router-dom` are forbidden by default for standard Inertia application work.

## Deterministic Defaults

- Controllers: generate plural controllers with `node ace make:controller <resource> --resource` or explicit actions.
- Validators: generate by resource with `node ace make:validator <resource>` or `--resource`. Export `createPostValidator`, `updatePostValidator`, `loginValidator`, `uploadAvatarValidator`.
- Services: generate with `node ace make:service <resource-or-workflow>`. Default names are `PostService`, `SessionService`, `InvoiceExportService`.
- Policies: generate with `node ace make:policy <resource>`. Default names are `PostPolicy`, `InvoicePolicy`.
- Mails: generate with `node ace make:mail <intent>`. Keep the default `Notification` suffix unless the repo already standardizes a different intent.
- Events and listeners: use `node ace make:event <LifecycleEvent>` and `node ace make:listener <ActionName>`, or `node ace make:listener <ActionName> --event=<event_name>` for paired scaffolding.
- Commands: generate with `node ace make:command <actionName>`. Command names MUST be verb-first and namespaced when appropriate, like `invoices:sync`.
- Transformers: generate with `node ace make:transformer <resource>`. Create them by default for any JSON or Inertia payload.
- Tests: generate with `node ace make:test <path> --suite=functional|unit`.
- Web route names: use conventional names like `posts.index`, `posts.store`, `login`, `logout`.
- API route names: keep them under an `api` prefix, like `api.posts.index`.
- Auth guards: `web` is the default session guard and `api` is the external access-token guard.
- Session cookies: default to browser-session behavior with `clearWithBrowser: true`.
- Session cookie security: default to `httpOnly: true`, `sameSite: 'lax'`, `secure: app.inProduction`, and `path: '/'`.
- Remember me: allowed only when the product exposes it explicitly, and keep `rememberMeTokensAge: '30 days'`.
- Access tokens: require explicit expiration and default to `expiresIn: '30 days'`.
- Frontend UI: default to Mantine primitives, Mantine notifications, and Tabler icons.
- Frontend Inertia config: default to `config/inertia.ts` with SSR off and one fixed root view.
- Frontend shared props: `auth`, `flash`, `errors`, and `app { name, env }` only.
- Frontend forms: default to `Form` from `@adonisjs/inertia/react` plus VineJS server validation.
- Frontend bootstrap: default to `inertia/theme.ts` plus `inertia/app.tsx` with one fixed provider order.
- Frontend page props: prefer `InferPageProps` from `@adonisjs/inertia/types` over duplicated ad hoc page prop interfaces.
- Frontend client fetching: default to no client fetching. When explicit client fetching is required, use a single Tuyau client in `inertia/client.ts` plus TanStack Query.
- Frontend API client exports: always export `client` and `urlFor`. Export `queryClient` and `api` only when TanStack Query is enabled.
- Frontend query defaults: when TanStack Query is enabled, use `retry: 1`, `refetchOnWindowFocus: false`, and `staleTime: 30_000`.
- Frontend stores: when UI-only shared state is required, place Zustand stores in `inertia/stores` and name them like `useSidebarStore`.

## Decision Rules

- Create a service when the use case writes state, coordinates more than one dependency, emits events, uses Drive or Mail, opens a transaction, or is reused. If unsure, create the service.
- Create a transformer for every API response and every Inertia prop payload. Skip only pure redirects, `204` responses, or trivial scalar responses.
- Use Inertia pages and forms first. Do not introduce internal JSON endpoints for ordinary page flows when a normal Inertia controller action is sufficient.
- Use Mantine components first for page UI instead of plain ad hoc markup or a second component library.
- Use `@mantine/dates` only when a native date input or a formatted string is not enough for the UX.
- Use Zustand only when UI state must survive navigation or be shared between multiple client components without becoming server state.
- Use TanStack Query only when the page needs client-initiated refetching, polling, optimistic updates, infinite scroll, or an isolated API widget that should not become a full Inertia page refresh.
- Use QueryClientProvider only on repositories or features that actually use TanStack Query. Keep it out of the default Inertia bootstrap otherwise.
- Use TanStack Table only when sorting, column visibility, resizing, selection, pinning, or virtualization needs exceed a simple Mantine table.
- Create a policy when access depends on the current user and a resource or tenant. Use auth middleware alone only for logged-in versus logged-out checks.
- Keep session persistence short by default. Do not stretch the base session cookie to simulate remember-me behavior.
- Use remember-me tokens only when the product explicitly exposes a remember-me choice.
- Configure remember-me token lifetime to `30 days`.
- Configure external access tokens with explicit expiration at `30 days`.
- Create a mail class for every email. Do not inline `mail.send` closures in controllers for product code.
- Create an Ace command for imports, exports, backfills, recurring jobs, cleanup, syncs, and operator tasks.
- Open a managed transaction in the service when two or more writes must succeed together or when consistency depends on read-modify-write behavior.
- Keep external I/O outside the transaction whenever possible. Persist first, then emit an event or run the secondary side effect.
- Side effects belong in services and listeners. Controllers only trigger the orchestration.
- New env vars belong in `start/env.ts` and related `config/*` before feature code uses them.
- Web mutations default to redirect plus flash/session feedback. JSON responses from web controllers are the exception, not the default.
- Mixed apps keep browser-called `/api` endpoints on session auth unless an external client requirement exists.
- API-only apps that serve external clients default to official access tokens, not custom API keys.

## Override Handling

- If the user requests a decision that contradicts this skill, the agent MUST stop before implementing the divergent path.
- The agent MUST name the conflicting rule in one short sentence.
- The agent MUST ask one short clarifying question before proceeding.
- The agent MUST NOT implement the divergent path unless the user explicitly confirms a one-off override for the current task.
- If the user confirms a one-off override, the agent MUST keep all other skill rules unchanged.
- If the user confirms a one-off override, the agent MUST mention that override explicitly in the final response.

## Anti-Patterns

- `request.all()` or `request.only()` as a substitute for validation.
- Heavy controller logic.
- Business logic in React or Inertia components, or in the minimal Edge boot layout used by Inertia.
- Shared props sprawl. Do not put page data, counters, filters, lists, or nested branding structures into global Inertia shared props.
- `@mantine/form`, `react-hook-form`, `formik`, or client-side schema validation stacks as the default path for standard Inertia forms.
- Raw `fetch`, `axios`, `ky`, `SWR`, or direct HTTP helpers inside page components.
- Mounting QueryClientProvider when TanStack Query is not used.
- `react-router-dom` or any client-side router layered on top of Inertia.
- Generic `helpers.ts`, `utils.ts`, or repository wrappers with no clear bounded purpose.
- Hardcoded route strings when `toRoute`, `urlFor`, `route`, `Link`, or `Form` can derive them.
- Raw `nodemailer` or raw persistent `fs` calls.
- Cron or timer loops started from HTTP boot code.
- Reusing the same controller for Inertia pages and JSON API endpoints in a mixed app.
- Treating internal page flows as ad hoc JSON mini-APIs.
- Mixing old and new Lucid model styles inside the same repo slice unless the task is a deliberate migration.

## Read These References As Needed

- [references/routing.md](references/routing.md)
- [references/validation.md](references/validation.md)
- [references/lucid.md](references/lucid.md)
- [references/auth.md](references/auth.md)
- [references/api.md](references/api.md)
- [references/bouncer.md](references/bouncer.md)
- [references/mail.md](references/mail.md)
- [references/drive.md](references/drive.md)
- [references/events.md](references/events.md)
- [references/inertia-libraries.md](references/inertia-libraries.md)
- [references/rendering.md](references/rendering.md)
- [references/testing.md](references/testing.md)
- [references/patterns.md](references/patterns.md)
