# Lucid

## Package and Generators

- If Lucid is missing, install it with `node ace add @adonisjs/lucid`.
- Create the migration before the model.
- Create models with `node ace make:model <ModelName>`.

## Current AdonisJS 7 Default

- Current AdonisJS 7 Lucid docs use generated schema-backed models.
- New models may extend schema classes from `#database/schema`.
- Keep custom logic in the model class, not in generated schema files.
- If the repo still uses classic in-model column decorators, stay consistent within that repo slice. Do not mix both styles in one feature unless migrating intentionally.

## Model Rules

- One model per table or aggregate root.
- Keep relations, scopes, hooks, and rich query helpers on the model.
- Query directly with Lucid. Do not add repository wrappers for normal application code.
- Use `firstOrFail`, `paginate`, `preload`, `withCount`, and scopes instead of hand-rolled helper layers.
- Use Luxon `DateTime` across the model and domain boundary.

## Transaction Rules

- Open transactions inside services, not controllers.
- Prefer managed transactions:

```ts
import db from '@adonisjs/lucid/services/db'

await db.transaction(async (trx) => {
  // perform all writes with trx
})
```

- Use a transaction when:
  - two or more writes must succeed or fail together
  - consistency depends on read-modify-write behavior
  - row locking is required

- Keep transaction scope tight.
- Keep external I/O outside the transaction whenever possible.

## Canonical Order

1. Migration.
2. Model.
3. Relations.
4. Validator.
5. Policy.
6. Service.
7. Transformer.
8. Controller.
9. Routes.
10. Tests.
