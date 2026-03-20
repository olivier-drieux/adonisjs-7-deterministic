---
name: adonisjs-7-deterministic
description: Use when implementing or reviewing AdonisJS v7 features and you need framework-native, highly deterministic code structure with official AdonisJS packages, Lucid, VineJS, Auth, Bouncer, Mail, Drive, Edge, or Inertia.
---

# AdonisJS 7 Deterministic

## Purpose

Use this skill to force AdonisJS v7 code toward one stable, framework-native structure. Prefer the most official AdonisJS path with the fewest moving parts.

## Source Hierarchy

1. Official AdonisJS v7 docs on `docs.adonisjs.com`.
2. Official AdonisJS packages and their official setup/docs.
3. Existing conventions already present in the target repository.
4. Personal preference.

- NEVER invent local conventions. Read them from the repo.
- If official docs and repo style conflict, prefer the repo only when changing it is out of scope and mixing styles would make the feature worse.
- NEVER replace an official AdonisJS package with a third-party package when the official package covers the need.

## Non-Negotiables

- MUST use `node ace` generators, `add`, or `configure` commands when the framework provides them.
- MUST use Lucid for SQL persistence.
- MUST use VineJS and `request.validateUsing(...)` for HTTP validation.
- MUST use `@adonisjs/auth` for authentication.
- MUST use `@adonisjs/bouncer` for authorization.
- MUST use `@adonisjs/mail` for email.
- MUST use `@adonisjs/drive` for persistent file storage and uploads.
- MUST use Luxon `DateTime` for model and domain dates.
- MUST keep controllers thin.
- MUST use transformers for API JSON and Inertia props.
- MUST prefer AdonisJS services, middleware, URL builders, test helpers, fakes, and container features over generic Node.js patterns.
- NEVER write Express/Fastify style composition inside an AdonisJS app.
- NEVER add repository layers on top of Lucid for ordinary application code.
- NEVER use `any`, inline controller validation, raw `nodemailer`, raw persistent `fs` calls, or ad-hoc timer logic inside the HTTP runtime.

## Rendering Default

- Default to Edge for new server-rendered pages.
- Use Inertia only when the repo already uses Inertia or the task explicitly requires it.
- If the repo already chose Inertia, stay with Inertia. Do not mix Edge and Inertia flows for the same feature unless the repo already does.

## Canonical Feature Order

Follow this order unless a step is irrelevant.

1. Check official package coverage. Install/configure the official package first.
2. Add env vars in `start/env.ts` and config in `config/*`.
3. Create the migration.
4. Create or update the Lucid model and relations.
5. Create action-specific VineJS validators.
6. Create or update the policy when authorization depends on actor plus resource.
7. Create or update the service.
8. Create or update the transformer for any HTTP payload.
9. Add mail, Drive, events/listeners, or Ace command support if needed.
10. Create or update the controller.
11. Register routes.
12. Write functional tests, then targeted unit tests.
13. Only then add Edge or `inertia/*` UI code.

## Layer Rules

- `start/routes.ts`: import `router` from `@adonisjs/core/services/router`. Default to `#generated/controllers`. Group by prefix, middleware, and name. Put static routes before dynamic routes. Use named routes and route helpers instead of hardcoded URLs.
- `router.resource`: use only for conventional CRUD on one controller with standard actions. Use `.apiOnly()` when `create` and `edit` pages do not exist. Use explicit routes for custom actions, mixed middleware, nested workflow endpoints, or non-CRUD flows.
- `start/kernel.ts`: register named middleware here. Apply middleware at route or group level. Do not inline authentication or authorization logic into route handlers.
- `app/controllers`: one controller per resource or entry flow. Controllers may validate, authorize, call a service, and return a response. Controllers MUST NOT contain multi-step business logic or side effects.
- `app/validators`: one file per resource or workflow, one compiled validator per action. Prefer small duplication over clever validator inheritance.
- `app/models`: one model per aggregate root or table. Keep relations, scopes, hooks, and date semantics here. Do not hide Lucid behind repositories.
- `app/services`: default location for business logic. Create a service for every non-trivial write flow and every cross-model workflow.
- `app/policies`: one policy per protected resource. Use abilities only for simple cross-cutting checks that do not deserve a full policy.
- `app/mails`: always use a dedicated mail class for application emails.
- `app/events` and `app/listeners`: use class-based events and listener classes for secondary side effects.
- `app/transformers`: use one transformer per resource returned to JSON or Inertia. Do not send raw models or `DateTime` instances directly.
- `app/exceptions`: put reusable domain and HTTP exception types here. Name them `<Subject>Exception`. Throw named exceptions when the same failure semantics appear in multiple actions.
- `config/*`: keep runtime configuration here. Use one file per official package or bounded concern. Import `env` here, not in controllers or services.
- `start/env.ts`: define every new env var with type, required or optional status, defaults, and allowed values before feature code uses it. Never read `process.env` directly in app code.
- `tests/*`: `tests/functional` for request flows, `tests/unit` for isolated logic.
- `inertia/*`: render props only. NEVER put business logic or persistence logic in page components.

