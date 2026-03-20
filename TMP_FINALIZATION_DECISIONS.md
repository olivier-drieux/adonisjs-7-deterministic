# Remaining Decisions To Finalize The Skill

Temporary working note. This file exists to capture the remaining choices that still leave room for agent divergence.

## Highest Impact

### 1. HTTP response contract

Current state:
- Web flows are fixed to redirect + flash.
- API flows use transformers and the official paginator shape.
- The skill does not yet fully lock success payloads, domain error payloads, or exact status code mapping.

Decisions to take:
- Exact JSON success shape for create/update/delete actions.
- Exact JSON error shape for domain errors outside validation.
- Canonical status codes for:
  - create
  - update
  - delete
  - forbidden
  - conflict
  - not found
- Whether API controllers MUST always use `serialize(...)` when returning transformed payloads.

Recommended defaults:
- `201` for create with transformed resource.
- `200` for update with transformed resource.
- `204` for delete when no response body is needed.
- `403` for authorization failure.
- `404` for missing resources.
- `409` for domain conflicts.
- Validation stays on Adonis/Vine default handling.
- API success payloads return the transformed resource directly, without a global `data` envelope.
- API errors use a small stable shape for domain exceptions only, for example: `{ code, message }`.

### 2. Pagination, sorting, and filters

Current state:
- The skill mentions paginator serialization.
- Query naming and list endpoint behavior are not yet fully frozen.

Decisions to take:
- Default query param names for:
  - page
  - perPage
  - q
  - sort
  - direction
- Default `perPage`.
- Maximum `perPage`.
- Whether sorting MUST always be whitelisted in the service layer.
- Whether filters belong in validators for API list endpoints.

Recommended defaults:
- `page`, `perPage`, `q`, `sort`, `direction`.
- `perPage` default `20`.
- `perPage` max `100`.
- Sorting whitelist required.
- Filter/query validation required for any non-trivial list endpoint.

### 3. Authorization behavior

Current state:
- Bouncer and policies are mandatory.
- The skill does not yet fully define how policy failures should surface in mixed read flows.

Decisions to take:
- Whether authorization failures MUST always return `403`, or whether some reads may intentionally return `404`.
- Whether controller code should prefer:
  - explicit `bouncer.with(...).denies(...)`
  - or `bouncer.with(...).authorize(...)` plus exception flow
- Default naming for policy abilities on CRUD and custom actions.

Recommended defaults:
- Default to `403`; only use `404` hiding when the repo already uses that pattern or the task explicitly requires resource concealment.
- Prefer explicit `denies(...)` checks in controller examples for readability.
- Policy ability names:
  - `viewList`
  - `view`
  - `create`
  - `update`
  - `delete`
  - verb-first custom abilities like `publish`, `archive`, `export`.

## Medium Impact

### 4. Exception doctrine

Current state:
- Named exceptions exist in the skill.
- Mapping from domain exception classes to HTTP behavior is still under-specified.

Decisions to take:
- Which exception classes the skill should standardize, if any.
- Whether controllers should catch domain exceptions directly or rely on exception handlers.
- How domain exceptions map to:
  - flash redirects in web flows
  - JSON responses in API flows

Recommended defaults:
- Keep named exceptions in `app/exceptions`.
- Use the global exception layer for repeatable HTTP mapping.
- Web flows:
  - validation errors stay in the form flow
  - domain exceptions redirect back with `flash.error`
- API flows:
  - domain exceptions return stable JSON error payloads
  - no ad hoc controller `try/catch` unless the task explicitly needs local translation.

### 5. Service contract conventions

Current state:
- Services are mandatory for non-trivial workflows.
- Method naming and read/write shape are not yet fully fixed.

Decisions to take:
- Canonical method names for list/read/write operations.
- Whether services should accept primitive ids or hydrated models by default.
- Whether service methods should return models or transformed plain objects.

Recommended defaults:
- Service method names:
  - `list`
  - `findOrFail`
  - `create`
  - `update`
  - `delete`
  - custom verb-first workflow methods
- Accept primitive ids at service boundaries unless a prior step already loaded the model for policy checks.
- Services return models or domain results; controllers remain responsible for HTTP transformation.

### 6. Inertia page and layout conventions

Current state:
- Inertia bootstrap and shared props are fixed.
- Page layout conventions are still light.

Decisions to take:
- Whether every authenticated page should use one canonical app layout component.
- Page file naming style:
  - all lowercase path segments
  - or PascalCase component files
- Whether common flash/error plumbing should live in one global app shell.

Recommended defaults:
- One canonical authenticated app layout plus one guest layout.
- Keep route-like page paths in lowercase directories.
- Keep the exported React component name in PascalCase.
- Mount flash notification plumbing once in the app shell.

## Lower Impact But Useful

### 7. File and Drive conventions

Current state:
- Drive is mandatory.
- Key naming and visibility choices are not fully standardized.

Decisions to take:
- Default disk name.
- Private vs public by default.
- Canonical key pattern by feature type.
- Signed URL expiry defaults.

Recommended defaults:
- Private by default.
- Store keys, never raw public URLs.
- Signed URLs for private access.
- Feature-based key prefixes like:
  - `avatars/{userId}/{fileId}.{ext}`
  - `exports/{resource}/{id}.{ext}`
- Signed URL default expiry: `30 mins`.

### 8. Events and listeners

Current state:
- Events/listeners are supported.
- The threshold between direct service side effect and listener is still somewhat interpretive.

Decisions to take:
- When a side effect stays inline in the service.
- When it must become an event + listener.
- Whether listener side effects should be fire-and-forget by default.

Recommended defaults:
- Keep the primary write flow in the service.
- Use listeners for secondary effects only:
  - email
  - notifications
  - analytics
  - external sync
- Do not move required same-transaction logic into listeners.

### 9. Command doctrine

Current state:
- Command naming is fixed.
- Scheduling and idempotency expectations are still not fully frozen.

Decisions to take:
- Whether recurring commands must be idempotent.
- Whether commands may call services directly or need a dedicated command service.

Recommended defaults:
- Commands orchestrate only.
- Commands call existing services directly.
- Recurring commands must be idempotent.

## Proposed Order

1. HTTP response contract.
2. Pagination, sorting, and filters.
3. Authorization behavior.
4. Exception doctrine.
5. Service contract conventions.
6. Inertia page and layout conventions.
7. File and Drive conventions.
8. Events and listeners threshold.
9. Command doctrine.

## Finish Line

The skill will feel close to decision-complete once these five areas are fully fixed:
- HTTP response contract
- Pagination and list query conventions
- Authorization failure behavior
- Exception mapping
- Service method contract
