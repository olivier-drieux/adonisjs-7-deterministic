# Interaction Examples

These few-shot examples show how the doctrine behaves in practice. Use them to calibrate agent behavior.

## Example 1 — Clean Web Feature (no conflict)

**User prompt**: Build a posts feature with CRUD, Mantine UI, session auth, and functional tests.

**Expected behavior**:
1. Select profile `web`.
2. No hard blocker conflict — proceed.
3. Follow canonical build order: migration → model → validator → policy → service → transformer → controller → routes → tests → pages.
4. Use `@adonisjs/inertia/react` Form with `routeParams`, Mantine components, VineJS `vine.create(...)` validators invoked with `request.validateUsing(...)`, redirect + flash.
5. Reference controllers through `#generated/controllers` as `controllers.Posts`; type pages with `InertiaProps<{ posts: Data.Post[] }>`.
6. Final markers:
   - `selected-profile: web`
   - `override-status: none`
   - `hard-blocker-compliance: pass`

---

## Example 2 — Hard Blocker Violation (Prisma)

**User prompt**: I want to use Prisma for the database layer in my AdonisJS app.

**Expected behavior**:
1. Select profile based on context (default: `web`).
2. Detect conflict with `hb.data-stack` — Prisma replaces Lucid.
3. Stop and ask: "This conflicts with `hb.data-stack` which requires Lucid for SQL persistence. Do you want a one-off override for this task?"
4. Wait for user response before proceeding.
5. If approved: implement with Prisma but note the override.
6. If not approved: implement with Lucid.
7. Final markers include `override-status: requested` or `override-status: approved`.

---

## Example 3 — Hard Blocker Violation (raw fetch)

**User prompt**: Add a search feature that calls the API with fetch() when the user types.

**Expected behavior**:
1. Select profile (likely `mixed` — both pages and API).
2. Detect conflict with `hb.no-client-fetch-stack` — raw `fetch` is forbidden.
3. Stop and ask: "This conflicts with `hb.no-client-fetch-stack`. The doctrine uses Tuyau for client-side fetching. Do you want a one-off override?"
4. If not overridden: implement with Tuyau + optionally TanStack Query.

---

## Example 4 — Mixed App Controller Separation (4 surfaces)

**User prompt**: Add a `/api/posts` JSON endpoint to the existing web app. I'll reuse the existing PostsController.

