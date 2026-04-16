# Routing

## Defaults

- Import `router` from `@adonisjs/core/services/router`.
- Default to controller routes via the generated barrel: `import { controllers } from '#generated/controllers'`.
- Reference controllers by their **PascalCase resource name** (the v7 barrel convention), e.g. `controllers.Posts`, `controllers.Session`, `controllers.ApiPosts`. Do not use the full class-name suffix (`controllers.PostsController`) — that is not how the v7 barrel exposes entries.
- The dev server must be running so the assembler can keep `#generated/controllers` in sync when you add or rename a controller file.
- Use `router.on().renderInertia(...)` only for truly static pages with no controller logic.
- Put static routes before dynamic routes.
- Name every closure route with `.as(...)`.
- Use route matchers for typed params when they clarify intent, especially `number()` and `uuid()`.
- In mixed apps, keep web and `/api` routes in separate groups and use separate controllers.
- In `mixed` apps with **two or more** of the five surfaces (`web`, `api.internal`, `api.external`, `webhooks`, `runtime`) actually mounted, split the route declarations into one file per surface (see `## Multi-Surface Route Files`). A single `start/routes.ts` holding every surface hides the surface boundary and is not allowed.
- **Before any routing refactor, split, or reorganization, run the HTTP surface inventory (`hb.http-surface-inventory`) first** (see `## HTTP Surface Inventory`). Routes are classified by **role** (caller, purpose), not URL prefix. A `/mcp` endpoint, a `/health` probe, an operator bridge, or a `router.on(...)` call hidden inside `start/routes.ts` is *not* an `api.internal` route just because it sits under `/api`-adjacent imports.

## Stable Route File Order

1. Public static pages.
2. Guest-only auth routes.
3. Authenticated web routes.
4. API routes under `/api`.
5. Fallback or special-case routes last.

## `router.resource` Versus Explicit Routes

- Use `router.resource('posts', controllers.Posts)` only when one web controller owns standard CRUD pages and actions.
- Use `router.resource('posts', controllers.ApiPosts).apiOnly()` only for pure API CRUD.
- Use explicit routes for:
  - custom actions like `publish`, `archive`, `impersonate`, `export`
  - mixed middleware or policy shape
  - multi-step workflows
  - nested routes that are not plain child CRUD

## Canonical Route Shapes

```ts
import router from '@adonisjs/core/services/router'
import { controllers } from '#generated/controllers'
import { middleware } from '#start/kernel'

router
  .group(() => {
    router.get('login', [controllers.Session, 'create'])
    router.post('login', [controllers.Session, 'store'])
  })
  .use(middleware.guest())

router
  .group(() => {
    router.post('logout', [controllers.Session, 'destroy'])
    router.resource('posts', controllers.Posts)
    router.post('posts/:id/publish', [controllers.PostPublish, 'store']).as('posts.publish')
  })
  .use(middleware.auth())

router
  .group(() => {
    router.resource('posts', controllers.ApiPosts).apiOnly()
    router.get('posts/search', [controllers.ApiPostSearch, 'index']).as('posts.search')
  })
  .prefix('/api')
  .as('api')
  .use(middleware.auth())
```

## The Five Surfaces

A mixed AdonisJS application has up to **five** explicit HTTP surfaces. The four most common are web, api.internal, api.external, and webhooks; the fifth is a generic **runtime** surface for infrastructure endpoints that do not fit any of the other four roles.

