# Authentication

## Defaults

- Use `@adonisjs/auth` only.
- For server-rendered applications, default to the session guard.
- For third-party API clients or mobile clients, use access tokens.
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

## Route Protection

- Protect authenticated flows with `middleware.auth()`.
- Protect login and signup pages with `middleware.guest()`.
- Group routes by auth state instead of repeating middleware on every line.

## Canonical Session Flow

1. Guest `create` action renders the login page.
2. Guest `store` action validates credentials.
3. Use `User.verifyCredentials(...)`.
4. Call `auth.use('web').login(user, rememberMe?)`.
5. Redirect using `toRoute(...)`.
6. Authenticated `destroy` action calls `auth.use('web').logout()`.

## Canonical API Token Flow

1. Validate credentials.
2. Verify credentials on the user model.
3. Call `auth.use('api').createToken(user, abilities?, options?)`.
4. Return the token value once.

## Boundaries

- Keep login and logout orchestration in a dedicated session or auth controller.
- Keep registration, reset, verification, and other account workflows in their own controllers and services.
