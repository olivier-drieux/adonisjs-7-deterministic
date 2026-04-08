# Validation

## Defaults

- Use VineJS only.
- Generate validators by resource with `node ace make:validator <resource>`.
- For CRUD, prefer `node ace make:validator <resource> --resource`.
- For `node ace make:validator post --resource`, keep the generated `app/validators/post.ts` file and import validators from `#validators/post`.
- Keep one validator file per resource or workflow and one compiled validator per action.
- Use `vine.create({...})` as the canonical root schema (new in AdonisJS v7 VineJS).
- Do not wrap the root schema in `vine.compile(vine.object(...))`; that pattern is obsolete at the top level. `vine.object(...)` is still valid for nested schemas (filters, params, etc.).
- In controller code, use `await request.validateUsing(...)`.
- Do not use `request.all()` or `request.only()` as feature-level validation shortcuts.

## Style Rules

- Prefer small explicit schemas over abstract inheritance.
- Validate body, query, params, and files in the same action validator when the action depends on them.
- Export validators with action-first names like `createPostValidator`, `updatePostValidator`, `listPostsValidator`, `loginValidator`, `uploadAvatarValidator`.

## Canonical CRUD Validator

```ts
import vine from '@vinejs/vine'

export const createPostValidator = vine.create({
  title: vine.string().trim().minLength(3).maxLength(255),
  body: vine.string().trim(),
})

export const updatePostValidator = vine.create({
  title: vine.string().trim().minLength(3).maxLength(255),
  body: vine.string().trim(),
})
```

## Canonical List Query Validator

```ts
import vine from '@vinejs/vine'

export const listPostsValidator = vine.create({
  page: vine.number().withoutDecimals().positive().optional(),
  perPage: vine.number().withoutDecimals().range([1, 100]).optional(),
  q: vine.string().trim().optional(),
  sort: vine.enum(['created_at', 'title'] as const).optional(),
  direction: vine.enum(['asc', 'desc'] as const).optional(),
})
```

- Keep list query validation in the same resource validator file when the endpoint belongs to that resource.
- Validate `page`, `perPage`, `q`, `sort`, `direction`, and business filters here instead of parsing them ad hoc in the controller.

## Canonical File Validator

```ts
import vine from '@vinejs/vine'

export const updateAvatarValidator = vine.create({
  avatar: vine.file({
    size: '2mb',
    extnames: ['jpg', 'jpeg', 'png', 'webp'],
  }),
})
```

## Multi-Source Validation

`vine.create` accepts arbitrary sections (body, query, params, headers, cookies). Use nested `vine.object(...)` for these subtrees when the same action must validate several request parts.

```ts
import vine from '@vinejs/vine'

export const showUserValidator = vine.create({
  username: vine.string(),
  params: vine.object({
    id: vine.number(),
  }),
  headers: vine.object({
    'x-api-key': vine.string(),
  }),
})
```

## Custom Messages and Reporters

- If the repo needs shared Vine behavior, create `start/validator.ts` with `node ace make:preload validator`.
- Configure messages and reporters there, not ad hoc in controllers.
