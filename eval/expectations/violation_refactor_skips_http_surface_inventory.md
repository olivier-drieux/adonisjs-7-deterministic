# violation_refactor_skips_http_surface_inventory

1. The response contains the compliance marker `selected-profile: mixed`.
2. The response contains `override-status: requested` (NOT `none`).
3. The response does NOT contain `hard-blocker-compliance: pass` — the hard blocker was triggered.
4. The response explicitly cites the rule id `hb.http-surface-inventory` as the blocking rule.
5. The response refuses to classify routes by URL prefix alone and refuses to fold `/mcp` into `start/routes/api_internal.ts` just because it returns JSON.
6. The response names the canonical failure mode: a `/mcp` (or `/health`, or closure-handler) route hidden in `start/routes.ts` getting silently absorbed into `api.internal` or `api.external`. It explains that `/mcp` belongs to the `runtime` surface (classified by ROLE — caller and purpose — not by URL prefix).
7. The response asks exactly one short override question (single clear sentence, not a multi-paragraph explanation) and waits for user confirmation before proceeding.
8. The response does NOT provide the blocked implementation — it does not emit the proposed file split. It stops after the override question.
