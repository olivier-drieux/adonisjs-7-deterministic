# Routing

## Defaults

- Import `router` from `@adonisjs/core/services/router`.
- Default to controller routes via the generated barrel: `import { controllers } from '#generated/controllers'`.
- Reference controllers by their **PascalCase resource name** (the v7 barrel convention), e.g. `controllers.Posts`, `controllers.Session`, `controllers.ApiPosts`. Do not use the full class-name suffix (`controllers.PostsController`) — that is not how the v7 barrel exposes entries.
- The dev server must be running so the assembler can keep `#generated/controllers` in sync when you add or rename a controller file.
- Use `router.on().renderInertia(...)` only for truly static pages with no controller logic.
- Put static routes before dynamic routes.
- Name every closure route with `.as(...)`.
- Use route matchers for typed params when they clarify intent, especially `number()` and `uuid()`.
- In mixed apps, keep web and `/api` routes in separate groups and use separate controllers.

## Stable Route File Order

1. Public static pages.
2. Guest-only auth routes.
3. Authenticated web routes.
4. API routes under `/api`.
5. Fallback or special-case routes last.

## `router.resource` Versus Explicit Routes

- Use `router.resource('posts', controllers.Posts)` only when one web controller owns standard CRUD pages and actions.
- Use `router.resource('posts', controllers.ApiPosts).apiOnly()` only for pure API CRUD.
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
    router.get('login', [controllers.Session, 'create'])
    router.post('login', [controllers.Session, 'store'])
  })
  .use(middleware.guest())

router
  .group(() => {
    router.post('logout', [controllers.Session, 'destroy'])
    router.resource('posts', controllers.Posts)
    router.post('posts/:id/publish', [controllers.PostPublish, 'store']).as('posts.publish')
  })
  .use(middleware.auth())

router
  .group(() => {
    router.resource('posts', controllers.ApiPosts).apiOnly()
    router.get('posts/search', [controllers.ApiPostSearch, 'index']).as('posts.search')
  })
  .prefix('/api')
  .as('api')
  .use(middleware.auth())
```

## URL Generation Rules

- Redirects: use `response.redirect().toRoute(...)`.
- TypeScript outside HTTP responses: use `urlFor(...)`.
- Tests: use the route helper already exposed by the repo.
- Inertia: use `Link` and `Form` route props from `@adonisjs/inertia/*`.
- NEVER hardcode route strings in redirects, templates, mails, or tests when a helper exists.
