# Frontend Bootstrap Patterns

## Inertia Shared Props

```ts
// app/middleware/inertia_middleware.ts
import config from '@adonisjs/core/services/config'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import BaseInertiaMiddleware from '@adonisjs/inertia/inertia_middleware'
import type { InferSharedProps } from '@adonisjs/inertia/types'
import UserTransformer from '#transformers/user_transformer'

export default class InertiaMiddleware extends BaseInertiaMiddleware {
  share(ctx: HttpContext) {
    /**
     * The share method can be invoked before the session or auth
     * middleware has run (for example during a 404). Always treat
     * context properties as potentially undefined.
     */
    const { session, auth } = ctx as Partial<HttpContext>

    return {
      user: ctx.inertia.always(
        auth?.user ? UserTransformer.transform(auth.user) : undefined
      ),
      flash: ctx.inertia.always({
        success: session?.flashMessages.get('success'),
        error: session?.flashMessages.get('error'),
      }),
      errors: ctx.inertia.always(this.getValidationErrors(ctx)),
      app: ctx.inertia.always({
        name: config.get('app.appName'),
        env: config.get('app.nodeEnv'),
      }),
    }
  }

  async handle(ctx: HttpContext, next: NextFn) {
    await this.init(ctx)
    const output = await next()
    this.dispose(ctx)
    return output
  }
}

declare module '@adonisjs/inertia/types' {
  type MiddlewareSharedProps = InferSharedProps<InertiaMiddleware>
  export interface SharedProps extends MiddlewareSharedProps {}
}
```

- The middleware **must extend `BaseInertiaMiddleware`** so `this.init`, `this.dispose`, and `this.getValidationErrors` are available.
- Share only `user`, `flash`, `errors`, and `app`.
- `user` holds the transformed authenticated user or `undefined`. `user` is the canonical v7 shared-prop name for the authenticated user (not `auth`).
- Keep `app` flat and tiny: `name` and `env` only.
- Always augment `SharedProps` through `declare module '@adonisjs/inertia/types'` so `usePage().props` and `InertiaProps<...>` stay fully typed.
- Do not put lists, counters, filters, or page data into shared props.

## Inertia App Bootstrap

```tsx
// inertia/theme.ts
import { createTheme } from '@mantine/core'

export const theme = createTheme({})
```

```tsx
// excerpt
// inertia/app.tsx
import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import { createInertiaApp } from '@inertiajs/react'
import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { createRoot } from 'react-dom/client'
import { theme } from './theme'

createInertiaApp({
  progress: { color: '#1c7ed6' },
  resolve: (name) => import(`./pages/${name}.tsx`),
  setup({ el, App, props }) {
    createRoot(el).render(
      <MantineProvider theme={theme}>
        <Notifications />
        <App {...props} />
      </MantineProvider>
    )
  },
})
```

- Keep one theme file only.
- Keep provider order fixed: `MantineProvider`, `Notifications`, then `QueryClientProvider` only if TanStack Query is enabled.
- Keep SSR off unless the repo already uses it or the task explicitly requires it.

## Inertia Runtime Config

```ts
// config/inertia.ts
import { defineConfig } from '@adonisjs/inertia'

export default defineConfig({
  rootView: 'inertia_layout',
  encryptHistory: true,
  ssr: {
    enabled: false,
    entrypoint: 'inertia/ssr.tsx',
  },
})
```

- Keep one fixed root view: `inertia_layout`.
- Keep `ssr.enabled` false by default.
- In AdonisJS v7 the top-level `entrypoint` option has been **removed** from `config/inertia.ts` (it was unused). The `history.encrypt` nested option has been renamed to the top-level `encryptHistory`. The `sharedData` option has been **removed** — shared props live in the Inertia middleware.

## Flash Notifications with Mantine

```tsx
import { useEffect } from 'react'
import { usePage } from '@inertiajs/react'
import { notifications } from '@mantine/notifications'

export function FlashNotifications() {
  const { flash } = usePage().props as { flash?: { success?: string; error?: string } }

  useEffect(() => {
    if (flash?.success) notifications.show({ color: 'green', message: flash.success })
    if (flash?.error) notifications.show({ color: 'red', message: flash.error })
  }, [flash])

  return null
}
```

- Use notifications for ephemeral success or info feedback.
- Keep field errors and durable business errors visible in the page or form itself.

## Typed API Client

```ts
// inertia/client.ts
import { registry } from '@generated/registry'
import { createTuyau } from '@tuyau/core/client'

export const client = createTuyau({
  baseUrl: '/',
  registry,
})

export const urlFor = client.urlFor
```

- Always export `client` and `urlFor`.
- Do not add `queryClient` or `api` until TanStack Query is actually used.

## TanStack Query Bootstrap Exception

```ts
// excerpt
// inertia/client.ts
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

```tsx
// excerpt
// inertia/app.tsx
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '~/client'

<MantineProvider theme={theme}>
  <Notifications />
  <QueryClientProvider client={queryClient}>
    <App {...props} />
  </QueryClientProvider>
</MantineProvider>
```

- Add this only when a real TanStack Query use case exists.
- Do not mount `QueryClientProvider` in the default bootstrap.

## Zustand for UI-only Shared State

```ts
import { create } from 'zustand'

type SidebarStore = {
  opened: boolean
  open: () => void
  close: () => void
}

export const useSidebarStore = create<SidebarStore>((set) => ({
  opened: false,
  open: () => set({ opened: true }),
  close: () => set({ opened: false }),
}))
```

- Keep stores in `inertia/stores`.
- Do not use Zustand for auth, server entities, or standard forms.
