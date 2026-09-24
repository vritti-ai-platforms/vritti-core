---
description: Backend repository layer conventions
paths:
  - "src/**/*.repository.ts"
---

# Backend Repository Files

Repositories handle all database access. They extend `PrimaryBaseRepository` from `@vritti/api-sdk`.

## Pattern

```typescript
@Injectable()
export class SessionRepository extends PrimaryBaseRepository<typeof sessions> {
  constructor(database: PrimaryDatabaseService) {
    super(database, sessions);
  }

  // Custom query methods below
  // Base methods inherited: create(), findById(), update(), delete(), findMany(), findOne()
}
```

## Drizzle ORM conventions

- Use Drizzle operators for custom conditions: `eq`, `and`, `or`, `inArray` from `@vritti/api-sdk/drizzle-orm`
- Use object-based queries for relational data: `{ where: { field: value }, with: { relation: true } }`
- `sql` fragments are allowed for aggregates, scalar subqueries and computed columns. What is NOT
  allowed is a hardcoded schema-qualified table name inside one — interpolate the table object
  (`from ${goodsReceiptLines}`, it carries its own schema), never `commerce.<table>` as text.

## Do not reimplement a base method

`PrimaryBaseRepository` already provides `create`, `findById`, `findOne`, `findMany`,
`findAllAndCount`, `update`, `updateMany`, `delete`, `deleteMany`, `count`, `exists`, `transaction`
and `findForSelect`. A wrapper that only forwards to `this.db.insert(...).values(data).returning()`
is the base `create()` written again by hand — delete it and call the base.

```typescript
// WRONG — this is create()
async insertDimension(data: NewOfferingDimension): Promise<OfferingDimension> {
  const [row] = await this.db.insert(offeringDimensions).values(data).returning();
  return row;
}

// CORRECT
await this.repository.create(data);
```

Inside `transaction(fn)` the callback's writes already run in the transaction — `this.db` resolves
to the pinned transaction via AsyncLocalStorage, so nothing needs a `tx` parameter threaded through.

## One query per action: fold child scalars into the parent select

A scalar derived from a child table belongs in the parent's `selection()` as a subquery, **not** in
a follow-up query. Extract the select shape into a `private selection()` so `findAll`,
`findForTable` and `findById` cannot drift apart.

```typescript
private selection() {
  return {
    ...getColumns(offerings),
    isOwned: ownedByWorkspaceExpression(),
    dimensionCount: this.db.$count(offeringDimensions, eq(offeringDimensions.offeringId, offerings.id)),
    variantCount: this.db.$count(offeringVariants, eq(offeringVariants.offeringId, offerings.id)),
    variantsWithoutBom: this.db.$count(
      offeringVariants,
      and(
        eq(offeringVariants.offeringId, offerings.id),
        notExists(this.db.select({ one: sql`1` }).from(offeringBom)
          .where(eq(offeringBom.variantId, offeringVariants.id))),
      ),
    ),
  };
}

async findById(id: string) {
  const [row] = await this.db.select(this.selection()).from(offerings).where(eq(offerings.id, id)).limit(1);
  return row;
}
```

A child **collection** is different — that stays a batch-Map method keyed by parent id
(`findValuesByTemplateIds`), which is already one query. Do not convert those.

Correlated subqueries run per returned row. At normal page sizes with the FK indexes present this
beats a separate grouped aggregate. Re-measure before assuming it holds for a very large page.

## Report conflicts in one query — never catch 23505

```typescript
// WRONG — insert, catch the unique violation, guess which key it was
try { return await this.create(data); }
catch (e) { if (e.code === '23505') throw new ConflictException(...); throw e; }

// CORRECT — one pass that reports every key independently
async findConflicts(name: string, code: string): Promise<{ nameTaken: boolean; codeTaken: boolean }> {
  const nameMatch = sql`lower(${offerings.name}) = lower(${name}) and ${ownedByWorkspaceExpression()}`;
  const codeMatch = sql`${offerings.code} = ${code}`;
  const [row] = await this.db
    .select({
      nameTaken: sql<boolean>`coalesce(bool_or(${nameMatch}), false)`,
      codeTaken: sql<boolean>`coalesce(bool_or(${codeMatch}), false)`,
    })
    .from(offerings)
    .where(or(nameMatch, codeMatch));
  return row ?? { nameTaken: false, codeTaken: false };
}
```

`bool_or` rather than a row lookup, because one row can collide on both keys. Note the two keys have
different scopes — name is unique per OWNER, code per ORGANIZATION — so they cannot share a
predicate. The database still has the final say on any key whose conflicting row is out of reach.

## Naming

- The lookup by primary key is `findById` — never `findByOwned`, `findOwnedById`, `getById`.
- Plural by key list is `findByIds`. Do **not** call it `findMany` — that collides with the base
  method's signature and fails to compile.
- Cross-table reads live in the repository of the domain that needs them. A domain module never
  injects another domain's repository or module (`domain-modules-no-cross-import`).

## Type exports

```typescript
type User = typeof users.$inferSelect;
type NewUser = typeof users.$inferInsert;
```

## No business logic in repositories

```typescript
// WRONG — validation in repository
async create(data: NewUser) {
  if (!data.email) throw new BadRequestException('Email required');
  return super.create(data);
}

// CORRECT — repository does data access only
async create(data: NewUser) {
  return super.create(data);
}
```

Validation belongs in the service layer.
