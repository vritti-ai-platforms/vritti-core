import { sql } from '@vritti/api-sdk/drizzle-orm';
import {
  boolean,
  index,
  pgPolicy,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from '@vritti/api-sdk/drizzle-pg-core';
import { coreSchema } from './core-schema';
import { costCategoryKindEnum } from './enums';

// Org-scoped (no business_unit_id) — categories live at the organization level so all BUs in the
// org pick from the same list. The `kind` enum is fixed for cross-customer reporting rollups;
// `code` and `name` are configurable per org. `isSystem=true` rows are seeded on org creation and
// can be deactivated but not hard-deleted (FK from inventory_item_costs uses ON DELETE RESTRICT).
export const costCategories = coreSchema.table(
  'cost_categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("current_setting('app.org_id')::uuid")),
    code: varchar('code', { length: 50 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    kind: costCategoryKindEnum('kind').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    isSystem: boolean('is_system').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_cost_categories_org_code').on(table.organizationId, table.code),
    // Exactly one ITEM-kind category per org — the deterministic target for GR publish auto-associate.
    uniqueIndex('uq_cost_categories_org_kind_item').on(table.organizationId).where(sql`${table.kind} = 'ITEM'`),
    index('idx_cost_categories_org').on(table.organizationId),
    index('idx_cost_categories_kind').on(table.kind),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select current_setting('app.org_id', true)::uuid)`,
    }),
  ],
);

export type CostCategory = typeof costCategories.$inferSelect;
export type NewCostCategory = typeof costCategories.$inferInsert;
