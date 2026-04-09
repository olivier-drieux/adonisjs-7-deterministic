# Authentication

## Defaults

- Use `@adonisjs/auth` only.
- Use `web` as the browser session guard and `api` as the external access-token guard.
- For web and mixed applications, default to the session guard and cookie auth for browser-driven flows.
- For web and mixed Inertia applications, keep Shield CSRF enabled with `enableXsrfCookie: true`.
- Keep browser sessions non-persistent by default. Clear them with the browser instead of stretching the base session cookie.
- Keep session cookie settings conservative: `httpOnly: true`, `sameSite: 'lax'`, `secure: app.inProduction`, and `path: '/'`.
- Allow remember-me only when the product explicitly exposes it. Keep `rememberMeTokensAge: '30 days'`.
- Browser clients inside the same application stay on the session guard even when calling `/api`.
- For third-party API clients, mobile clients, scripts, or machine-to-machine integrations, use official access tokens with explicit expiration.
- Keep access-token expiration at `30 days` by default.
- Do not introduce a custom API-key model as the default path.
- Prefer Lucid user providers.

## Setup

- Session guard:

```sh
node ace add @adonisjs/auth --guard=session
```

- Access tokens guard:

```sh
node ace add @adonisjs/auth --guard=access_tokens
```

- If the app does not already have sessions and the feature is session-based, add `@adonisjs/session` first.
- For a dedicated external API service, prefer the API starter kit configured for access tokens:

```sh
npm create adonisjs@latest my-api -- --kit=api --auth-guard=access_tokens
```

## Config Defaults

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

- Keep `web` as the default guard.
- Keep `api` as the access-token guard name from the official auth scaffold. Do not rename it.
- Keep `rememberMeTokensAge` at `30 days`.
- Use browser-session behavior for the base session cookie. The session snippet shows the relevant defaults to pin, not necessarily every generated field.
- Keep token expiration explicit on the user model with `expiresIn: '30 days'`.

## Route Protection

- Protect browser flows with `middleware.auth()` on the default `web` guard.
- Protect login and signup pages with `middleware.guest()`.
- Group routes by auth state instead of repeating middleware on every line.
- In mixed apps, keep web session routes and API routes in separate route groups.
- Protect external token routes with `middleware.auth({ guards: ['api'] })`.

## Canonical Session Flow

1. Guest `create` action renders the Inertia login page.
2. Guest `store` action validates credentials.
3. Use `User.verifyCredentials(...)`.
4. Call `auth.use('web').login(user, rememberMe?)`.
5. Pass `rememberMe` only when the product explicitly exposes a remember-me field.
6. Keep remember-me persistence at `30 days`.
7. Redirect using `toRoute(...)`.
8. Authenticated `destroy` action calls `auth.use('web').logout()`.

## Canonical API Token Flow

1. Validate credentials.
2. Verify credentials on the user model.
3. Keep the `api` guard for external clients only.
4. Configure token expiration on the user model with `expiresIn: '30 days'`.
5. Call `auth.use('api').createToken(user, abilities?, options?)`.
6. Return the token value once.
7. Use this flow only for external or integration clients, not as the default for Inertia page traffic.

## Boundaries

- Keep login and logout orchestration in a dedicated session or auth controller.
- Keep registration, reset, verification, and other account workflows in their own controllers and services.
- Do not mix browser session auth and token issuance inside one generic controller with unclear intent.
- Do not simulate remember-me by making the base session cookie long-lived.
