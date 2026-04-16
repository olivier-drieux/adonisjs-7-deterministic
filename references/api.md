# API

## Mixed-App Surfaces

A `mixed` application has **five distinct surfaces**. Each surface has its own controllers, middleware, auth, and CSRF policy. A single controller never straddles two surfaces. Classify every route by ROLE (caller and purpose), not by URL prefix.

| Surface | What it is | Auth | CSRF | Prefix |
|---|---|---|---|---|
| `web` | Inertia React pages and page actions | session/cookie on `web` guard | **on** (`enableXsrfCookie: true`) | no `/api` prefix |
| `api.internal` | Same-origin JSON endpoints called by the app's own browser (widgets, explicit client fetches) | session/cookie on `web` guard | **on** | `/api` (optionally `/api/internal`) |
| `api.external` | JSON endpoints for external/mobile/machine clients | access tokens on `api` guard | **off** (tokens, not cookies) | `/api` (optionally `/api/external`) |
| `webhooks` | Inbound JSON from third-party providers | signature/HMAC verification per provider | **off** | `/webhooks` |
| `runtime` | Infrastructure endpoints (MCP tool servers, health/liveness/readiness probes, debug/introspection, local bridges, operator tooling) | purpose-specific (none, IP allow-list, or a per-endpoint secret header) | **off** | `/mcp`, `/health`, per-endpoint |

- `api.internal` and `api.external` are two different surfaces even when they live under the same top-level `/api` prefix — separate their route groups, middleware, and controllers explicitly. If both surfaces coexist, prefer the nested `/api/internal` and `/api/external` sub-prefixes to make the split observable.
- `webhooks` is never folded into the API surface. It has its own prefix (`/webhooks/<provider>`), its own verification middleware, and its own controllers.
- `runtime` is the catch-all for HTTP endpoints that are *not* a browser page, *not* an application API (internal or external), and *not* a third-party webhook. MCP (`/mcp`), health probes (`/health/live`, `/health/ready`), debug/introspection routes, and local subprocess bridges all live here. Its callers are local subprocesses, probes, MCP hosts, or operators — never the app's own browser, a mobile client, or a third party. Never absorb a runtime endpoint into `api.internal` or `api.external` just because it happens to return JSON.

## Profiles

- `web` profile: no `/api`, no webhooks unless the product explicitly adds them. A small `runtime` surface (for example a single `/health/live` probe) is still allowed in `start/routes.ts`.
- `mixed` profile: all five surfaces listed above are available; apply them only when the surface is actually used.
- `api-only` profile: no `inertia/*` pages. Default to the `api.external` surface; add a `webhooks` surface if inbound webhooks are part of the product, and add a `runtime` surface if the app exposes MCP, health probes, or operator tooling. Prefer the API starter kit and configure access tokens when the clients are external.

## Routing

- Group each surface under its own `.prefix(...).as(...)` block and its own middleware chain — do not share middleware across `api.internal`, `api.external`, `webhooks`, and `runtime`.
- `api.internal`: `.prefix('/api').as('api').use(middleware.auth())` (session-backed) — or `.prefix('/api/internal')` if `api.external` is also mounted.
- `api.external`: `.prefix('/api').as('api.external').use(middleware.auth({ guards: ['api'] }))` — or `.prefix('/api/external')` if `api.internal` is also mounted.
- `webhooks`: `.prefix('/webhooks').as('webhooks').use(middleware.verifyWebhook(...))` — one middleware per provider for signature verification; CSRF stays off on this group.
- `runtime`: declared route-by-route (no shared `.prefix(...)` is required — health lives at `/health/*`, MCP lives at `/mcp`, bridges use per-endpoint paths). Middleware is bespoke (none, a local-only IP allow-list, or a per-endpoint shared-secret header). Never mount `runtime` routes under the same `.group(...)` as `api.internal` or `api.external`.
- Use `router.resource(...).apiOnly()` only for pure CRUD.
- Use explicit routes for custom actions, mixed middleware, or workflow endpoints.
- In mixed apps, never reuse the web controller for any API or webhook route group, never reuse an `api.internal` controller for `api.external` (or vice versa), and never fold `/mcp` or `/health` into an API controller.
- **Before any routing refactor or split, run the HTTP surface inventory** (`hb.http-surface-inventory`) — enumerate every mounted route, detect atypical declarations (`router.on`, `router.any`, `router.route`, closures, healthchecks, MCP endpoints), and classify each by role. See `references/routing.md#http-surface-inventory`.
- When two or more of the five surfaces are actually mounted, split the route declarations into one file per surface (`start/routes.ts` for `web`, `start/routes/api_internal.ts`, `start/routes/api_external.ts`, `start/routes/webhooks.ts`, `start/routes/runtime.ts`) registered via `adonisrc.ts` `preloads`. See `references/routing.md#multi-surface-route-files` for the canonical scaffold with `node ace make:preload routes/<surface> --environments=web`.

