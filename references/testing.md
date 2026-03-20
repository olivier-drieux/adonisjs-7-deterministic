# Testing

## Defaults

- Generate tests with `node ace make:test <path> --suite=functional|unit`.
- Keep request flows in `tests/functional`.
- Keep isolated logic in `tests/unit`.

## Feature Coverage Baseline

For every non-trivial HTTP feature, cover:

1. Happy path.
2. Validation failure.
3. Authentication failure.
4. Authorization failure.
5. Not found or conflict path when applicable.
6. Side effect assertion.

## HTTP Test Rules

- Use route helpers instead of hardcoded URLs.
- Use `loginAs(...)` for session-protected requests on the default `web` guard.
- For access-token routes, use `withGuard('api').loginAs(user)` when the repo keeps the default `api` guard name.
- For browser-facing Inertia apps, assume Shield CSRF protection with `enableXsrfCookie: true` is enabled.
- For mutating browser requests protected by Shield, configure the relevant test plugins and call `withCsrfToken()`.
- Inertia form submissions assert redirects and session or flash behavior.
- When a login flow exposes remember-me, cover both cases: without remember-me and with remember-me.
- When a page relies on shared props, treat `auth`, `flash`, `errors`, and `app { name, env }` as the only expected global props.
- JSON API endpoints assert payload shape, pagination shape, and guard behavior.

## Unit Test Rules

- Unit test services, policies, transformers, commands, and listeners when logic is non-trivial.
- Use `container.swap(...)` and restore methods for injected dependency fakes when needed.
- Add browser tests only for high-value end-to-end Inertia flows. Keep most behavior in functional and unit suites.
- If auth config is customized, unit test that `web` stays the default guard and remember-me support remains enabled with `30 days`.
- If Zustand stores contain non-trivial UI logic, unit test the store directly.
- If client-side fetching is introduced with TanStack Query, test the query wrapper or adapter module, not raw HTTP calls inside components.
- If TanStack Query is enabled, unit test the `inertia/client.ts` query defaults: `retry: 1`, `refetchOnWindowFocus: false`, and `staleTime: 30_000`.
- If access tokens are used, unit test that the user token provider keeps an explicit `expiresIn: '30 days'`.

## Fakes

- Mail: `mail.fake()`
- Drive: `drive.fake()`
- Events: `emitter.fake()`
- Hash: `hash.fake()`

## Canonical Test Paths

- `tests/functional/posts/store.spec.ts`
- `tests/functional/posts/update.spec.ts`
- `tests/functional/api/posts/index.spec.ts`
- `tests/functional/api/posts/store.spec.ts`
- `tests/unit/services/post_service.spec.ts`
- `tests/unit/policies/post_policy.spec.ts`
- `tests/unit/transformers/post_transformer.spec.ts`
