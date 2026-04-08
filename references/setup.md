# Setup and Prerequisites

## Runtime Prerequisites

AdonisJS v7 has firm minimum versions:

- **Node.js ≥ 24.x** (older versions are no longer supported).
- **npm ≥ 11.x**.
- TypeScript 5.9 or 6.0.
- ESLint 10.
- Vite 7 (for Inertia stacks).

Always pin these in your CI pipelines, Docker images, and production servers before starting feature work.

## Creating a New Application

Use the official `npm create adonisjs@latest` command with one of the four starter kits. The older `npm init adonisjs@latest` form still resolves but is not the canonical v7 scaffold command.

```sh
# Interactive
npm create adonisjs@latest my-app

# Pick a starter kit explicitly
npm create adonisjs@latest my-app -- --kit=hypermedia  # Edge + Alpine.js
npm create adonisjs@latest my-app -- --kit=react       # Inertia + React
npm create adonisjs@latest my-app -- --kit=vue         # Inertia + Vue
npm create adonisjs@latest my-app -- --kit=api         # API-only Turborepo monorepo
```

### Starter kits map

| Kit | Layout | Use |
| --- | --- | --- |
| `hypermedia` | flat | Server-rendered Edge + Alpine.js, no Inertia. Not the default path in this skill. |
| `react` | flat | Canonical `web` and `mixed` profiles in this skill. |
| `vue` | flat | Allowed only with an explicit override (see `hb.web-ui-stack`). |
| `api` | Turborepo monorepo (`apps/backend` + `apps/frontend`) | Canonical `api-only` profile for external or integration APIs. |

The `api` kit is a **monorepo** managed by Turborepo. It uses `apps/backend` for the AdonisJS application and `apps/frontend` for an empty workspace you can point at TanStack Start, Nuxt, Next.js, or any other frontend. Package exports (`./registry`, `./data`) wire end-to-end types between the two workspaces.

## Development Server

Start the dev server with HMR for the fastest feedback loop:

```sh
node ace serve --hmr
```

- Prefer `--hmr` over `--watch` in normal development. HMR updates modules without reloading the page and preserves React/Inertia state.
- Use `--watch` when you need a full process restart (for example, while debugging server startup logic).

The assembler watches the filesystem while the dev server runs. New controllers, transformers, and Inertia pages are picked up automatically, which keeps `#generated/controllers`, `@generated/data`, and `@generated/registry` in sync.

## adonisrc.ts Hooks Pipeline

AdonisJS v7 introduces an explicit hooks system in `adonisrc.ts`. These hooks feed the assembler and generate the type-safe surface the skill relies on. **`indexEntities()` is mandatory for every app**; additional hooks are added per stack.

```ts
// adonisrc.ts
import { indexEntities } from '@adonisjs/core'
import { indexPages } from '@adonisjs/inertia'
import { indexPolicies } from '@adonisjs/bouncer'
import { defineConfig } from '@adonisjs/core/app'
import { generateRegistry } from '@tuyau/core/hooks'

export default defineConfig({
  hooks: {
    init: [
      // Always required.
      indexEntities(),

      // Inertia + Tuyau stack (web, mixed).
      indexPages({ framework: 'react' }),
      generateRegistry(),
      indexEntities({ transformers: { enabled: true, withSharedProps: true } }),

      // Bouncer authorization.
      indexPolicies(),
    ],
    buildStarting: [
      // Vite build hook.
      () => import('@adonisjs/vite/build_hook'),
    ],
  },
})
```

What each hook produces:

- `indexEntities()` — discovers controllers and generates `#generated/controllers` (the barrel that exposes `controllers.Posts`, `controllers.Session`, etc.).
- `indexPages({ framework: 'react' })` — indexes `inertia/pages/**/*` so `inertia.render('posts/index', ...)` is type-safe.
- `generateRegistry()` — produces `@generated/registry` consumed by `createTuyau(...)` and `urlFor(...)`.
- `indexEntities({ transformers: { enabled: true, withSharedProps: true } })` — emits the `Data.*` namespace (`@generated/data`) and the typed `SharedProps` surface.
- `indexPolicies()` — registers bouncer policies for the container and type inference.
- `@adonisjs/vite/build_hook` — wires Vite's production build into the assembler `buildStarting` phase.

Omitting any required hook breaks generated imports (`#generated/controllers`, `@generated/data`, `@generated/registry`). If those imports fail to resolve, the first step is to check this file, not the consumer.

## Monorepo API Kit Layout

The `api` kit lays out:

```
.
├── apps
│   ├── backend          # AdonisJS application (this skill applies here)
│   │   ├── adonisrc.ts
│   │   ├── app
│   │   ├── bin
│   │   ├── config
│   │   ├── database
│   │   ├── start
│   │   └── tests
│   └── frontend         # Your chosen frontend framework
├── package.json
└── turbo.json
```

- Run commands from the repository root (`npm run dev`, `turbo run test`, etc.).
- `apps/backend` hosts the canonical AdonisJS layout the rest of the skill references (`app/`, `start/`, `config/`, `database/`, `tests/`).
- The monorepo package exports wire `@my-app/backend/registry` and `@my-app/backend/data` so the frontend workspace consumes the generated Tuyau registry and transformer types without duplication.
