# Rendering

## Default

- Use Inertia React for every web UI.
- Keep SSR off by default. Only enable it when the repo already uses it or when the task explicitly requires it.
- Do not create Edge pages or feature templates.
- The official `resources/views/inertia_layout.edge` file is allowed only as the boot layout required by the Inertia adapter.

## Inertia React

- If not already installed, follow the official package setup:
  - `npm i @adonisjs/inertia`
  - `node ace configure @adonisjs/inertia`
- Register the Inertia and Tuyau hooks in `adonisrc.ts` (see [setup.md](setup.md)) so `#generated/controllers`, `@generated/data`, and `@generated/registry` are produced.

- Controllers return `inertia.render(...)`.
- ALWAYS pass transformed data, not raw models, `DateTime`, or complex objects.
- Type page props with `InertiaProps<{...}>` imported from `~/types` and reference data shapes through `Data.<Resource>` imported from `@generated/data`. These types are generated from your transformers by `indexEntities({ transformers: { enabled: true, withSharedProps: true } })`.
- `InferPageProps` from `@adonisjs/inertia/types` remains available as a lower-level primitive for custom hooks or edge cases where the generated `Data` types do not fit. Prefer `InertiaProps<{...}>` for day-to-day page typing.
- Pages live in route-like lowercase paths under `inertia/pages/**/*`.
- Export page components in PascalCase.
- Reusable UI lives in `inertia/components/**/*`.
- Shared layouts live in `inertia/layouts/**/*`.
- UI-only Zustand stores live in `inertia/stores/**/*`.
- If explicit client-side fetching is justified, the typed API client entrypoint lives in `inertia/client.ts`.
- Client boot lives in `inertia/app.tsx`.
- Mantine theme configuration lives in `inertia/theme.ts`.
- SSR entry lives in `inertia/ssr.tsx` when SSR is enabled.
- `config/inertia.ts` is the canonical place for Inertia runtime configuration. Keep one fixed root view and keep SSR disabled by default. In v7, the `entrypoint` option is removed and `history.encrypt` is renamed to the top-level `encryptHistory`. `sharedData` is also removed in favor of the Inertia middleware.
- `app/middleware/inertia_middleware.ts` is the canonical place for shared props. The middleware **must extend `BaseInertiaMiddleware`** from `@adonisjs/inertia/inertia_middleware` so it can reuse `this.init(ctx)`, `this.dispose(ctx)`, and `this.getValidationErrors(ctx)`.
- Core shared props are `user`, `flash`, and `errors`. These three top-level keys are the canonical baseline and must always be present.
- `user` holds the transformed authenticated user (via `UserTransformer`) or `undefined`.
- Additional global shell metadata (app name, environment, locale, version, feature flags, tenant slug, etc.) is allowed, but it **must live under a single `app` namespace** — for example `app.name`, `app.env`, `app.locale`, `app.version`. Do not introduce arbitrary top-level keys outside the core (`user`, `flash`, `errors`, `app`). Page-specific data belongs in the controller's `inertia.render(...)` call, not in shared props.
- Share the core keys and the `app` namespace with `ctx.inertia.always(...)`.
- Augment the `SharedProps` type with `declare module '@adonisjs/inertia/types' { type MiddlewareSharedProps = InferSharedProps<InertiaMiddleware>; export interface SharedProps extends MiddlewareSharedProps {} }` at the bottom of the middleware file.
- For browser-facing Inertia apps, keep Shield CSRF enabled with `enableXsrfCookie: true`.
- Use `@adonisjs/inertia/react` `Link` and `Form` wrappers with named routes. Pass route parameters via a flat `routeParams` prop: `<Link route="posts.show" routeParams={{ id: post.id }}>`. **`routeParams` is the correct prop name in v7 — never `params`.**
- `Link` and `Form` trigger Inertia XHR navigation and expect an Inertia JSON response. For routes that return binary files (PDF, CSV, ZIP), use a native `<a href>` or `window.location.href` instead.
- Use `@inertiajs/react` only for app boot and primitives not provided by Adonis wrappers, such as `Head`, `router`, `usePage`, or `useRemember`.
- Use Mantine as the default component library and `@tabler/icons-react` as the default icon set. Always use Mantine components instead of raw HTML elements when Mantine provides an equivalent (for example `<Button>` not `<button>`, `<TextInput>` not `<input>`, `<Card>` not `<div className="card">`). Use raw HTML or a specialized third-party component only when the UI need is genuinely complex and no Mantine component covers it.
- Use `@mantine/notifications` for flash toasts and ephemeral success or info messages.
- Use `@mantine/dates` only when the UI actually needs a date widget, and pair it with `dayjs`.
- In `inertia/app.tsx`, use one fixed provider order: `MantineProvider`, `Notifications`, then `QueryClientProvider` only when TanStack Query is enabled.
- Use one authenticated app layout and one guest layout by default.
- Mount flash notification plumbing once in the app shell or root authenticated layout, not per page.
- Keep Mantine CSS imports in this order: core, notifications, then dates only when dates are used.
- Use CSS Modules (`.module.css`) for all custom styling. Apply styles to Mantine components via `className` (root) and `classNames` (inner parts). Use Mantine CSS variables (`--mantine-color-*`, `--mantine-spacing-*`) inside CSS Modules. Do not use Tailwind CSS, styled-components, Emotion `css()`, or global unscoped CSS as the default styling path. Inline `style={{}}` is acceptable only for truly dynamic runtime values. See `inertia-libraries.md#css-modules-styling` for full guidance.
- Standard web mutations redirect to a named route and use flash or session feedback.
- Components render props and submit requests. They do not own business rules.
- Use explicit JSON API endpoints only when the page truly needs an API interaction that should not be modeled as a normal Inertia form or page action.
- Do not use `@mantine/form`, `react-hook-form`, `formik`, raw `fetch`, raw `axios`, `ky`, `SWR`, or a second component library by default.
- `inertia/client.ts` always exports `client` and `urlFor`. Export `queryClient` and `api` only when TanStack Query is enabled.
- If TanStack Query is enabled, use conservative defaults: `retry: 1`, `refetchOnWindowFocus: false`, and `staleTime: 30_000`.

For the full allowed and forbidden library matrix, read [inertia-libraries.md](inertia-libraries.md).