**Expected behavior**:
1. Select profile `mixed`.
2. Clarify the target surface: is the caller the app's own browser (`api.internal`), an external client or mobile app (`api.external`), or a third-party webhook? Do not silently pick one.
3. Detect conflict with `hb.web-api-controller-separation` — a single controller cannot straddle two of the four surfaces (`web`, `api.internal`, `api.external`, `webhooks`).
4. Stop and ask: "This conflicts with `hb.web-api-controller-separation`. Mixed apps keep one controller per surface. Do you want a one-off override, or should I add a dedicated controller for the intended surface?"
5. If not overridden: create a surface-scoped controller (for example `app/controllers/api/internal/posts_controller.ts` when the caller is the app's own browser) with its own route group, its own middleware chain, and the appropriate auth/CSRF policy for that surface.

---

## Example 5 — API-only Profile

**User prompt**: Build an invoices API for our mobile app with token auth.

**Expected behavior**:
1. Select profile `api-only`.
2. No conflict — access tokens for external clients align with `hb.access-tokens-external`.
3. Use `router.resource(...).apiOnly()`, access tokens, `serialize(...)` with transformers.
4. Final markers:
   - `selected-profile: api-only`
   - `override-status: none`
   - `hard-blocker-compliance: pass`

---

## Example 6 — Enforced Default (no stop, just apply)

**User prompt**: Where should I put the business logic for creating a post?

**Expected behavior**:
1. Apply `ed.service-layer` — business logic in `app/services/post_service.ts`.
2. Do NOT stop or ask — enforced defaults are applied automatically.
3. Recommend `PostService.create(payload)` with canonical verbs.

---

## Example 6b — Multi-Surface Route Files (mixed with 4 surfaces)

**User prompt**: Bootstrap the routes for a mixed app that mounts Inertia admin pages, an internal widget API, an external mobile API with access tokens, and inbound Stripe webhooks.

**Expected behavior**:
1. Select profile `mixed`.
2. Recognize that two or more of the four surfaces are mounted → `ed.routing-and-kernel` requires splitting routes into one file per surface.
3. Do NOT stop or ask — this is an enforced default, applied automatically.
4. Produce the canonical layout:
   - `start/routes.ts` — `web` surface only (Inertia page routes).
   - `start/routes/api_internal.ts` — `.prefix('/api/internal')` + `middleware.auth()` (session).
   - `start/routes/api_external.ts` — `.prefix('/api/external')` + `middleware.auth({ guards: ['api'] })`.
   - `start/routes/webhooks.ts` — `.prefix('/webhooks')` + per-provider signature middleware.
5. Scaffold the three additional files with `node ace make:preload routes/<surface> --environments=web`.
6. Register each additional surface file in the `adonisrc.ts` `preloads` array, noting that AdonisJS does not auto-import files under `start/`.
7. Never stack two surfaces in the same file.
8. Final markers:
   - `selected-profile: mixed`
   - `override-status: none`
   - `hard-blocker-compliance: pass`

---

## Example 6c — HTTP Surface Inventory Catches a Hidden `/mcp` Route

**User prompt**: Split `start/routes.ts` in my mixed app into one file per surface. I want `start/routes/api_internal.ts` and `start/routes/api_external.ts` — webhooks already live in `start/routes/webhooks.ts`.

**Expected behavior**:
1. Select profile `mixed`.
2. Recognize that `hb.http-surface-inventory` applies as a hard blocker before any routing refactor.
3. Do NOT start splitting immediately. First read `start/routes.ts` and every file it transitively imports, plus every file listed in `adonisrc.ts` `preloads`.
4. Detect atypical declarations that a URL-prefix scan would miss — `router.on(...).renderInertia(...)`, `router.any(...)`, closures, healthchecks, and crucially a hidden `router.post('/mcp', [controllers.McpServer, 'handle'])` sitting in `start/routes.ts` outside any `/api` group.
5. Produce a written surface table BEFORE writing code. Rows include every route, classified by ROLE. The `/mcp` route is marked as `runtime` surface — its caller is an MCP host subprocess, not the app's own browser.
6. Propose a **5-file layout**, not the 3-file layout the user asked for:
   - `start/routes.ts` — `web` surface only (Inertia page routes).
   - `start/routes/api_internal.ts` — internal JSON for the app's own browser.
   - `start/routes/api_external.ts` — external JSON for mobile/machine clients.
   - `start/routes/webhooks.ts` — already present.
   - `start/routes/runtime.ts` — `/mcp` + health probes + any other operator bridges.
7. Explicitly reject absorbing `/mcp` into `api_internal.ts` just because it returns JSON — MCP is `runtime`, not `api.internal`, because the caller is a local subprocess, not a same-origin browser.
8. Register the additional surface files in `adonisrc.ts` `preloads` and scaffold with `node ace make:preload routes/<surface> --environments=web`.
9. Cite `hb.http-surface-inventory` and `hb.web-api-controller-separation` in the reasoning.
10. Final markers:
    - `selected-profile: mixed`
    - `override-status: none`
    - `hard-blocker-compliance: pass`

---

## Example 7 — Documented Exception (streaming NDJSON)

**User prompt**: The API already exposes `/api/jobs/:id/progress` as an NDJSON stream. The Inertia page must render each progress event as it arrives.

**Expected behavior**:
1. Select profile `mixed`.
2. Recognize that `hb.no-client-fetch-stack` applies as a hard blocker by default, but that this scenario matches the documented streaming exception (NDJSON / SSE / ReadableStream) — Tuyau returns parsed JSON and Inertia partial reloads only ship a single page snapshot, so neither can express incremental consumption.
3. Do NOT trigger an override flow — the exception is part of the doctrine.
4. Implement the call in a dedicated typed helper (for example `inertia/stream-client.ts`) with a typed API (`streamJobProgress(jobId, onEvent, signal)`), not inlined in the component.
5. Add a code comment citing `hb.no-client-fetch-stack` and the streaming exception clause.
6. Keep CRUD and list flows for the same page on Tuyau or Inertia.
7. Final markers:
   - `selected-profile: mixed`
   - `override-status: none`
   - `hard-blocker-compliance: pass`

---

## Example 8 — Documented Exception (temp-bridge file for Ace subprocess)

**User prompt**: Add an Ace command that pipes an audio Buffer through the local `ffmpeg` binary. ffmpeg only accepts a filesystem path.

**Expected behavior**:
1. Select profile based on context (for example `api-only`).
2. Recognize that `hb.no-raw-io-and-timers` applies as a hard blocker by default, but that this scenario matches the documented temp-bridge exception — Drive is about persistent application storage, not an ephemeral subprocess bridge.
3. Do NOT trigger an override flow — the exception is part of the doctrine.
4. Implement the command so the file path is built from `os.tmpdir()` with a collision-safe suffix (`randomUUID`, `cuid`, or equivalent) and the file is removed in a `finally` block.
5. Keep the raw `fs` call inside the Ace command — never call it from an HTTP controller, middleware, or Inertia page action.
6. Add a code comment citing `hb.no-raw-io-and-timers` and the temp-bridge exception clause.
7. Do NOT use `setInterval`, unbounded polling, or raw `nodemailer` for side effects.
8. Final markers:
   - `selected-profile: api-only`
   - `override-status: none`
   - `hard-blocker-compliance: pass`
