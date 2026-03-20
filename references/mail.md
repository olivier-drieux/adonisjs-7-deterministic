# Mail

## Defaults

- Install with `node ace add @adonisjs/mail`.
- Generate classes with `node ace make:mail <intent>`.
- Always use dedicated mail classes for application emails.
- Build the message inside the mail class `prepare()` method.
- Use Edge views for non-trivial email bodies.

## Sending Rule

- Default to `mail.sendLater(new SomeNotification(...))` for product flows.
- Use `mail.send(...)` only when the request must synchronously depend on the delivery call.
- Trigger mail from services or listeners, not controllers.

## Queueing Rule

- The built-in in-memory messenger is acceptable for development only.
- If queued mail must survive restarts, use a persistent queue in production.

## Attachment Rule

- Do not use `attachData` with `sendLater`.
- Persist the file first, then attach by path or stable storage reference.

## Testing Rule

- Use `mail.fake()` in tests and assert the expected notification class was sent.
