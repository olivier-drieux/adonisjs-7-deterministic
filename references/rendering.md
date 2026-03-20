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

- Controllers return `inertia.render(...)`.
- ALWAYS pass transformed data, not raw models, `DateTime`, or complex objects.
- Prefer `InferPageProps` from `@adonisjs/inertia/types` over duplicated ad hoc page prop interfaces when a page maps directly to a controller action.
- Pages live in `inertia/pages/**/*`.
- Reusable UI lives in `inertia/components/**/*`.
- UI-only Zustand stores live in `inertia/stores/**/*`.
- If explicit client-side fetching is justified, the typed API client entrypoint lives in `inertia/client.ts`.
- Client boot lives in `inertia/app.tsx`.
- Mantine theme configuration lives in `inertia/theme.ts`.
- SSR entry lives in `inertia/ssr.tsx` when SSR is enabled.
- `config/inertia.ts` is the canonical place for Inertia runtime configuration. Keep one fixed root view and keep SSR disabled by default.
- `app/middleware/inertia_middleware.ts` is the canonical place for shared props.
- Shared props stay minimal: `auth`, `flash`, `errors`, and `app`.
- `app` stays flat and tiny: `name` and `env` only.
- Share `auth`, `flash`, `errors`, and `app` with `ctx.inertia.always(...)`.
- For browser-facing Inertia apps, keep Shield CSRF enabled with `enableXsrfCookie: true`.
- Use `@adonisjs/inertia/react` `Link` and `Form` wrappers with named routes.
- Use `@inertiajs/react` only for app boot and primitives not provided by Adonis wrappers, such as `Head`, `router`, `usePage`, or `useRemember`.
- Use Mantine as the default component library and `@tabler/icons-react` as the default icon set.
- Use `@mantine/notifications` for flash toasts and ephemeral success or info messages.
- Use `@mantine/dates` only when the UI actually needs a date widget, and pair it with `dayjs`.
- In `inertia/app.tsx`, use one fixed provider order: `MantineProvider`, `Notifications`, then `QueryClientProvider` only when TanStack Query is enabled.
- Keep Mantine CSS imports in this order: core, notifications, then dates only when dates are used.
- Standard web mutations redirect to a named route and use flash or session feedback.
- Components render props and submit requests. They do not own business rules.
- Use explicit JSON API endpoints only when the page truly needs an API interaction that should not be modeled as a normal Inertia form or page action.
- Do not use `@mantine/form`, `react-hook-form`, `formik`, raw `fetch`, raw `axios`, `ky`, `SWR`, or a second component library by default.
- `inertia/client.ts` always exports `client` and `urlFor`. Export `queryClient` and `api` only when TanStack Query is enabled.
- If TanStack Query is enabled, use conservative defaults: `retry: 1`, `refetchOnWindowFocus: false`, and `staleTime: 30_000`.

For the full allowed and forbidden library matrix, read [inertia-libraries.md](inertia-libraries.md).
