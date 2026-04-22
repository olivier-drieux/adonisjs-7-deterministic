# Testing

## Defaults

- Generate tests with `node ace make:test <path> --suite=functional|unit`.
- Keep request flows in `tests/functional`.
- Keep isolated logic in `tests/unit`.
- Keep end-to-end browser flows in `tests/browser`, only for high-value scenarios.

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
- When a page relies on shared props, treat `user`, `flash`, `errors`, and `app { name, env }` as the only expected global props. The key is `user`, not `auth` — asserting `props.auth` is a v6-era mistake.
- JSON API endpoints assert payload shape (including the native `{ data }` / `{ data, meta }` envelope produced by `serialize(...)`), pagination shape, canonical status codes, and guard behavior.
- For non-trivial list endpoints, cover query validation for `page`, `perPage`, `q`, `sort`, and `direction`.

## Unit Test Rules

- Unit test services, policies, transformers, commands, and listeners when logic is non-trivial.
- Use `container.swap(...)` and restore methods for injected dependency fakes when needed.
- If auth config is customized, unit test that `web` stays the default guard and remember-me support remains enabled with `30 days`.
- If exception mapping is customized, unit test that API domain errors keep the flat `{ code, message }` shape and web domain errors redirect back with `flash.error`.
- If Zustand stores contain non-trivial UI logic, unit test the store directly.
- If client-side fetching is introduced with TanStack Query, test the query wrapper or adapter module, not raw HTTP calls inside components.
- If TanStack Query is enabled, unit test the `inertia/client.ts` query defaults: `retry: 1`, `refetchOnWindowFocus: false`, and `staleTime: 30_000`.
- If access tokens are used, unit test that the user token provider keeps an explicit `expiresIn: '30 days'`.

## Policy Unit Tests

Policies are the authorization boundary and deserve direct unit coverage, not just end-to-end assertions through controllers.

- Instantiate the policy with `container.make(PostPolicy)` to keep container-injected dependencies honest.
- Assert the positive and negative branches for every ability the policy exposes: `allows('create')`, `denies('update', post)`, etc.
- Cover the owner vs non-owner split when the resource has a `userId` or equivalent field.
- Cover the role vs role-less split when the policy branches on role.
- When a policy depends on `currentAccessToken` abilities, fake an access token with the minimal token abilities set and assert the outcome.
- The default authorization failure stays `403`, not `404`, unless the repo already hides resource existence.

Canonical test path: `tests/unit/policies/post_policy.spec.ts`.

## Transformer Variants Coverage

Transformers emit the client-facing shape consumed by `@generated/data` (`Data.Post`, `Data.Post.Variants['forDetailedView']`, etc.). A silently-removed variant breaks every page and API client that depends on it — and the breakage is invisible until runtime.

- Unit test the default `toObject()` shape: assert every expected field is present and that no field leaks outside the allowed set.
- Unit test every named variant the transformer exposes. If the transformer declares a `forList` and a `forDetailedView` variant, the test file must cover both.
- When a variant conditionally includes a computed field (`can.edit`, `can.delete`), cover both branches — permitted and forbidden.
- Assert that raw Lucid models are never returned. `PostTransformer.transform(post)` must return the transformer output, not the model itself.
- Canonical test path: `tests/unit/transformers/post_transformer.spec.ts`.

## Browser Tests

Browser tests via `@japa/browser-client` (Playwright) exist for end-to-end scenarios that cannot be covered at the functional level.

- Put browser specs under `tests/browser`.
- Keep the browser suite small. It is the slowest and flakiest layer — every added case pays a maintenance cost.
- Appropriate scopes: critical login flows, complex forms with multi-step navigation, third-party integrations that require a real DOM.
- Inappropriate scopes: plain CRUD (use functional tests), single-component behavior (use unit tests), static page rendering (use Inertia prop assertions in a functional test).
- Run the browser suite twice in CI for flaky-test detection. A spec that passes once and fails once is a flaky spec, not a bug — investigate the spec, not the feature, until it stabilizes.
- Assert user-visible outcomes, not implementation details: a URL change, a text appearing on screen, a form redirect, a flash notification. Do not assert the DOM structure.

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
- `tests/browser/auth/login.spec.ts`
