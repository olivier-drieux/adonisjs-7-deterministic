# ok_transformer_variants

1. The response contains the compliance marker `selected-profile: mixed`.
2. The response contains the compliance marker `override-status: none`.
3. The response contains the compliance marker `hard-blocker-compliance: pass`.
4. The response does NOT trigger an override question.
5. The response defines a `PostTransformer` with at least two variants (list and detailed).
6. The response references `@generated/data` and `Data.Post.Variants` for consuming the typed variant output.
7. The response uses `serialize(PostTransformer.transform(...))` in the API controller — it does NOT return raw Lucid models.
8. The response uses `PostTransformer.transform(...)` (without serialize) in the Inertia controller for page props.
9. The response does NOT wrap `serialize()` output in a second custom `{ data: ... }` envelope via `response.ok({ data: ... })`.
