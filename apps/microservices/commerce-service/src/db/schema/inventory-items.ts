import { sql } from '@vritti/api-sdk/drizzle-orm';
import {
  boolean,
  codeCheck,
  index,
  jsonb,
  pgPolicy,
  timestamp,
  unique,
  uuid,
  varchar,
} from '@vritti/api-sdk/drizzle-pg-core';
import { categories } from './categories';
import { coreSchema } from './core-schema';
import { inventoryItemTypeEnum, inventoryPickStrategyEnum, inventoryTrackingEnum } from './enums';
import { uom } from './uom';

export const inventoryItems = coreSchema.table(
  'inventory_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    name: varchar('name', { length: 255 }).notNull(),
    code: varchar('code', { length: 100 }).notNull(),
    type: inventoryItemTypeEnum('type').notNull(),
    tracking: inventoryTrackingEnum('tracking').notNull().default('lot'),
    pickStrategy: inventoryPickStrategyEnum('pick_strategy').notNull().default('none'),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id),
    description: varchar('description', { length: 500 }),
    uomId: uuid('uom_id')
      .notNull()
      .references(() => uom.id),
    hsnCode: varchar('hsn_code', { length: 20 }),
    hasMrp: boolean('has_mrp').notNull().default(false),
    mrpUomId: uuid('mrp_uom_id').references(() => uom.id),
    metadata: jsonb('metadata').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_inventory_items_org_code').on(table.organizationId, table.code),
    codeCheck('inventory_items_code_chk', table.code),
    index('idx_inventory_items_category').on(table.categoryId),
    // Keyset feed: default order (created_at DESC, id ASC) scoped by tenant so the mobile infinite feed
    // scans the index instead of sorting. organization_id leads (RLS filters it by equality).
    index('idx_inventory_items_feed').on(table.organizationId, table.createdAt.desc(), table.id),
    // Companions for the realistic user-sort columns (name, code) — (col, id) keyset order, tenant-led.
    index('idx_inventory_items_name').on(table.organizationId, table.name, table.id),
    index('idx_inventory_items_code_sort').on(table.organizationId, table.code, table.id),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select current_setting('app.org_id', true)::uuid)`,
    }),
  ],
);

export type InventoryItem = typeof inventoryItems.$inferSelect;
export type NewInventoryItem = typeof inventoryItems.$inferInsert;
