# Lucid

## Package and Generators

- If Lucid is missing, install it with `node ace add @adonisjs/lucid`.
- Create the migration before the model.
- Create models with `node ace make:model <ModelName>`.

## Current AdonisJS 7 Default

- Lucid v7 follows a **migrations-first** approach: after every migration run, the assembler scans the database and generates a fresh `database/schema.ts` barrel with one `<Name>Schema` class per table. Columns, primary keys, camelCase names, and Luxon `DateTime` timestamps are inferred directly from the schema.
- Keep generated schema classes untouched. They are rewritten whenever migrations change.
- Domain logic and relations still live in `app/models/*.ts`. Extend the generated schema class from `database/schema.ts` inside the application model, then add relations, scopes, hooks, and typed helpers on top. The generated class owns the column set; the application model owns behavior.
- If the repo still uses classic in-model column decorators, stay consistent within that repo slice. Do not mix both styles in one feature unless migrating intentionally.

```ts
// database/schema.ts — generated, do not edit by hand
import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export class PostsSchema extends BaseModel {
  static table = 'posts'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare title: string

  @column()
  declare content: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime | null

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}
```

```ts
// app/models/post.ts — application model (domain logic)
import { PostsSchema } from '../../database/schema.js'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'

export default class Post extends PostsSchema {
  @belongsTo(() => User)
  declare author: BelongsTo<typeof User>
}
```

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
