import { codeCheck, index, jsonb, timestamp, unique, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { categories } from './categories';
import { commerceSchema } from './commerce-schema';
import { inventoryItemTypeEnum, inventoryPickStrategyEnum, inventoryTrackingEnum } from './enums';
import { uom } from './uom';
import { organizationIdColumn, orgIsolationPolicy } from './workspace-scope';

export const inventoryItems = commerceSchema.table(
  'inventory_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: organizationIdColumn,
    name: varchar('name', { length: 255 }).notNull(),
    sku: varchar('sku', { length: 100 }).notNull(),
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
    metadata: jsonb('metadata').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_inventory_items_org_sku').on(table.organizationId, table.sku),
    codeCheck('inventory_items_sku_chk', table.sku),
    index('idx_inventory_items_category').on(table.categoryId),
    index('idx_inventory_items_feed').on(table.organizationId, table.createdAt.desc(), table.id),
    index('idx_inventory_items_name').on(table.organizationId, table.name, table.id),
    index('idx_inventory_items_sku_sort').on(table.organizationId, table.sku, table.id),
    orgIsolationPolicy(),
  ],
);

export type InventoryItem = typeof inventoryItems.$inferSelect;
export type NewInventoryItem = typeof inventoryItems.$inferInsert;
