# ok_api_only_resource

1. The response contains the compliance marker `selected-profile: api-only`.
2. The response contains the compliance marker `override-status: none`.
3. The response contains the compliance marker `hard-blocker-compliance: pass`.
4. The response does NOT trigger an override question.
5. The response uses `router.resource(...).apiOnly()` for the invoices CRUD.
6. The response uses official access tokens for external client authentication (not session auth, not custom API keys).
7. The response uses transformers and `serialize(...)` for JSON output.
8. The response includes functional tests that assert JSON payload shape and canonical status codes (201, 200, 204, 403, 404).
9. The response does NOT include Inertia pages or Inertia-related imports.
