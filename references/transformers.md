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
- Do not add a global `data` envelope around transformer output. Return the serialized output directly.
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
