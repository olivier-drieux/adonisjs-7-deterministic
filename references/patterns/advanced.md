# Advanced Patterns

## Date Widgets with Mantine

```tsx
import { DatePickerInput } from '@mantine/dates'

<DatePickerInput
  name="publishedAt"
  label="Publish date"
  valueFormat="YYYY-MM-DD"
/>
```

- Use this only when a real date widget improves the UX.
- `@mantine/dates` requires `dayjs`. Keep Luxon on the server side.

## File Generation or Export Flow

```ts
// excerpt
// service
const key = `exports/invoices/${invoice.id}.pdf`
await drive.use().put(key, pdfBuffer)
return key

// controller
const url = await drive.use().getSignedUrl(key, { expiresIn: '30 mins' })
return { url }
```

- Generate files in a service or command.
- Store the key.
- Return a signed URL or persist export metadata.

### Binary Downloads vs Inertia Navigation

Inertia `<Link>` triggers XHR navigation and expects an Inertia JSON response. A route that returns a binary (PDF, CSV, ZIP, image) will break if called through `<Link>` because the XHR response is not an Inertia page.

**Rule: binary download routes never go through Inertia navigation.** Use a native `<a>` tag or `window.location.href` instead.

```tsx
// excerpt
// Correct — native anchor for a binary download
import { urlFor } from '~/client'

<a href={urlFor('invoices.export', { id: invoice.id })} download>
  <Button>Download PDF</Button>
</a>

// Correct — programmatic download
function handleExport(id: number) {
  window.location.href = urlFor('invoices.export', { id })
}

// WRONG — Inertia Link for a binary route
<Link route="invoices.export" routeParams={{ id: invoice.id }}>Download</Link>
```

- If the route returns a **page**, use `<Link>` with `routeParams`.
- If the route returns a **file or binary stream**, use `<a href>` or `window.location.href`.
- For signed URLs from Drive, render the signed URL in a plain `<a>` tag.
- Tuyau's `urlFor('route', { id })` uses a flat positional argument. The `@adonisjs/inertia/react` `Link` and `Form` props use the named prop `routeParams`. They are two different APIs for two different contexts — do not confuse `params` with `routeParams`.

## Upload or Persistent Storage via Drive

```ts
// excerpt
const { avatar } = await request.validateUsing(updateAvatarValidator)
const key = `avatars/${user.id}/${cuid()}.${avatar.extname}`
await avatar.moveToDisk(key)
user.avatar = key
await user.save()
```

- Store only the key in the database.
- Use `driveUrl` or `getUrl` to resolve the public URL later.

## Recurring Task via Ace Command

```ts
// excerpt
export default class SyncInvoices extends BaseCommand {
  static commandName = 'invoices:sync'

  @inject()
  async run(service: InvoiceSyncService) {
    await service.run()
  }
}
```

- Commands orchestrate.
- Services do the real work.
- Recurring commands MUST be idempotent.
- Do not move batch logic into controllers.

## Advanced Tables

```tsx
// excerpt
import { useReactTable, getCoreRowModel } from '@tanstack/react-table'

const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
})
```

- Use TanStack Table only for genuinely advanced grid behavior.
- For ordinary read-only lists, keep Mantine or plain table markup.

## Unit and Functional Tests

```ts
// excerpt
test('stores a post through the web flow', async ({ client, route }) => {
  const user = await UserFactory.create()

  await client
    .post(route('posts.store'))
    .loginAs(user)
    .form({ title: 'Hello', body: 'World' })
    .withCsrfToken()
    .assertRedirect()
})
```

```ts
// excerpt
test('lists posts through the external API', async ({ client, route }) => {
  const user = await UserFactory.create()

  await client
    .get(route('api.posts.index'))
    .withGuard('api')
    .loginAs(user)
    .assertStatus(200)
})
```

```ts
// excerpt
test('queues verification mail', async ({ cleanup }) => {
  const { mails } = mail.fake()
  cleanup(() => mail.restore())

  await new SessionService().register(payload)

  mails.assertSent(VerifyEmailNotification)
})
```

## Forbidden Frontend Library Patterns

- Do not use `@mantine/form`, `react-hook-form`, or `formik` for standard Inertia forms.
- Do not mirror VineJS validation with `zod`, `yup`, or similar client schemas for ordinary page flows.
- Do not use raw `fetch`, raw `axios`, `ky`, or `SWR` in page components.
- Do not add `react-router-dom` on top of Inertia.

