# Canonical Patterns

## Standard Authenticated CRUD

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

  async store({ request, bouncer, response, serialize }: HttpContext) {
    if (await bouncer.with(PostPolicy).denies('create')) return response.forbidden()
    const payload = await request.validateUsing(createPostValidator)
    const post = await this.posts.create(payload)
    return response.created(serialize(PostTransformer.transform(post)))
  }
}
```

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

## Form Handling with VineJS

```ts
export default class PostsController {
  async update({ request, params, response }: HttpContext) {
    const payload = await request.validateUsing(updatePostValidator)
    await this.posts.update(params.id, payload)
    return response.redirect().toRoute('posts.show', { id: params.id })
  }
}
```

- Validate first.
- Never read raw request data after validation when a validated payload already exists.

## Protected Action with Bouncer

```ts
const post = await Post.findOrFail(params.id)

if (await bouncer.with(PostPolicy).denies('delete', post)) {
  return response.forbidden()
}

await this.posts.delete(post)
return response.redirect().toRoute('posts.index')
```

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
4. Redirect or return transformed data.

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
- Do not move batch logic into controllers.

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
test('stores a post', async ({ client, route }) => {
  const user = await UserFactory.create()

  await client
    .post(route('posts.store'))
    .loginAs(user)
    .json({ title: 'Hello', body: 'World' })
    .assertStatus(201)
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
