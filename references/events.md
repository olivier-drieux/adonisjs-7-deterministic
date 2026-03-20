# Events and Listeners

## Defaults

- Use the emitter for secondary side effects, not core invariants.
- Create `start/events.ts` with `node ace make:preload events` if it is missing.
- Prefer class-based events plus listener classes for application code.

## Generators

- Event: `node ace make:event UserRegistered`
- Listener: `node ace make:listener SendVerificationEmail`
- Paired scaffolding: `node ace make:listener SendVerificationEmail --event=user_registered`

## Placement

- Emit from services after successful state changes.
- Register listeners in `start/events.ts`.
- Prefer `emitter.listen(EventClass, [listeners...])` for class-based flows.

## Rules

- Listener names MUST be verb-first by performed action.
- Listener code MUST be idempotent and side-effect oriented.
- Do not use listeners when the work must participate in the same transaction.
- Handle listener errors explicitly with `emitter.onError(...)` or local capture.

## Testing

- Use `emitter.fake()` and assert the event class or name was emitted.