## Controllers

- API controllers return JSON only.
- Standard order: validate, authorize, service, transform, return.
- Prefer explicit `bouncer.with(...).denies(...)` checks in controller code.
- When returning transformer output, use `serialize(PostTransformer.transform(...))` or `serialize(PostTransformer.paginate(...))`.
- No redirects, flash, or Inertia rendering in API controllers.

## Response Shapes

### Framework-level doctrine — `serialize(...)` + transformer

The framework `serialize(...)` helper in AdonisJS v7, when passed the output of a transformer, produces a canonical shape:

- Single resource: `{ data: { ... } }` — the serializer wraps the transformed object in a `data` key.
- Non-paginated list: `{ data: [ ... ] }` — the serializer wraps the transformed array in `data`.
- Paginated list: `{ data: [ ... ], meta: { ... } }` — the serializer emits the standard paginator envelope.

These are the shapes `serialize(...)` emits **when you use it with a transformer**. They are framework output, not a custom response envelope.

**Rule:** when you return a resource, a collection, or a paginated collection, go through `serialize(...)` and return its output directly. Do not double-wrap it (no `response.ok({ data: serialize(...) })`, no `{ success: true, payload: ... }`).

### Ad-hoc endpoints — no `{ data }` required

`serialize(...)` is a transformer mechanism. It is **not** a framework rule that every API endpoint must be shaped as `{ data }`. Endpoints that do not return a resource, a collection, or a paginator are free to return their own typed object:

- `{ url }` — e.g. a signed-URL response from Drive.
- `{ count }` — e.g. a badge or widget count endpoint.
- `{ status: 'ok' }` — a health or readiness probe.
- `{ accessToken, expiresAt }` — a token-exchange response.
- Any other small, purpose-built payload that does not represent a domain resource.

These shapes are legitimate. They are not a violation of this doctrine. Do not force them through a transformer just to produce a `{ data }` wrapper.

### Applicative-level doctrine — uniform `{ data }` is optional

A project may choose to enforce a uniform `{ data }` contract across every endpoint (for example, to keep its client generator simple). That is an **applicative-level** layered decision, not a framework rule. The skill does not impose it.

- If your repo enforces a uniform contract, document it locally and honor it.
- If it does not, keep ad-hoc endpoints ad-hoc and reserve `serialize(...)` for resources/collections/paginators.

### Errors

Domain errors use a flat `{ code, message }` shape; do not introduce a global `error` envelope.

## Status Codes

- Create: `201`
- Update: `200`
- Delete: `204`
- Forbidden: `403`
- Not found: `404`
- Conflict: `409`
- Default authorization failure is `403`, not `404`, unless the target repo already hides resource existence.

## Query Params

- Use `page`, `perPage`, `q`, `sort`, and `direction`.
- Default `perPage` to `20`.
- Cap `perPage` at `100`.
- Non-trivial list endpoints use a dedicated validator for query params.
- Sorting MUST be whitelisted in the service or query layer.

## Authentication

- `api.internal`: browser traffic from the same application stays on session auth (`web` guard). CSRF stays on.
- `api.external`: external clients default to official access tokens on the `api` guard. CSRF stays off on this group (tokens, not cookies).
- `webhooks`: no user auth. Each provider has its own signature/HMAC verification middleware. CSRF stays off.
- `runtime`: no user auth by default. Use a purpose-specific guard per endpoint — a local-only IP allow-list for MCP, nothing for liveness probes, a per-endpoint shared-secret header for operator bridges. Never apply the `web` guard (would force a session) or the `api` guard (access tokens are for external clients, not subprocesses). CSRF stays off.
- Keep access-token expiration explicit and default it to `30 days`.
- Do not implement a custom API-key model as the default skill path.

## Boundaries

- Use API endpoints for integrations, machine clients, or explicit API interactions.
- Do not treat ordinary Inertia page flows as hidden JSON mini-APIs.
