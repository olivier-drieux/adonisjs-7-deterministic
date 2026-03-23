# Forbidden Patterns — Quick Lookup

This flat table summarizes every hard blocker as a forbidden import, API call, or pattern with its canonical alternative. Agents with limited context windows can use this file alone.

| Forbidden Pattern | Alternative | Rule |
|---|---|---|
| `import { PrismaClient }` / `import { drizzle }` | Lucid ORM models | `hb.data-stack` |
| `new Date()` for persisted domain dates | Luxon `DateTime` | `hb.data-stack` |
| `request.all()` | `request.validateUsing(validator)` | `hb.no-request-all-only` |
| `request.only(...)` | `request.validateUsing(validator)` | `hb.no-request-all-only` |
| Inline validation logic in controller | VineJS validator file + `request.validateUsing(...)` | `hb.validation-stack` |
| `Authorization: Bearer` for browser auth | `@adonisjs/auth` session/cookie guard | `hb.auth-browser-stack` |
| Custom guard names (`admin`, `user`, etc.) | Fixed `web` and `api` guard names | `hb.guard-names` |
| `enableXsrfCookie: false` in Inertia apps | `enableXsrfCookie: true` | `hb.browser-csrf` |
| Custom API-key auth middleware | Official access tokens via `@adonisjs/auth` | `hb.no-custom-api-keys-default` |
| `from 'vue'` / Edge `.edge` feature pages | Inertia React + Mantine | `hb.web-ui-stack` |
| `from 'react-router-dom'` | Inertia navigation (`Link`, `router.visit`) | `hb.web-ui-stack` |
| `from 'casl'` / `@casl/ability` | `@adonisjs/bouncer` policies | `hb.official-side-effect-packages` |
| `from 'nodemailer'` | `@adonisjs/mail` | `hb.official-side-effect-packages` |
| `from 'node:fs'` / `from 'fs/promises'` (app storage) | `@adonisjs/drive` | `hb.official-side-effect-packages` |
| `app.use(cors())` / Express middleware chain | Framework-native middleware in `start/kernel.ts` | `hb.no-express-fastify-composition` |
| `class PostRepository` / `from '*repository*'` | Direct model + service usage | `hb.no-repository-layer` |
| Edge templates for feature pages | Only `inertia_layout.edge` boot layout allowed | `hb.no-edge-feature-rendering` |
| `: any`, `as any`, `<any>` | Concrete types | `hb.no-any` |
| `setInterval(` / `setTimeout(` in HTTP runtime | Ace commands or event listeners | `hb.no-raw-io-and-timers` |
| `fetch(` in page components | Inertia props/redirects, Tuyau when justified | `hb.no-client-fetch-stack` |
| `from 'axios'` | Inertia props/redirects, Tuyau when justified | `hb.no-client-fetch-stack` |
| `from 'ky'` | Inertia props/redirects, Tuyau when justified | `hb.no-client-fetch-stack` |
| `from 'swr'` | Inertia props/redirects, Tuyau when justified | `hb.no-client-fetch-stack` |
| `from '@mantine/form'` | `@adonisjs/inertia/react` Form + server VineJS | `hb.no-client-form-stack` |
| `from 'react-hook-form'` | `@adonisjs/inertia/react` Form + server VineJS | `hb.no-client-form-stack` |
| `from 'formik'` | `@adonisjs/inertia/react` Form + server VineJS | `hb.no-client-form-stack` |
| `from 'zod'` | Server-side VineJS validation | `hb.no-client-form-stack` |
| `from 'yup'` | Server-side VineJS validation | `hb.no-client-form-stack` |
| `from 'valibot'` | Server-side VineJS validation | `hb.no-client-form-stack` |
| Same controller for Inertia pages + JSON API | Separate web and API controllers | `hb.web-api-controller-separation` |
| Third-party package when official exists | Official AdonisJS package + `node ace` | `hb.official-packages` |
