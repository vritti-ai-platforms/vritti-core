import { sql } from '@vritti/api-sdk/drizzle-orm';
import {
  boolean,
  codeCheck,
  index,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { costCategoryKindEnum } from './enums';
import { organizationIdColumn, orgIsolationPolicy } from './workspace-scope';

export const costCategories = commerceSchema.table(
  'cost_categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: organizationIdColumn,
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
    codeCheck('cost_categories_code_chk', table.code),
    uniqueIndex('uq_cost_categories_org_kind_item').on(table.organizationId).where(sql`${table.kind} = 'ITEM'`),
    index('idx_cost_categories_org').on(table.organizationId),
    index('idx_cost_categories_kind').on(table.kind),
    orgIsolationPolicy(),
  ],
);

export type CostCategory = typeof costCategories.$inferSelect;
export type NewCostCategory = typeof costCategories.$inferInsert;
