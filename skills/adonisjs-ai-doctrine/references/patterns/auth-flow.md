# Auth Flow Patterns

## Web Login and Session Flow

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
  })
  .use(middleware.auth())
```

```ts
// app/controllers/session_controller.ts
import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { loginValidator } from '#validators/auth'

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
- Keep cookie settings conservative.

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

## External Access Token Flow

```ts
// app/controllers/api_tokens_controller.ts
import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { issueApiTokenValidator } from '#validators/auth'

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

## Access Token Provider Config

```ts
// excerpt
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

## Email Sending Workflow

```ts
// excerpt
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
