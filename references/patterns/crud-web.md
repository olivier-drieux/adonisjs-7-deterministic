# CRUD Web Patterns

## Standard Inertia React CRUD

Recommended order:

1. `node ace make:controller posts --resource`
2. `node ace make:validator post --resource`
3. `node ace make:service post`
4. `node ace make:policy post`
5. `node ace make:transformer post`
6. `node ace make:test posts/store --suite=functional`

```ts
// start/routes.ts
import router from '@adonisjs/core/services/router'
import { controllers } from '#generated/controllers'
import { middleware } from '#start/kernel'

router
  .group(() => {
    router.resource('posts', controllers.Posts)
  })
  .use(middleware.auth())
```

```ts
// app/controllers/posts_controller.ts
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import { createPostValidator } from '#validators/post'
import PostPolicy from '#policies/post_policy'
import PostService from '#services/post_service'
import PostTransformer from '#transformers/post_transformer'

@inject()
export default class PostsController {
  constructor(private posts: PostService) {}

  async index({ inertia }: HttpContext) {
    const posts = await this.posts.list()

    return inertia.render('posts/index', {
      posts: PostTransformer.transform(posts),
    })
  }

  async store({ request, bouncer, response, session }: HttpContext) {
    if (await bouncer.with(PostPolicy).denies('create')) return response.forbidden()
    const payload = await request.validateUsing(createPostValidator)
    const post = await this.posts.create(payload)
    session.flash('success', 'Post created')
    return response.redirect().toRoute('posts.show', { id: post.id })
  }
}
```

```tsx
// inertia/pages/posts/index.tsx
import { Form, Link } from '@adonisjs/inertia/react'
import { InertiaProps } from '~/types'
import { Data } from '@generated/data'
import { Button, Card, Group, Stack, TextInput, Title } from '@mantine/core'
import { IconEye, IconPlus } from '@tabler/icons-react'

type Props = InertiaProps<{
  posts: Data.Post[]
}>

export default function PostsIndex({ posts }: Props) {
  return (
    <Stack>
      <Group justify="space-between">
        <Title order={1}>Posts</Title>
        <Link route="posts.create">
          <Button leftSection={<IconPlus size={16} />}>New post</Button>
        </Link>
      </Group>

      {posts.map((post) => (
        <Card key={post.id} withBorder>
          <Group justify="space-between">
            <span>{post.title}</span>
            <Link route="posts.show" routeParams={{ id: post.id }}>
              <Button variant="subtle" leftSection={<IconEye size={16} />}>View</Button>
            </Link>
          </Group>
        </Card>
      ))}

      <Card withBorder>
        <Form route="posts.store">
          {({ errors }) => (
            <Stack>
              <TextInput name="title" label="Title" error={errors.title} required />
              <TextInput name="body" label="Body" error={errors.body} required />
              <Button type="submit">Create</Button>
            </Stack>
          )}
        </Form>
      </Card>
    </Stack>
  )
}
```

### Link with Dynamic Parameters

The `@adonisjs/inertia/react` `Link` component accepts a `routeParams` prop for named route parameters. Pass route parameters as a flat object:

```tsx
// excerpt
// Navigation to a resource page — use routeParams with flat key/value pairs
<Link route="posts.show" routeParams={{ id: post.id }}>View</Link>
<Link route="posts.edit" routeParams={{ id: post.id }}>Edit</Link>

// Form targeting a specific resource
<Form route="posts.update" routeParams={{ id: post.id }}>
  {({ errors }) => (/* ... */)}
</Form>
```

- The prop is **`routeParams`** — not `params`. In AdonisJS v7, `params` is not a valid prop name for `Link` or `Form`.
- `routeParams` takes a flat object matching the route parameter names: `{ id: post.id }`, never `{ routeParams: { id: post.id } }` nested, and never `{ params: { id: post.id } }`.
- Always use named routes with `route` + `routeParams` instead of hardcoded URL strings.

- Keep the authenticated shell in `inertia/layouts/app_layout.tsx`.
- Keep guest pages like login in `inertia/layouts/guest_layout.tsx`.
- Mount flash notifications once in the app shell, not in individual pages.

## Form Handling with VineJS

```ts
// excerpt
export default class PostsController {
  async update({ request, params, response, session }: HttpContext) {
    const payload = await request.validateUsing(updatePostValidator)
    await this.posts.update(params.id, payload)
    session.flash('success', 'Post updated')
    return response.redirect().toRoute('posts.show', { id: params.id })
  }
}
```

- Validate first.
- Never read raw request data after validation when a validated payload already exists.
- For normal page flows, return a redirect, not ad hoc JSON.

## Canonical Service Contract

```ts
import Post from '#models/post'

type ListPostsFilters = {
  page?: number
  perPage?: number
  q?: string
  sort?: 'created_at' | 'title'
  direction?: 'asc' | 'desc'
}

type CreatePostPayload = {
  title: string
  body: string
}

type UpdatePostPayload = Partial<CreatePostPayload>

export default class PostService {
  async list(filters?: ListPostsFilters) {
    const query = Post.query()

    if (filters?.q) query.whereILike('title', `%${filters.q}%`)

    const sort = filters?.sort === 'title' ? 'title' : 'created_at'
    const direction = filters?.direction === 'asc' ? 'asc' : 'desc'

    query.orderBy(sort, direction)

    if (filters?.page || filters?.perPage) {
      return query.paginate(filters.page ?? 1, filters.perPage ?? 20)
    }

    return query.exec()
  }

  async findOrFail(postId: number) {
    return Post.findOrFail(postId)
  }

  async create(payload: CreatePostPayload) {
    return Post.create(payload)
  }

  async update(postId: number, payload: UpdatePostPayload) {
    const post = await this.findOrFail(postId)
    post.merge(payload)
    await post.save()
    return post
  }

  async delete(post: Post) {
    await post.delete()
  }
}
```

- Default method names to `list`, `findOrFail`, `create`, `update`, and `delete`.
- Accept primitive ids by default.
- Materialize unpaginated list queries with `exec()` before returning them.
- Return models or domain results, not HTTP-shaped payloads.

## Protected Action with Bouncer

```ts
// excerpt
const post = await Post.findOrFail(params.id)

if (await bouncer.with(PostPolicy).denies('delete', post)) {
  return response.forbidden()
}

await this.posts.delete(post)
return response.redirect().toRoute('posts.index')
```

- Prefer `denies(...)` in controllers for the canonical positive flow.
- Keep the default authorization failure as `403`.

## Serialization via Transformer

```ts
import { BaseTransformer } from '@adonisjs/core/transformers'
import type Post from '#models/post'

export default class PostTransformer extends BaseTransformer<Post> {
  toObject() {
    return this.pick(this.resource, ['id', 'title', 'createdAt', 'updatedAt'])
  }
}
```

```ts
// excerpt
// API
return serialize(PostTransformer.transform(posts))

// Inertia
return inertia.render('posts/index', {
  posts: PostTransformer.transform(posts),
})
```
