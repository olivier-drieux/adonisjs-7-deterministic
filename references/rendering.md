# Rendering

## Default Selection

- Default to Edge for new server-rendered work.
- Use Inertia only when the repo already uses it or the task explicitly requires it.

## Edge

- Generate templates with `node ace make:view pages/<resource>/<page>`.
- Render from controllers using `view.render('pages/<resource>/<page>', data)`.
- Use `router.on().render(...)` only for static pages with no controller logic.
- Keep data shaping on the server. Templates only render.
- Use route-aware helpers or components instead of hardcoded form actions and links.

## Inertia

- If not already installed, follow the official package setup:
  - `npm i @adonisjs/inertia`
  - `node ace configure @adonisjs/inertia`

- Controllers return `inertia.render(...)`.
- ALWAYS pass transformed data, not raw models, `DateTime`, or complex objects.
- Pages live in `inertia/pages/**/*`.
- Client boot lives in `inertia/app/app.ts`.
- SSR entry lives in `inertia/app/ssr.ts` when SSR is enabled.
- Shared data belongs in `config/inertia.ts` or middleware via `inertia.share(...)`.
- Use `@adonisjs/inertia/react` or `@adonisjs/inertia/vue` `Link` and `Form` wrappers with named routes.
- Components render props and submit requests. They do not own business rules.
