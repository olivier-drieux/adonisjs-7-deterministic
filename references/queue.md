# Queue

## Defaults

- Install with `node ace add @adonisjs/queue`.
- Use the `sync` driver for development and tests, and the `redis` driver in production.
- Define jobs as classes extending `Job<T>` with typed payloads.
- Generate jobs with `node ace make:job <Name>`.
- Run workers with `node ace queue:work` as a separate process from the web server.

## Config

```ts
// config/queue.ts
import env from '#start/env'
import { defineConfig, drivers } from '@adonisjs/queue'

export default defineConfig({
  default: env.get('QUEUE_DRIVER', 'redis'),

  adapters: {
    redis: drivers.redis({
      connectionName: 'main',
    }),
    sync: drivers.sync(),
  },

  worker: {
    concurrency: 5,
    idleDelay: '2s',
  },

  locations: ['./app/jobs/**/*.{ts,js}'],
})
```

## Job Class

```ts
import { inject } from '@adonisjs/core'
import { Job } from '@adonisjs/queue'
import type { JobOptions } from '@adonisjs/queue/types'
import PaymentService from '#services/payment_service'

interface ProcessPaymentPayload {
  orderId: number
  amount: number
  currency: string
}

@inject()
export default class ProcessPayment extends Job<ProcessPaymentPayload> {
  static options: JobOptions = {
    queue: 'payments',
    maxRetries: 3,
  }

  constructor(private paymentService: PaymentService) {
    super()
  }

  async execute() {
    await this.paymentService.charge(
      this.payload.orderId,
      this.payload.amount,
      this.payload.currency
    )
  }
}
```

## Dispatch Rules

- Dispatch from **services or listeners**, not controllers. Controllers handle HTTP; background work belongs to the service layer.
- Use `JobClass.dispatch(payload)` for simple dispatch.
- Use the fluent API for advanced configuration:

```ts
// excerpt
await ProcessPayment.dispatch(payload).toQueue('payments')
await ProcessPayment.dispatch(payload).priority(1)
await SendReminder.dispatch(payload).in('24h')
await GenerateReport.dispatch(payload).group('monthly-reports-2025')
await ProcessPayment.dispatch(payload).with('redis')
```

## Rules

- Jobs orchestrate; services do the real work (same principle as Ace commands).
- Jobs MUST be idempotent — safe to retry on failure.
- Use `@inject()` for dependency injection in job constructors.
- The `sync` driver is acceptable in dev and test only; production must use a persistent driver.
- Do not use raw BullMQ, bee-queue, agenda, or custom Redis polling when `@adonisjs/queue` covers the requirement.

## Testing

- Use `queue.fake()` to capture dispatched jobs without executing them.
- Assert the expected job class and payload were dispatched.
- For integration tests, use the `sync` driver to execute jobs synchronously.