## Documented Exceptions to `hb.no-raw-io-and-timers`

`hb.no-raw-io-and-timers` forbids raw `nodemailer`, persistent raw `fs`, and ad hoc timers in HTTP runtime. There are two narrow, non-default scenarios where a direct low-level call is allowed. They exist because AdonisJS Drive and `@adonisjs/queue` cannot model them today. Treat them as exceptions, cite the rule id, and keep the call isolated.

### Scenario 1 — Short-lived temp-bridge files under `os.tmpdir()` for CLI / MCP / Ace subprocess integration

Use when an Ace command, an MCP server, or a CLI integration must hand a payload to an external subprocess through a temporary file (ffmpeg, pandoc, whisper, libreoffice, etc.). Drive is about persistent application storage — it is not the right abstraction for an ephemeral bridge file that lives only for the duration of a subprocess call.

Allowed shape:

```ts
// excerpt
// commands/export_transcript.ts — Ace command, NOT HTTP runtime
// doctrine-exception: hb.no-raw-io-and-timers — temp-bridge file for Ace/CLI/MCP subprocess
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

// hb.no-raw-io-and-timers — temp-bridge exception: ffmpeg needs a real path,
// not a Drive URL. File lives under os.tmpdir() for one subprocess call.
const tempPath = path.join(os.tmpdir(), `transcode-${randomUUID()}.wav`)
try {
  await fs.writeFile(tempPath, inputBuffer)
  await execFileAsync('ffmpeg', ['-i', tempPath, '-f', 'mp3', outputPath])
} finally {
  await fs.unlink(tempPath).catch(() => {})
}
```

Requirements:
- Runs in an **Ace command, MCP server, or CLI adapter** — never in an HTTP controller.
- The path is built from `os.tmpdir()` with a unique suffix (`randomUUID`, `cuid`, `pid + hrtime`).
- The file is removed in a `finally` block. No persistent state.
- Persistent application storage still goes through `@adonisjs/drive` — this exception does not cover user uploads, exports, or any file that outlives the subprocess.
- A code comment names `hb.no-raw-io-and-timers` and the temp-bridge exception clause.

### Scenario 2 — Bounded timers outside the HTTP request lifecycle

Use inside a queue job, an Ace command, or an integration worker when the workload requires a bounded delay or a retry backoff that the queue stack does not model natively. Examples: polling a third-party API every N seconds until it reports completion, rate-limit backoff between external calls, a bounded health probe in a worker boot sequence.

Allowed shape:

```ts
// excerpt
// jobs/poll_external_export.ts — queue job, NOT HTTP runtime
// doctrine-exception: hb.no-raw-io-and-timers — bounded timer outside HTTP
import { setTimeout as delay } from 'node:timers/promises'

export default class PollExternalExport extends Job {
  async handle(payload: { exportId: string }) {
    // hb.no-raw-io-and-timers — bounded-timer exception: third-party API
    // has no webhook; poll at most 30 times with a 10s backoff.
    for (let attempt = 0; attempt < 30; attempt++) {
      const status = await externalApi.getExport(payload.exportId)
      if (status.state === 'done') return status
      if (status.state === 'failed') throw new ExportFailed(payload.exportId)
      await delay(10_000, undefined, { signal: this.signal })
    }
    throw new ExportTimedOut(payload.exportId)
  }
}
```

Requirements:
- Runs in a **queue job, Ace command, or integration worker** — never inside an HTTP controller, middleware, or Inertia page action.
- The loop has an explicit upper bound (`attempt < N`) and a typed failure path when the bound is reached. No unbounded `while (true)` polling.
- Prefer `node:timers/promises` with an `AbortSignal` over `setTimeout(cb, ms)` with no cleanup hook.
- If a native AdonisJS primitive covers the need (cron schedule via `@adonisjs/queue`, scheduled Ace command, provider hook), use that primitive instead — the exception is a fallback, not the default.
- A code comment names `hb.no-raw-io-and-timers` and the bounded-timer exception clause.

### Non-scenarios — still forbidden

- `setTimeout(() => ..., 5000)` inside an HTTP controller to "wait for the DB to catch up".
- A long-lived `fs.createWriteStream` to persist user data — that belongs in Drive.
- Unbounded polling loops with no retry cap.
- Using `require('nodemailer')` directly because `@adonisjs/mail` "seems heavy".
- Calling `setInterval` to run a recurring task instead of registering a scheduled Ace command.

If the need does not match one of the two documented scenarios above, the hard blocker applies.
