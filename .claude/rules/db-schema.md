---
description: Drizzle schema + RLS policy conventions for commerce-service tables
paths:
  - "apps/microservices/commerce-service/src/db/schema/**/*.ts"
---

# Commerce Schema Files

Every table lives in its own file under `src/db/schema/`, is registered in `index.ts`, and is built
with `commerceSchema.table(...)`. The shared scope/RLS helpers live in `workspace-scope.ts` — that
file is the single source of truth for tenancy and workspace rules. Nothing in it should be
re-implemented inline.

## 1. Every table carries `organizationIdColumn`

```typescript
import { organizationIdColumn } from './workspace-scope';

organizationId: organizationIdColumn,   // notNull + defaults from app.org_id
```

Never redeclare `uuid('organization_id').notNull().default(...)` by hand — the default expression is
part of the tenancy contract.

## 2. Pick the policy helper from where the table's scope lives

| The table… | Columns | Policies |
|---|---|---|
| owns its workspace scope, and parent workspaces should see child rows | `...workspaceScopeColumns` | `...workspaceHierarchyPolicies()` |
| owns its workspace scope, reach is upward only | `...workspaceScopeColumns` | `...workspaceScopePolicies('<name>')` |
| has no scope columns — scope derived from an ancestor that does | — | `...scopeFromOwnerPolicies({ … })` |
| is org-wide with no workspace dimension at all | — | `orgIsolationPolicy()` |

`workspaceHierarchyPolicies` is bidirectional: an LE workspace also sees the rows its sites own.
`workspaceScopePolicies` is ancestor-or-self only. Choose on that question, not on habit.

Each helper already includes `orgIsolationPolicy()`. Do not add it again alongside them.

## 3. Reach cascades; ownership does not

This is the rule behind `scopeFromOwnerPolicies`, and the bug it was written to fix.

A child's SELECT policy can just prove the parent row exists — the parent's own `reach_read` policy
filters that subquery, so reach flows down for free at any depth.

A child's **write** policy sees the same thing, which means it only ever proves *reach*, never
*ownership*. So every tier must join all the way up to the scoped ancestor and test ownership
itself. Otherwise a site can delete the variants of an org-owned offering it can merely see.

```typescript
// direct child of a scoped table
...scopeFromOwnerPolicies({ owner: offerings, fk: table.offeringId }),

// grandchild — list each intermediate's upward link, nearest parent first
...scopeFromOwnerPolicies({
  owner: offerings,
  fk: table.variantId,
  through: [{ table: offeringVariants, fk: (parent) => parent.offeringId }],
}),

// great-grandchild and beyond — same list, one more entry
...scopeFromOwnerPolicies({
  owner: offerings,
  fk: table.bomLineId,
  through: [
    { table: offeringBom, fk: (parent) => parent.variantId },
    { table: offeringVariants, fk: (parent) => parent.offeringId },
  ],
}),
```

`owner` is always the nearest ancestor that actually **has** `legal_entity_id` / `site_id` — not the
direct parent. If an intermediate gains scope columns, it becomes the owner and the chain collapses.

When a table has several FKs that could reach a scoped ancestor, the path is a **choice**. Pick the
shortest one that terminates at a scoped table.

## 4. Never hardcode a table name, a column name, or a policy body

```typescript
// WRONG — unchecked strings; a typo only fails at migration time
...scopeFromOwnerPolicies({ owner: 'commerce.offerings', fk: 'offering_id' }),
pgPolicy('org_isolation', { for: 'all', using: sql`organization_id = ...` }),

// CORRECT — TypeScript checks every reference
...scopeFromOwnerPolicies({ owner: offerings, fk: table.offeringId }),
orgIsolationPolicy(),
```

`through` takes `{ table, fk }` where `fk` is a **callback**. The callback receives that exact table,
so the column is type-checked against it and a column from a different table cannot be named by
accident.

The same rule applies to raw SQL anywhere in the codebase: interpolate the table object
(`FROM ${goodsReceiptLines}` — it carries its own schema), never `commerce.<table>` as text.

## 5. A table with only restrictive policies is sealed

Postgres computes `allowed = (OR of permissive) AND (AND of restrictive)`. Zero permissive policies
means zero rows pass, for everyone. `orgIsolationPolicy()` is the permissive base every other policy
narrows — if it is missing, the table is either fully open (RLS never enabled) or fully closed.

Known debt, do NOT drive-by fix: `document-counters`, `inventory-item-ledger`, `invoice-items`,
`payments`, `tax-rates` have no policy helper, and 29 legacy tables carry permissive-only `site_*`
policies that OR with `org_isolation` and therefore restrict nothing. Both are deferred to the
LE/SITE_GROUP re-scoping.

## 6. Constraint naming

```typescript
unique('uq_<table>_<cols>')
index('idx_<table>_<cols>')
check('<table>_<what>_chk', sql`…`)
codeCheck('<table>_code_chk', table.code)     // never hand-roll the code regex
```

Use `.nullsNotDistinct()` on a unique that includes nullable scope columns — otherwise two org-owned
rows with the same name both pass.

## 7. Type exports

```typescript
export type Offering = typeof offerings.$inferSelect;
export type NewOffering = typeof offerings.$inferInsert;
```

Always both, always immediately after the table.

## 8. No comments on tables, columns, types, or enums

The name is the documentation. A `//` comment is warranted only above a helper whose behaviour is
genuinely non-obvious (see `workspace-scope.ts`), never on a column or a type alias.

## 9. Migrations come from `generate`, never by hand

```bash
pnpm db:generate            # structure changes
pnpm db:generate:custom     # data-only SQL
```

Never author or edit a `migration.sql`. A structure change plus a data change is **two** migrations —
`--custom` copies the previous snapshot forward and so cannot carry a schema change.

`db:generate` is interactive when a rename is ambiguous. It cannot run from a non-TTY, so it must be
run by hand in a terminal.

## 10. Verify the generated policy SQL before it reaches a database

Drizzle diffs against its own snapshot, not against the live database. Before migrating a policy
change, render what the schema actually produces and compare it to `pg_policies`:

```typescript
import { PgDialect, getTableConfig } from 'drizzle-orm/pg-core';

const dialect = new PgDialect();
for (const p of getTableConfig(offeringBom).policies) {
  console.log(p.name, dialect.sqlToQuery(p.using ?? p.withCheck).sql);
}
```

A refactor that is meant to be behaviour-preserving must produce **byte-identical** policy bodies. If
`db:generate` emits DDL you did not expect, the schema changed in a way you did not intend.

There is no local `psql`. To read the live side, run SQL through the repo's own helper on the owner
connection:

```bash
infisical run --env=apw1-local --path=/commerce-service -- node ../../../tools/run-sql.cjs <file.sql>
```

Note that `ALTER POLICY` can change the body and the roles but **not** `AS RESTRICTIVE` or the `FOR`
command — a change to either forces a drop and recreate.
