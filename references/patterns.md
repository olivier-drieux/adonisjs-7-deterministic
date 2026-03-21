# Canonical Patterns

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
router
  .group(() => {
    router.resource('posts', controllers.PostsController)
  })
  .use(middleware.auth())
```

```ts
// app/controllers/posts_controller.ts
import { inject } from '@adonisjs/core'
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
import type { InferPageProps } from '@adonisjs/inertia/types'
import { Button, Card, Group, Stack, TextInput, Title } from '@mantine/core'
import { IconPlus } from '@tabler/icons-react'
import type PostsController from '#controllers/posts_controller'

type Props = InferPageProps<PostsController, 'index'>

export default function PostsIndex({ posts }: Props) {
  return (
    <Stack>
      <Group justify="space-between">
        <Title order={1}>Posts</Title>
        <Link route="posts.create">
          <Button leftSection={<IconPlus size={16} />}>New post</Button>
        </Link>
      </Group>

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

- Keep the authenticated shell in `inertia/layouts/app_layout.tsx`.
- Keep guest pages like login in `inertia/layouts/guest_layout.tsx`.
- Mount flash notifications once in the app shell, not in individual pages.

## Web Login and Session Flow

```ts
router
  .group(() => {
    router.get('login', [controllers.SessionController, 'create'])
    router.post('login', [controllers.SessionController, 'store'])
  })
  .use(middleware.guest())

router
  .group(() => {
    router.post('logout', [controllers.SessionController, 'destroy'])
  })
  .use(middleware.auth())
```

```ts
export default class SessionController {
  async create({ inertia }: HttpContext) {
    return inertia.render('auth/login')
  }

  async store({ request, auth, response }: HttpContext) {
    const { email, password, remember } = await request.validateUsing(loginValidator)
    const user = await User.verifyCredentials(email, password)
    await auth.use('web').login(user, remember)
    return response.redirect().toRoute('dashboard')
  }

  async destroy({ auth, response }: HttpContext) {
    await auth.use('web').logout()
    return response.redirect().toRoute('login')
  }
}
```

- Keep `remember` explicit in the validator and form only when the product actually exposes a remember-me choice.
- Do not make the base session long-lived to replace remember-me behavior.

## Auth and Session Config

```ts
// config/auth.ts
import { defineConfig } from '@adonisjs/auth'
import { sessionGuard, sessionUserProvider } from '@adonisjs/auth/session'

export default defineConfig({
  default: 'web',
  guards: {
    web: sessionGuard({
      useRememberMeTokens: true,
      rememberMeTokensAge: '30 days',
      provider: sessionUserProvider({
        model: () => import('#models/user'),
      }),
    }),
  },
})
```

```ts
// config/session.ts
import app from '@adonisjs/core/services/app'
import { defineConfig } from '@adonisjs/session'

export default defineConfig({
  clearWithBrowser: true,
  cookie: {
    path: '/',
    httpOnly: true,
    secure: app.inProduction,
    sameSite: 'lax',
  },
})
```

- Keep `web` as the default guard.
- Keep `api` as the access-token guard name from the official auth scaffold.
- Keep browser-session behavior as the base default.
- Keep cookie settings conservative. The session snippet shows the relevant defaults to pin.

## Form Handling with VineJS

```ts
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
- Return models or domain results, not HTTP-shaped payloads.

## Inertia Shared Props

```ts
// app/middleware/inertia_middleware.ts
import config from '@adonisjs/core/services/config'
import type { HttpContext } from '@adonisjs/core/http'
import UserTransformer from '#transformers/user_transformer'

export default class InertiaMiddleware {
  share(ctx: HttpContext) {
    const { session, auth } = ctx as Partial<HttpContext>

    return {
      auth: ctx.inertia.always(
        auth?.user ? UserTransformer.transform(auth.user) : null
      ),
      flash: ctx.inertia.always({
        success: session?.flashMessages.get('success'),
        error: session?.flashMessages.get('error'),
      }),
      errors: ctx.inertia.always(this.getValidationErrors(ctx)),
      app: ctx.inertia.always({
        name: config.get('app.appName'),
        env: config.get('app.nodeEnv'),
      }),
    }
  }
}
```

- Share only `auth`, `flash`, `errors`, and `app`.
- Keep `app` flat and tiny: `name` and `env` only.
- Do not put page data or branding payloads into shared props.

## Inertia App Bootstrap

```tsx
// inertia/theme.ts
import { createTheme } from '@mantine/core'

export const theme = createTheme({})
```

```tsx
// inertia/app.tsx
import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import { createInertiaApp } from '@inertiajs/react'
import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { createRoot } from 'react-dom/client'
import { theme } from './theme'

createInertiaApp({
  progress: { color: '#1c7ed6' },
  resolve: (name) => import(`./pages/${name}.tsx`),
  setup({ el, App, props }) {
    createRoot(el).render(
      <MantineProvider theme={theme}>
        <Notifications />
        <App {...props} />
      </MantineProvider>
    )
  },
})
```

- Keep one theme file only.
- Keep provider order fixed: `MantineProvider`, `Notifications`, then `QueryClientProvider` only if TanStack Query is enabled.
- Keep SSR off unless the repo already uses it or the task explicitly requires it.

## Inertia Runtime Config

```ts
// config/inertia.ts
import { defineConfig } from '@adonisjs/inertia'

export default defineConfig({
  rootView: 'inertia_layout',
  ssr: {
    enabled: false,
    entrypoint: 'inertia/ssr.tsx',
  },
})
```

- Keep one fixed root view: `inertia_layout`.
- Keep `ssr.enabled` false by default.

## Shield Config for Inertia

```ts
// config/shield.ts
import { defineConfig } from '@adonisjs/shield'

export default defineConfig({
  csrf: {
    enabled: true,
    exceptRoutes: [],
    enableXsrfCookie: true,
    methods: ['POST', 'PUT', 'PATCH', 'DELETE'],
  },
})
```

- Use this for browser-facing Inertia apps.
- Do not make `enableXsrfCookie` optional in normal web or mixed profiles.

## Typed API Client

```ts
// inertia/client.ts
import { registry } from '@generated/registry'
import { createTuyau } from '@tuyau/core/client'

export const client = createTuyau({
  baseUrl: '/',
  registry,
})

export const urlFor = client.urlFor
```

- Always export `client` and `urlFor`.
- Do not add `queryClient` or `api` until TanStack Query is actually used.

## Flash Notifications with Mantine

```tsx
import { useEffect } from 'react'
import { usePage } from '@inertiajs/react'
import { notifications } from '@mantine/notifications'

export function FlashNotifications() {
  const { flash } = usePage().props as { flash?: { success?: string; error?: string } }

  useEffect(() => {
    if (flash?.success) notifications.show({ color: 'green', message: flash.success })
    if (flash?.error) notifications.show({ color: 'red', message: flash.error })
  }, [flash])

  return null
}
```

- Use notifications for ephemeral success or info feedback.
- Keep field errors and durable business errors visible in the page or form itself.

## Zustand for UI-only Shared State

```ts
import { create } from 'zustand'

type SidebarStore = {
  opened: boolean
  open: () => void
  close: () => void
}

export const useSidebarStore = create<SidebarStore>((set) => ({
  opened: false,
  open: () => set({ opened: true }),
  close: () => set({ opened: false }),
}))
```

- Keep stores in `inertia/stores`.
- Do not use Zustand for auth, server entities, or standard forms.

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
- If the query validator accepts `page` and `perPage`, return a paginator-shaped payload instead of a full list.
- Return serialized transformer output via `serialize(...)`. Do not add a custom global `data` envelope on top of Adonis resource or paginator shapes.

## Client-side Fetch Exception

```tsx
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

## TanStack Query Bootstrap Exception

```ts
// inertia/client.ts
import { QueryClient } from '@tanstack/react-query'
import { createTuyauReactQueryClient } from '@tuyau/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
})

export const api = createTuyauReactQueryClient({ client })
```

```tsx
// inertia/app.tsx
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '~/client'

<MantineProvider theme={theme}>
  <Notifications />
  <QueryClientProvider client={queryClient}>
    <App {...props} />
  </QueryClientProvider>
</MantineProvider>
```

- Add this only when a real TanStack Query use case exists.
- Do not mount `QueryClientProvider` in the default bootstrap.

## Protected Action with Bouncer

```ts
const post = await Post.findOrFail(params.id)

if (await bouncer.with(PostPolicy).denies('delete', post)) {
  return response.forbidden()
}

await this.posts.delete(post)
return response.redirect().toRoute('posts.index')
```

- Prefer `denies(...)` in controllers for the canonical positive flow.
- Keep the default authorization failure as `403`.

## Email Sending Workflow

```ts
// service
const user = await this.users.register(payload)
await mail.sendLater(new VerifyEmailNotification(user))
return user
```

Default flow:

1. Validate.
2. Persist.
3. Emit event or queue mail.
4. Redirect or return serialized transformer output.

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

## Access Token Provider Config

```ts
// app/models/user.ts
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'

export default class User extends BaseModel {
  static accessTokens = DbAccessTokensProvider.forModel(User, {
    expiresIn: '30 days',
  })
}
```

- Keep token expiration explicit.
- Keep `30 days` as the default expiration for external access tokens.

## Date Widgets with Mantine

```tsx
import { DatePickerInput } from '@mantine/dates'

<DatePickerInput
  name="publishedAt"
  label="Publish date"
  valueFormat="YYYY-MM-DD"
/>
```

- Use this only when a real date widget improves the UX.
- `@mantine/dates` requires `dayjs`. Keep Luxon on the server side.

## File Generation or Export Flow

```ts
// service
const key = `exports/invoices/${invoice.id}.pdf`
await drive.use().put(key, pdfBuffer)
return key

// controller
const url = await drive.use().getSignedUrl(key, { expiresIn: '30 mins' })
return { url }
```

- Generate files in a service or command.
- Store the key.
- Return a signed URL or persist export metadata.

## Recurring Task via Ace Command

```ts
export default class SyncInvoices extends BaseCommand {
  static commandName = 'invoices:sync'

  @inject()
  async run(service: InvoiceSyncService) {
    await service.run()
  }
}
```

- Commands orchestrate.
- Services do the real work.
- Recurring commands MUST be idempotent.
- Do not move batch logic into controllers.

## Advanced Tables

```tsx
import { useReactTable, getCoreRowModel } from '@tanstack/react-table'

const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
})
```

- Use TanStack Table only for genuinely advanced grid behavior.
- For ordinary read-only lists, keep Mantine or plain table markup.

## External Access Token Flow

```ts
export default class ApiTokensController {
  async store({ request, auth, response }: HttpContext) {
    const { email, password } = await request.validateUsing(issueApiTokenValidator)
    const user = await User.verifyCredentials(email, password)

    const token = await auth.use('api').createToken(user, ['*'])

    return response.created({
      token: token.value!.release(),
    })
  }
}
```

- Use this only for external clients, scripts, or machine-to-machine integrations.
- Keep the `api` guard name fixed for this flow.
- Do not route normal Inertia page traffic through bearer tokens.

## Upload or Persistent Storage via Drive

```ts
const { avatar } = await request.validateUsing(updateAvatarValidator)
const key = `avatars/${user.id}/${cuid()}.${avatar.extname}`
await avatar.moveToDisk(key)
user.avatar = key
await user.save()
```

- Store only the key in the database.
- Use `driveUrl` or `getUrl` to resolve the public URL later.

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
// API
return serialize(PostTransformer.transform(posts))

// Inertia
return inertia.render('posts/index', {
  posts: PostTransformer.transform(posts),
})
```

## Unit and Functional Tests

```ts
test('stores a post through the web flow', async ({ client, route }) => {
  const user = await UserFactory.create()

  await client
    .post(route('posts.store'))
    .loginAs(user)
    .form({ title: 'Hello', body: 'World' })
    .withCsrfToken()
    .assertRedirect()
})
```

```ts
test('lists posts through the external API', async ({ client, route }) => {
  const user = await UserFactory.create()

  await client
    .get(route('api.posts.index'))
    .withGuard('api')
    .loginAs(user)
    .assertStatus(200)
})
```

```ts
test('queues verification mail', async ({ cleanup }) => {
  const { mails } = mail.fake()
  cleanup(() => mail.restore())

  await new SessionService().register(payload)

  mails.assertSent(VerifyEmailNotification)
})
```

## Forbidden Frontend Library Patterns

- Do not use `@mantine/form`, `react-hook-form`, or `formik` for standard Inertia forms.
- Do not mirror VineJS validation with `zod`, `yup`, or similar client schemas for ordinary page flows.
- Do not use raw `fetch`, raw `axios`, `ky`, or `SWR` in page components.
- Do not add `react-router-dom` on top of Inertia.
