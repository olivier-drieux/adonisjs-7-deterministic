# Transformers

## Purpose

Transformers serialize domain models into client-safe payloads. They are the single boundary between internal model shape and external contract, for both Inertia page props and API JSON responses.

## Convention

- One transformer per resource.
- Transformers live in `app/transformers/`.
- Generate with `node ace make:transformer <name>`.
- Extend `BaseTransformer<T>` from `@adonisjs/core/transformers`.
- Implement `toObject()` with explicit field selection via `this.pick(...)`.
- Export a default class in PascalCase: `PostTransformer`, `UserTransformer`.

## Static Methods

- `transform(model)` — single model to object.
- `transform(models)` — array of models to array of objects.
- `paginate(models, meta)` — array + paginator meta to paginated payload.

## Usage

```ts
// API controller — set status then return serialized output
response.status(201)
return serialize(PostTransformer.transform(post))
```

```ts
// excerpt
// Inertia controller — pass transformed data as props
return inertia.render('posts/index', {
  posts: PostTransformer.transform(posts),
})
```

## Rules

- Do not return raw Lucid models to HTTP responses. Always transform.
- Use the framework `serialize(...)` helper in API controllers. The helper produces the canonical v7 envelope: single resources become `{ data: { ... } }`, paginated lists become `{ data: [ ... ], meta: { ... } }`. This envelope **is** the Adonis serializer output; it is correct, expected, and must not be wrapped in an additional custom envelope.
- Do not add a second custom wrapper (e.g. `response.ok({ data: serialize(...) })`). The serializer already provides `data`.
- Do not add a global `error` envelope. Use flat `{ code, message }` for API errors.
- Use `this.pick(this.resource, [...fields])` for explicit field selection.
- Keep transformation logic simple: field selection, renaming, computed fields. No I/O or business logic.

## Example

```ts
import { BaseTransformer } from '@adonisjs/core/transformers'
import type Post from '#models/post'

export default class PostTransformer extends BaseTransformer<Post> {
  toObject() {
    return this.pick(this.resource, ['id', 'title', 'slug', 'createdAt', 'updatedAt'])
  }
}
```

## Generated Type Surface

Once `indexEntities({ transformers: { enabled: true, withSharedProps: true } })` is configured in `adonisrc.ts` (see [setup.md](setup.md)), every transformer is mirrored into a generated `Data` namespace:

```ts
// consumed by page components and API consumers
import { Data } from '@generated/data'

type PostShape = Data.Post
type PostDetailed = Data.Post.Variants['forDetailedView']
```

- `Data.<Resource>` resolves to the default shape produced by `toObject()`.
- `Data.<Resource>.Variants['<variantName>']` resolves to any additional variants you expose through the transformer. Variants are the v7 way to publish multiple shapes for the same resource (list vs. detail, admin vs. public) without duplicating transformers.

At the type level, the primitives are `InferData<Transformer>` and `InferVariants<Transformer>` from `@adonisjs/core/types/transformers`. Prefer `@generated/data` in application code; use the primitives only when writing generators or custom type helpers.
