# Routing

## Defaults

- Import `router` from `@adonisjs/core/services/router`.
- Default to controller routes via `#generated/controllers`.
- Use `router.on().render(...)` or `router.on().renderInertia(...)` only for static pages with no controller logic.
- Put static routes before dynamic routes.
- Name every closure route with `.as(...)`.
- Use route matchers for typed params when they clarify intent, especially `number()` and `uuid()`.

## Stable Route File Order

1. Public static pages.
2. Guest-only auth routes.
3. Authenticated web routes.
4. API routes.
5. Fallback or special-case routes last.

## `router.resource` Versus Explicit Routes

- Use `router.resource('posts', controllers.PostsController)` only when one controller owns standard CRUD.
- Add `.apiOnly()` when `create` and `edit` pages do not exist.
- Use explicit routes for:
  - custom actions like `publish`, `archive`, `impersonate`, `export`
  - mixed middleware or policy shape
  - multi-step workflows
  - nested routes that are not plain child CRUD

## Canonical Route Shapes

```ts
import router from '@adonisjs/core/services/router'
import { controllers } from '#generated/controllers'
import { middleware } from '#start/kernel'

router
  .group(() => {
    router.get('login', [controllers.SessionController, 'create'])
    router.post('login', [controllers.SessionController, 'store'])
  })
  .use(middleware.guest())

router
  .group(() => {
    router.post('logout', [controllers.SessionController, 'destroy'])
    router.resource('posts', controllers.PostsController)
    router.post('posts/:id/publish', [controllers.PostPublishController, 'store']).as('posts.publish')
  })
  .use(middleware.auth())
```

## URL Generation Rules

- Redirects: use `response.redirect().toRoute(...)`.
- TypeScript outside HTTP responses: use `urlFor(...)`.
- Edge and tests: use the route helper already exposed by the repo.
- Inertia: use `Link` and `Form` route props from `@adonisjs/inertia/*`.
- NEVER hardcode route strings in redirects, templates, mails, or tests when a helper exists.
