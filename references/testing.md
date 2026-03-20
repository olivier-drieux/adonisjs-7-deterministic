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
- Use `loginAs(...)` for authenticated requests.
- If forms use CSRF protection, configure the relevant test plugins and call `withCsrfToken()`.

## Unit Test Rules

- Unit test services, policies, transformers, commands, and listeners when logic is non-trivial.
- Use `container.swap(...)` and restore methods for injected dependency fakes when needed.

## Fakes

- Mail: `mail.fake()`
- Drive: `drive.fake()`
- Events: `emitter.fake()`
- Hash: `hash.fake()`

## Canonical Test Paths

- `tests/functional/posts/store.spec.ts`
- `tests/functional/posts/update.spec.ts`
- `tests/unit/services/post_service.spec.ts`
- `tests/unit/policies/post_policy.spec.ts`
- `tests/unit/transformers/post_transformer.spec.ts`
