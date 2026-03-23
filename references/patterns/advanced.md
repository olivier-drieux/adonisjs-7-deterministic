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
