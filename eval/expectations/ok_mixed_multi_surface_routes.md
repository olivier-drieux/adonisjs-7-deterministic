# ok_mixed_multi_surface_routes

1. The response contains the compliance marker `selected-profile: mixed`.
2. The response contains the compliance marker `override-status: none`.
3. The response contains the compliance marker `hard-blocker-compliance: pass`.
4. The response does NOT trigger an override question.
5. The response splits the route declarations into four separate files — `start/routes.ts` for the `web` surface, `start/routes/api_internal.ts`, `start/routes/api_external.ts`, and `start/routes/webhooks.ts` — and explicitly rejects a single `start/routes.ts` stacking every surface.
6. The response registers each additional surface file in the `adonisrc.ts` `preloads` array and mentions that AdonisJS does not auto-import files under `start/`.
7. The response uses `node ace make:preload routes/<surface> --environments=web` as the scaffold command for the additional surface files.
8. The response keeps each surface file scoped to exactly one surface — no file mixes `api.internal` with `api.external`, and no file folds webhook routes into an API file.
9. The response cites `ed.routing-and-kernel` (or references the multi-surface route files doctrine) when justifying the split.
