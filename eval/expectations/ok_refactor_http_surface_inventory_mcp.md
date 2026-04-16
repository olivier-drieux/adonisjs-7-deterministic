# ok_refactor_http_surface_inventory_mcp

1. The response contains the compliance marker `selected-profile: mixed`.
2. The response contains the compliance marker `override-status: none`.
3. The response contains the compliance marker `hard-blocker-compliance: pass`.
4. The response does NOT trigger an override question.
5. Before proposing any file split, the response runs the HTTP surface inventory required by `hb.http-surface-inventory`: it reads `start/routes.ts` (plus its transitive imports and `adonisrc.ts` preloads), enumerates every mounted route, and explicitly scans for atypical declarations (`router.on`, `router.any`, `router.route`, closure handlers, healthchecks, `/mcp`).
6. The response emits a written surface table (path, verb, handler, caller, surface) covering every route — including the Inertia pages, `/api/...`, `/api/external/...`, `/webhooks/stripe`, `POST /mcp`, `GET /health/live`, and `GET /health/ready` — before introducing any new files.
7. Every route is classified by ROLE (caller and purpose), not by URL prefix. The response states this explicitly.
8. The response identifies `POST /mcp`, `GET /health/live`, and `GET /health/ready` as belonging to the `runtime` surface — not `api.internal`, not `api.external`, and not a new "infra" alias.
9. The final split produces five files — `start/routes.ts` for `web`, `start/routes/api_internal.ts`, `start/routes/api_external.ts`, `start/routes/webhooks.ts`, and `start/routes/runtime.ts` — and each file holds exactly one surface.
10. `start/routes/runtime.ts` keeps the `/mcp` bearer-token middleware and the `/health/*` probes together with no session middleware, no CSRF, and no `api` guard (purpose-specific middleware chain).
11. The response registers every new file in the `adonisrc.ts` `preloads` array and uses `node ace make:preload routes/<surface> --environments=web` as the scaffold command.
12. The response explicitly rejects folding `/mcp` into `start/routes/api_internal.ts` or `api_external.ts`, and rejects classifying `/mcp` by URL prefix alone.
13. The response cites `hb.http-surface-inventory` (and, where relevant, `hb.web-api-controller-separation` / `ed.routing-and-kernel`) when justifying the split.
