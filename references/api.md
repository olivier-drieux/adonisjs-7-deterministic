# API

## Profiles

- Mixed app internal API: lives under `/api`, uses dedicated API controllers, and may stay on session auth when called by the same browser application.
- External or integration API: uses official access tokens and dedicated API controllers.
- API-only app: no `inertia/*` pages. Prefer the API starter kit and configure access tokens when the clients are external.

## Routing

- Group API routes under `.prefix('/api').as('api')`.
- Use `router.resource(...).apiOnly()` only for pure CRUD.
- Use explicit routes for custom actions, mixed middleware, or workflow endpoints.
- In mixed apps, never reuse the web controller for the API route group.

## Controllers

- API controllers return JSON only.
- Standard order: validate, authorize, service, transform, return.
- Prefer explicit `bouncer.with(...).denies(...)` checks in controller code.
- No redirects, flash, or Inertia rendering in API controllers.

## Response Shapes

- Single resource: transformed object.
- Non-paginated list: transformed array.
- Paginated list: use the official paginator serialization shape.
- Do not invent a universal `data/meta` envelope for every endpoint unless the target repo already requires it.
- Domain errors use a flat `{ code, message }` shape.

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

- Browser traffic from the same application may stay on session auth.
- External clients default to official access tokens on the `api` guard.
- Keep access-token expiration explicit and default it to `30 days`.
- Do not implement a custom API-key model as the default skill path.

## Boundaries

- Use API endpoints for integrations, machine clients, or explicit API interactions.
- Do not treat ordinary Inertia page flows as hidden JSON mini-APIs.