| Surface | Role | Auth | CSRF | Typical mount |
| --- | --- | --- | --- | --- |
| `web` | Inertia React pages, page actions (the app's own browser UI) | session / cookie (`web` guard) | on | `/` (no prefix) |
| `api.internal` | Same-origin JSON called by the app's own browser (widgets, dashboards) | session / cookie (`web` guard) | on | `/api` or `/api/internal` |
| `api.external` | JSON for external/mobile/machine clients | access tokens (`api` guard) | off | `/api` or `/api/external` |
| `webhooks` | Inbound JSON from third parties | per-provider signature/HMAC | off | `/webhooks` |
| `runtime` | MCP tool servers, health/liveness/readiness probes, debug/introspection, local bridges, operator tooling | purpose-specific (none, local-only IP allow-list, or a dedicated secret header) | off | `/mcp`, `/health`, per-endpoint |

The `runtime` surface is the *catch-all for things that are not a user-facing page, not an application API, and not a third-party webhook*. Its middleware chain is usually bespoke and lean (no session, no CSRF, no access-token guard by default) because its callers are not browsers, mobile clients, or third parties — they are local subprocesses, probes, MCP hosts, or operators.

**Classify every route by ROLE, not by URL prefix.** `/mcp` is not an `api.internal` endpoint just because it sits under path-adjacent imports. `/health/live` is not an `api.external` endpoint just because it returns JSON.

## HTTP Surface Inventory

Before any routing refactor, split, or reorganization, `hb.http-surface-inventory` requires an exhaustive inventory. Skipping it is the canonical way to lose atypical routes during a URL-prefix split (the real-world failure mode: a `/mcp` route declared in `start/routes.ts` gets absorbed into `start/routes/api_internal.ts` because the refactor only looked at files named `api*.ts`).

### Inventory Steps

1. **Read the roots.** Read `start/routes.ts` and every file it transitively imports, plus every file listed in `adonisrc.ts` `preloads`. Do not rely on filenames — read the actual imports.
2. **Enumerate every mounted route.** Not just the ones under `/api` or `/webhooks`. Every `router.*(...)` call counts.
3. **Detect atypical declarations.** A URL-prefix or file-name scan will miss these:
   - `router.on(path).renderInertia(...)` — static Inertia-rendered pages
   - `router.any(path, handler)` — matches all verbs
   - `router.route(path, ['VERB', 'VERB'], handler)` — explicit verb list
   - Closure/callback handlers: `router.get('/x', () => { ... })`
   - Health-check routes (`router.get('/health/live', [controllers.HealthChecks, 'live'])`)
   - MCP endpoints or other tool-server mounts (`router.post('/mcp', ...)`)
   - Debug/introspection routes, local bridges, operator endpoints
   - Any route whose handler is not a controller reference via `#generated/controllers`
4. **Classify by ROLE.** For each route, write down: *who calls it* and *what is its purpose*. The caller (browser session? mobile external client? third-party webhook? tool subprocess? liveness probe? operator?) determines the surface — not the path.
5. **Produce a surface table BEFORE writing any code.** One row per mounted route. Columns: `path`, `verb`, `handler`, `caller`, `surface`. This table is part of the deliverable.

### Example Inventory Output

```
| path                 | verb | handler                              | caller            | surface      |
| -------------------- | ---- | ------------------------------------ | ----------------- | ------------ |
| /                    | GET  | controllers.Home.index               | browser user      | web          |
| /posts               | GET  | controllers.Posts.index              | browser user      | web          |
| /posts               | POST | controllers.Posts.store              | browser user      | web          |
| /api/widgets         | GET  | controllers.ApiWidgets.index         | same-origin browser | api.internal |
| /api/external/posts  | GET  | controllers.ApiExternalPosts.index   | mobile app        | api.external |
| /webhooks/stripe     | POST | controllers.StripeWebhook.handle     | Stripe            | webhooks     |
| /mcp                 | POST | controllers.McpServer.handle         | MCP host subprocess | runtime    |
| /health/live         | GET  | controllers.HealthChecks.live        | liveness probe    | runtime      |
| /health/ready        | GET  | controllers.HealthChecks.ready       | readiness probe   | runtime      |
```

A route that does not fit `web` / `api.internal` / `api.external` / `webhooks` belongs to `runtime` — never silently absorb it into `api.internal` or `api.external`.

### When the Inventory Is Mandatory

- Every time the user asks for a routing refactor, split, or reorganization.
- Every time a new surface is added to an existing app.
- Every time `start/routes.ts` is edited to move declarations into `start/routes/<surface>.ts`.

Single-line additions to an already-split layout (adding one new route inside an existing `api_internal.ts`) do not require a full inventory, but any reclassification does.

## Multi-Surface Route Files

In a `mixed` application with **two or more** of the five surfaces (`web`, `api.internal`, `api.external`, `webhooks`, `runtime`) actually mounted, route declarations MUST live in one file per surface. A single `start/routes.ts` stacking every surface's `.group(...).prefix(...)` block erases the surface boundary that `hb.web-api-controller-separation` establishes at the controller level.

### File Layout

```
start/
  routes.ts            // web surface only (Inertia pages, session auth, CSRF on)
  routes/
    api_internal.ts    // api.internal (session auth, CSRF on, /api or /api/internal)
    api_external.ts    // api.external (api-guard tokens, CSRF off, /api or /api/external)
    webhooks.ts        // webhooks (per-provider signature, CSRF off, /webhooks)
    runtime.ts         // runtime (MCP, health, bridges; bespoke middleware; no session/CSRF)
```

- `start/routes.ts` stays the canonical root file and keeps the `web` surface. AdonisJS loads it automatically.
- Each additional surface lives in its own file under `start/routes/` and is registered as a **preload file** in `adonisrc.ts`. AdonisJS does NOT auto-import files under `start/` — the `preloads` array in `adonisrc.ts` is the official mechanism.
- A surface file declares exactly one surface. `api_internal.ts` never mounts webhook routes; `webhooks.ts` never mounts internal API routes; `runtime.ts` never mounts application API routes.
- Do not invent alternate file names (`routes/api.ts` holding both `api.internal` and `api.external` is forbidden; so is folding `/mcp` or `/health` into `api_internal.ts`).

### Scaffold With `node ace make:preload`

```sh
# Scope preloads to the web environment so queue/test/repl workers skip them.
node ace make:preload routes/api_internal --environments=web
node ace make:preload routes/api_external --environments=web
node ace make:preload routes/webhooks --environments=web
node ace make:preload routes/runtime --environments=web
```

`node ace make:preload` creates the file under `start/` and appends the entry to `adonisrc.ts` `preloads` automatically. The resulting `adonisrc.ts` preloads array looks like:

```ts
// excerpt
// adonisrc.ts — mixed app registering four additional surface files
export default defineConfig({
  preloads: [
    () => import('#start/routes/api_internal'),
    () => import('#start/routes/api_external'),
    () => import('#start/routes/webhooks'),
    () => import('#start/routes/runtime'),
  ],
  hooks: {
    // ...
  },
})
```

### One Surface Per File

Each preload file declares one route group for one surface. Example for `api.external`:

```ts
// partial snippet
// start/routes/api_external.ts — api.external surface only
import router from '@adonisjs/core/services/router'
import { controllers } from '#generated/controllers'
import { middleware } from '#start/kernel'

router
  .group(() => {
    router.resource('posts', controllers.Posts).apiOnly()
    router.get('posts/search', [controllers.ApiPostSearch, 'index']).as('posts.search')
  })
  .prefix('/api/external')
  .as('api.external')
  .use(middleware.auth({ guards: ['api'] }))
```

And the `runtime` surface keeps MCP, health probes, and operator bridges isolated — no session, no CSRF, no `api` guard:

```ts
// partial snippet
// start/routes/runtime.ts — runtime surface only (MCP + health + bridges)
import router from '@adonisjs/core/services/router'
import { controllers } from '#generated/controllers'

// MCP tool server — called by an MCP host subprocess, not a browser or mobile client.
router.post('/mcp', [controllers.McpServer, 'handle']).as('runtime.mcp')

// Health probes — called by Kubernetes / load balancers / uptime checks.
router.get('/health/live', [controllers.HealthChecks, 'live']).as('runtime.health.live')
router.get('/health/ready', [controllers.HealthChecks, 'ready']).as('runtime.health.ready')
```

The runtime surface is NOT an `api.internal` surface: its callers are not the app's own browser, it does not use session auth, and it does not participate in CSRF. Middleware (if any) is purpose-specific — a local-only IP allow-list, a per-endpoint signature header, or simply nothing for liveness probes.

### When a Single File Is Still Acceptable

- Pure `web` profile (no `/api`, no webhooks): keep everything in `start/routes.ts`.
- Pure `api-only` profile with a single external surface: keep everything in `start/routes.ts`.
- `mixed` with only **one** additional surface on top of `web` (for example `web` + `webhooks` and nothing else): allowed in `start/routes.ts`, but splitting early is still preferred and becomes mandatory the moment a second surface is added.

## URL Generation Rules

- Redirects: use `response.redirect().toRoute(...)`.
- TypeScript outside HTTP responses: use `urlFor(...)`.
- Tests: use the route helper already exposed by the repo.
- Inertia: use `Link` and `Form` route props from `@adonisjs/inertia/*`.
- NEVER hardcode route strings in redirects, templates, mails, or tests when a helper exists.
