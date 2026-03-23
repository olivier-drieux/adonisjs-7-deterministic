# API Resource Patterns

## API-only CRUD

```ts
router
  .group(() => {
    router.resource('posts', controllers.ApiPostsController).apiOnly()
  })
  .prefix('/api')
  .as('api')
  .use(middleware.auth({ guards: ['api'] }))
```

```ts
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import { createPostValidator } from '#validators/post'
import PostPolicy from '#policies/post_policy'
import PostService from '#services/post_service'
import PostTransformer from '#transformers/post_transformer'

@inject()
export default class ApiPostsController {
  constructor(private posts: PostService) {}

  async store({ request, bouncer, response, serialize }: HttpContext) {
    if (await bouncer.with(PostPolicy).denies('create')) return response.forbidden()
    const payload = await request.validateUsing(createPostValidator)
    const post = await this.posts.create(payload)
    response.status(201)
    return serialize(PostTransformer.transform(post))
  }
}
```

- Use access tokens by default for external API-only applications.
- Return serialized transformer output via `serialize(...)`.
- Use `201` for create, `200` for update, `204` for delete, `403` for authorization failures, `404` for missing records, and `409` for conflicts.

## Mixed App Dedicated API Endpoint

```ts
router
  .group(() => {
    router.get('posts/search', [controllers.ApiPostSearchController, 'index']).as('posts.search')
  })
  .prefix('/api')
  .as('api')
  .use(middleware.auth())
```

```ts
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import { listPostsValidator } from '#validators/post'
import PostService from '#services/post_service'
import PostTransformer from '#transformers/post_transformer'

@inject()
export default class ApiPostSearchController {
  constructor(private posts: PostService) {}

  async index({ request, serialize }: HttpContext) {
    const query = await request.validateUsing(listPostsValidator)
    const posts = await this.posts.list(query)
    return serialize(PostTransformer.paginate(posts.all(), posts.getMeta()))
  }
}
```

- Use this pattern only when a page truly needs an API-style interaction.
- Keep the controller separate from the Inertia page controller.
- Keep list query parsing in a dedicated validator when the endpoint is not trivial.
- Return serialized transformer output via `serialize(...)`. Do not add a custom global `data` envelope.

## Client-side Fetch Exception

```tsx
// excerpt
import { useQuery } from '@tanstack/react-query'
import { api } from '~/client'

export function PostCountBadge() {
  const query = useQuery(api.posts.count.queryOptions())

  if (!query.data) return null

  return <span>{query.data.count}</span>
}
```

- Use this only when the interaction is genuinely client-driven.
- Do not replace normal page CRUD with TanStack Query.
