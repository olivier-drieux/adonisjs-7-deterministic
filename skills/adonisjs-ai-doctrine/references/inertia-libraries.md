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

## Mantine-first Component Rule

Always prefer a Mantine component over a raw HTML element when Mantine provides an equivalent:

| Instead of | Use |
|---|---|
| `<button>` | `<Button>` from `@mantine/core` |
| `<input type="text">` | `<TextInput>` |
| `<input type="number">` | `<NumberInput>` |
| `<select>` | `<Select>` |
| `<textarea>` | `<Textarea>` |
| `<div>` as a card container | `<Card>` |
| `<div>` as a vertical stack | `<Stack>` |
| `<div>` as a horizontal row | `<Group>` |
| `<dialog>` or custom modal | `<Modal>` |
| `<ul>` as a dropdown menu | `<Menu>` |
| `<table>` | `<Table>` from `@mantine/core` (or TanStack Table for advanced grids) |

**Exception**: use raw HTML or a specialized third-party component when **all** of these conditions are met:
1. The UI requirement is genuinely complex (rich text editor, drag-and-drop, canvas, code editor, etc.).
2. No Mantine component covers the need, even with `styles`, `classNames`, or `renderRoot` customization.
3. The third-party component does not replace the Mantine design system — it coexists within it.

## CSS Modules Styling

Use CSS Modules (`.module.css`) as the default method for custom styling. Mantine itself is built on CSS Modules and its documentation recommends this approach as the most performant.

### Applying styles to Mantine components

```tsx
// excerpt
import { TextInput } from '@mantine/core'
import classes from './PostForm.module.css'

// Root element — use className
<TextInput className={classes.input} />

// Inner elements — use classNames with part-name keys
<TextInput
  classNames={{
    root: classes.root,
    input: classes.input,
    label: classes.label,
  }}
/>
```

### Custom component styling

```css
/* PostCard.module.css */
.card {
  border-left: 3px solid var(--mantine-color-blue-6);
  padding: var(--mantine-spacing-md);
}

.title {
  font-size: var(--mantine-font-size-lg);
  font-weight: 600;
}
```

```tsx
import { Card, Text } from '@mantine/core'
import classes from './PostCard.module.css'

export function PostCard({ title, body }: { title: string; body: string }) {
  return (
    <Card className={classes.card}>
      <Text className={classes.title}>{title}</Text>
      <Text>{body}</Text>
    </Card>
  )
}
```

### Rules

- Always use Mantine CSS variables (`--mantine-color-*`, `--mantine-spacing-*`, `--mantine-font-size-*`, `--mantine-breakpoint-*`) inside CSS Modules to stay consistent with the design system.
- Use `data-*` attributes for state-based styling (`data-active`, `data-collapsed`, etc.) instead of dynamically generating class names.
- Keep one `.module.css` file per component or per page when the styles are small.
- Inline `style={{}}` is acceptable only for truly dynamic runtime values (computed widths, positions, progress bars). Never use it for static visual styling.

### Forbidden styling paths

- Tailwind CSS
- styled-components
- Emotion `css()`
- Global unscoped CSS for component styling (global CSS is only for Mantine imports like `@mantine/core/styles.css`)

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
import { InertiaProps } from '~/types'
import { Data } from '@generated/data'
import { Head, router, useRemember } from '@inertiajs/react'
import { Button, Card, Stack, TextInput } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconPlus } from '@tabler/icons-react'
import { client, urlFor } from '~/client'
```

- `InertiaProps<T>` from `~/types` is the default page-prop helper in v7 starter kits. It composes the generated `SharedProps` with the page-specific shape.
- `Data.<Resource>` from `@generated/data` exposes the shape emitted by `<Resource>Transformer`. Variant types are available as `Data.Post.Variants['<variantName>']`.
- `InferPageProps` from `@adonisjs/inertia/types` is still exported as a low-level primitive for custom assembler hooks or advanced typing. It is **not** the day-to-day default.

## Root Provider Stack

```tsx
// excerpt
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

### Tuyau `urlFor` and `client` API Signatures

`urlFor` generates a URL string from a named route. Parameters are passed as a **flat object** — not nested under a `params` key:

```ts
import { urlFor } from '~/client'

// Correct — flat parameters
urlFor('posts.show', { id: 42 })
// => '/posts/42'

urlFor('users.posts.show', { userId: 1, id: 42 })
// => '/users/1/posts/42'

// No parameters
urlFor('posts.index')
// => '/posts'

// WRONG — do not nest under params
urlFor('posts.show', { params: { id: 42 } })
```

> Note: Tuyau's `urlFor(route, params)` takes a flat `params` positional argument. Separately, the `@adonisjs/inertia/react` `Link` and `Form` components use a **`routeParams` prop** (documented below). Do not confuse the two — `<Link route="..." routeParams={{ id }}>` is required in JSX; `urlFor('route', { id })` is used in plain TypeScript.

`client` exposes typed route methods for making API calls:

