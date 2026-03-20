# Inertia React Libraries

## Default Stack

| Concern | Default library | Rule |
| --- | --- | --- |
| Page navigation and forms | `@adonisjs/inertia/react` | Use `Link` and `Form` for standard page flows |
| Inertia core primitives | `@inertiajs/react` | Only for app boot and primitives not re-exported by Adonis |
| UI components | `@mantine/core` | Mantine-first for buttons, inputs, layout, overlays, and menus |
| UI hooks | `@mantine/hooks` | Local UI behavior only |
| Notifications | `@mantine/notifications` | Flash toasts and ephemeral status messages |
| Icons | `@tabler/icons-react` | Default icon set |
| Date widgets | `@mantine/dates` + `dayjs` | Use only when a real date picker or calendar is needed |
| Local shared UI state | `zustand` | UI-only, never server truth |
| Client-side fetching | Tuyau + `@tanstack/react-query` | Exception path only after Inertia-first options are exhausted |
| Advanced data grids | `@tanstack/react-table` | Use only when grid behavior exceeds simple table needs |

## Forbidden By Default

- `@mantine/form`
- `react-hook-form`
- `formik`
- `zod`, `yup`, `valibot`, or similar client-side schema libraries for standard Inertia form validation
- raw `fetch`
- raw `axios`
- `ky`
- `SWR`
- `react-router-dom`
- a second component library alongside Mantine in new code

## Canonical Imports

```tsx
import { Form, Link } from '@adonisjs/inertia/react'
import type { InferPageProps } from '@adonisjs/inertia/types'
import { Head, router, useRemember } from '@inertiajs/react'
import { Button, Card, Stack, TextInput } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconPlus } from '@tabler/icons-react'
import { client, urlFor } from '~/client'
```

## Root Provider Stack

```tsx
import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { theme } from './theme'

createRoot(el).render(
  <MantineProvider theme={theme}>
    <Notifications />
    <App {...props} />
  </MantineProvider>
)
```

- Keep the theme in one file: `inertia/theme.ts`.
- Import `@mantine/dates/styles.css` only when the application actually uses `@mantine/dates`, and import it after `@mantine/core/styles.css`.
- If `@mantine/dates` is used, install `dayjs` and configure its locale or plugins in one root place only.
- Add `QueryClientProvider` only when TanStack Query is actually used.

## API Client Contract

Default `inertia/client.ts` contract:

```ts
import { registry } from '@generated/registry'
import { createTuyau } from '@tuyau/core/client'

export const client = createTuyau({
  baseUrl: '/',
  registry,
})

export const urlFor = client.urlFor
```

- Always export `client`.
- Always export `urlFor`.
- Do not export `queryClient` or `api` unless TanStack Query is actually used.

If TanStack Query is enabled, extend `inertia/client.ts` like this:

```ts
import { QueryClient } from '@tanstack/react-query'
import { createTuyauReactQueryClient } from '@tuyau/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
})

export const api = createTuyauReactQueryClient({ client })
```

## Decision Thresholds

- Use Inertia props, partial reloads, deferred props, and mergeable props first.
- Use Tuyau + TanStack Query only when the page truly needs client-initiated refetching, polling, optimistic updates, background refresh, infinite scrolling, or an isolated data widget.
- Put the configured typed API client in `inertia/client.ts`. Do not instantiate API clients inside components.
- Keep `inertia/client.ts` lean by default. Add `queryClient` and `api` only when TanStack Query is present.
- Use Zustand only for UI state like sidebar open state, modal stacks, local filter drafts, or wizard step progression.
- Do not use Zustand for auth, server entities, pagination results, or standard form state.
- Use `@mantine/dates` only when a date picker, range picker, or calendar widget is needed. Otherwise prefer ISO strings, server-formatted dates, or native date inputs.
- If TanStack Query is enabled, use `retry: 1`, `refetchOnWindowFocus: false`, and `staleTime: 30_000` as the only default query settings.
- Use TanStack Table only when column visibility, sorting, resizing, pinning, selection, or virtualization are required. Otherwise use Mantine table primitives or plain table markup.

## Client Fetch Exception

```tsx
import { useQuery } from '@tanstack/react-query'
import { api } from '~/client'

const postsQuery = useQuery({
  ...api.posts.list.queryOptions({
    query: filters,
  }),
})
```

- Keep this pattern out of ordinary page CRUD flows.
- Prefer a controller-rendered Inertia page unless the data interaction is explicitly client-driven.
- Add `QueryClientProvider` only on projects or features that use this pattern.
