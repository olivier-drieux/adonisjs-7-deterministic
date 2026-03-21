# Validation

## Defaults

- Use VineJS only.
- Generate validators by resource with `node ace make:validator <resource>`.
- For CRUD, prefer `node ace make:validator <resource> --resource`.
- For `node ace make:validator post --resource`, keep the generated `app/validators/post.ts` file and import validators from `#validators/post`.
- Keep one validator file per resource or workflow and one compiled validator per action.
- Prefer `vine.compile(vine.object(...))`.
- In controller code, use `await request.validateUsing(...)`.
- Do not use `request.all()` or `request.only()` as feature-level validation shortcuts.

## Style Rules

- Prefer small explicit schemas over abstract inheritance.
- Validate body, query, params, and files in the same action validator when the action depends on them.
- Export validators with action-first names like `createPostValidator`, `updatePostValidator`, `listPostsValidator`, `loginValidator`, `uploadAvatarValidator`.

## Canonical CRUD Validator

```ts
import vine from '@vinejs/vine'

export const createPostValidator = vine.compile(
  vine.object({
    title: vine.string().trim().minLength(3).maxLength(255),
    body: vine.string().trim(),
  })
)

export const updatePostValidator = vine.compile(
  vine.object({
    title: vine.string().trim().minLength(3).maxLength(255),
    body: vine.string().trim(),
  })
)
```

## Canonical List Query Validator

```ts
import vine from '@vinejs/vine'

export const listPostsValidator = vine.compile(
  vine.object({
    page: vine.number().withoutDecimals().positive().optional(),
    perPage: vine.number().withoutDecimals().range([1, 100]).optional(),
    q: vine.string().trim().optional(),
    sort: vine.enum(['created_at', 'title'] as const).optional(),
    direction: vine.enum(['asc', 'desc'] as const).optional(),
  })
)
```

- Keep list query validation in the same resource validator file when the endpoint belongs to that resource.
- Validate `page`, `perPage`, `q`, `sort`, `direction`, and business filters here instead of parsing them ad hoc in the controller.

## Canonical File Validator

```ts
import vine from '@vinejs/vine'

export const updateAvatarValidator = vine.compile(
  vine.object({
    avatar: vine.file({
      size: '2mb',
      extnames: ['jpg', 'jpeg', 'png', 'webp'],
    }),
  })
)
```

## Custom Messages and Reporters

- If the repo needs shared Vine behavior, create `start/validator.ts` with `node ace make:preload validator`.
- Configure messages and reporters there, not ad hoc in controllers.