```ts
// excerpt
import { client } from '~/client'

// GET request
const { data } = await client.posts.$get({ query: { page: 1, perPage: 20 } })

// POST request
const { data } = await client.posts.$post({ title: 'Hello', body: 'World' })

// Route with parameters
const { data } = await client.posts({ id: 42 }).$get()
```

Before using any Tuyau method for the first time, verify the exact signature by reading the types exported from `@generated/registry` or the Tuyau source. The API surface between `urlFor`, `client.getRoute`, and the chained route methods differs.

### `@adonisjs/inertia/react` `Link` and `Form` props

```tsx
// excerpt
import { Form, Link } from '@adonisjs/inertia/react'

// Single parameter
<Link route="posts.show" routeParams={{ id: post.id }}>
  {post.title}
</Link>

// Multiple parameters
<Link route="users.posts.show" routeParams={{ userId: user.id, postId: post.id }}>
  View post
</Link>

// Form
<Form route="posts.update" routeParams={{ id: post.id }}>
  {({ errors }) => (
    <>
      {/* fields */}
    </>
  )}
</Form>
```

- The prop is **`routeParams`** — not `params`. Passing `params={...}` is an obsolete shape that no longer applies.
- `routeParams` takes a flat object keyed by route parameter name: `{ id: 42 }`, never `{ params: { id: 42 } }`.
- Always use named routes via `route` + `routeParams` instead of hardcoded URL strings.

If TanStack Query is enabled, extend `inertia/client.ts` like this:

```ts
// excerpt
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
// excerpt
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

## Documented Exceptions to `hb.no-client-fetch-stack`

`hb.no-client-fetch-stack` forbids raw `fetch`, `axios`, `ky`, and `SWR` as the **default** client data stack. There are two narrow scenarios where a raw-`fetch` call is allowed — and only because Tuyau and Inertia cannot express them today. These are exceptions, not alternative defaults.

### Scenario 1 — Incremental streaming responses (NDJSON / SSE / ReadableStream)

Use when the endpoint streams a long-lived response that the client must consume incrementally as bytes arrive: NDJSON for long-running job progress, Server-Sent Events for a live feed, or a raw `ReadableStream` for a generated artifact. Tuyau currently returns parsed JSON and Inertia partial reloads return a single page snapshot, so neither can express true incremental consumption.

Allowed shape:

```ts
// excerpt
// inertia/stream-client.ts — isolated typed helper, NOT the default data stack
// doctrine-exception: hb.no-client-fetch-stack — streaming (NDJSON/SSE/ReadableStream)
export async function streamJobProgress(
  jobId: string,
  onEvent: (event: { type: 'progress' | 'done'; value: number }) => void,
  signal: AbortSignal
): Promise<void> {
  const response = await fetch(`/api/jobs/${jobId}/progress`, {
    headers: { Accept: 'application/x-ndjson' },
    signal,
  })
  if (!response.ok || !response.body) throw new Error('stream failed')
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader()
  let buffer = ''
  while (true) {
    const { value, done } = await reader.read()
    if (done) return
    buffer += value
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) if (line) onEvent(JSON.parse(line))
  }
}
```

Requirements:
- The call lives in a dedicated, typed helper module (for example `inertia/stream-client.ts`). It is not inlined in a component.
- The helper exposes a typed API (`streamJobProgress(...)`), not a raw `fetch` surface.
- The comment cites `hb.no-client-fetch-stack` and names the streaming exception so future readers understand the non-default status.
- CRUD, list, and form flows do **not** use this pattern — they go through Tuyau or Inertia.

### Scenario 2 — Multipart / progress uploads

Use when the feature needs `multipart/form-data` with live upload progress (percentage, cancel, resumable chunks). Tuyau's typed client does not expose the `XMLHttpRequest` `upload.onprogress` surface, and Inertia's `Form` does not emit byte-level progress events.

Allowed shape:

```ts
// excerpt
// inertia/upload-client.ts — isolated typed helper
// doctrine-exception: hb.no-client-fetch-stack — multipart/progress uploads
export function uploadWithProgress(
  url: string,
  file: File,
  onProgress: (percent: number) => void,
  signal: AbortSignal
): Promise<{ id: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', url)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => (xhr.status < 300 ? resolve(JSON.parse(xhr.responseText)) : reject())
    xhr.onerror = reject
    signal.addEventListener('abort', () => xhr.abort())
    const form = new FormData()
    form.append('file', file)
    xhr.send(form)
  })
}
```

Requirements:
- Same isolation rule as streaming — one typed helper, not a direct `fetch`/`XMLHttpRequest` call in components.
- Comment cites `hb.no-client-fetch-stack` and names the multipart-upload exception.
- Ordinary file uploads that do not need progress go through a normal Inertia `Form` with a file field.

### Non-scenarios — still forbidden

- Using raw `fetch` to avoid configuring Tuyau.
- Using `axios` because "it feels familiar".
- Reaching for `SWR` or `ky` because they look lighter than TanStack Query.
- Calling `fetch` from inside a React component body (even inside an effect) with no typed helper.

If the need does not match one of the two documented scenarios above, the hard blocker applies. Do not invent a third exception without updating this doctrine first.