## Deterministic Defaults

- Controllers: generate plural controllers with `node ace make:controller <resource> --resource` or explicit actions.
- Validators: generate by resource with `node ace make:validator <resource>` or `--resource`. Export `createPostValidator`, `updatePostValidator`, `loginValidator`, `uploadAvatarValidator`.
- Services: generate with `node ace make:service <resource-or-workflow>`. Default names are `PostService`, `SessionService`, `InvoiceExportService`.
- Policies: generate with `node ace make:policy <resource>`. Default names are `PostPolicy`, `InvoicePolicy`.
- Mails: generate with `node ace make:mail <intent>`. Keep the default `Notification` suffix unless the repo already standardizes a different intent.
- Events and listeners: use `node ace make:event <LifecycleEvent>` and `node ace make:listener <ActionName>`, or `node ace make:listener <ActionName> --event=<event_name>` for paired scaffolding.
- Commands: generate with `node ace make:command <actionName>`. Command names MUST be verb-first and namespaced when appropriate, like `invoices:sync`.
- Transformers: generate with `node ace make:transformer <resource>`. Create them by default for any JSON or Inertia payload.
- Tests: generate with `node ace make:test <path> --suite=functional|unit`.

## Decision Rules

- Create a service when the use case writes state, coordinates more than one dependency, emits events, uses Drive or Mail, opens a transaction, or is reused. If unsure, create the service.
- Create a transformer for every API response and every Inertia prop payload. Skip only pure redirects, `204` responses, or trivial scalar responses.
- Create a policy when access depends on the current user and a resource or tenant. Use auth middleware alone only for logged-in versus logged-out checks.
- Create a mail class for every email. Do not inline `mail.send` closures in controllers for product code.
- Create an Ace command for imports, exports, backfills, recurring jobs, cleanup, syncs, and operator tasks.
- Open a managed transaction in the service when two or more writes must succeed together or when consistency depends on read-modify-write behavior.
- Keep external I/O outside the transaction whenever possible. Persist first, then emit an event or run the secondary side effect.
- Side effects belong in services and listeners. Controllers only trigger the orchestration.
- New env vars belong in `start/env.ts` and related `config/*` before feature code uses them.

## Anti-Patterns

- `request.all()` or `request.only()` as a substitute for validation.
- Heavy controller logic.
- Business logic in React or Inertia components or Edge templates.
- Generic `helpers.ts`, `utils.ts`, or repository wrappers with no clear bounded purpose.
- Hardcoded route strings when `toRoute`, `urlFor`, `route`, `Link`, or `Form` can derive them.
- Raw `nodemailer` or raw persistent `fs` calls.
- Cron or timer loops started from HTTP boot code.
- Mixing old and new Lucid model styles inside the same repo slice unless the task is a deliberate migration.

## Read These References As Needed

- [references/routing.md](references/routing.md)
- [references/validation.md](references/validation.md)
- [references/lucid.md](references/lucid.md)
- [references/auth.md](references/auth.md)
- [references/bouncer.md](references/bouncer.md)
- [references/mail.md](references/mail.md)
- [references/drive.md](references/drive.md)
- [references/events.md](references/events.md)
- [references/rendering.md](references/rendering.md)
- [references/testing.md](references/testing.md)
- [references/patterns.md](references/patterns.md)
