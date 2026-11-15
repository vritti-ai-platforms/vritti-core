import { sql } from '@vritti/api-sdk/drizzle-orm';
import {
  check,
  codeCheck,
  decimal,
  index,
  jsonb,
  timestamp,
  unique,
  uuid,
  varchar,
} from '@vritti/api-sdk/drizzle-pg-core';
import { categories } from './categories';
import { commerceSchema } from './commerce-schema';
import { inventoryItemTypeEnum, inventoryPickStrategyEnum, inventoryTrackingEnum } from './enums';
import { taxClasses } from './tax-classes';
import { uom } from './uom';
import { organizationIdColumn, orgIsolationPolicy } from './workspace-scope';

export const inventoryItems = commerceSchema.table(
  'inventory_items',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: organizationIdColumn(),
    name: varchar('name', { length: 255 }).notNull(),
    sku: varchar('sku', { length: 100 }).notNull(),
    type: inventoryItemTypeEnum('type').notNull(),
    tracking: inventoryTrackingEnum('tracking').notNull().default('LOT'),
    pickStrategy: inventoryPickStrategyEnum('pick_strategy').notNull().default('NONE'),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id),
    description: varchar('description', { length: 500 }),
    uomId: uuid('uom_id')
      .notNull()
      .references(() => uom.id),
    hsnCode: varchar('hsn_code', { length: 20 }),
    taxClassId: uuid('tax_class_id')
      .notNull()
      .references(() => taxClasses.id),
    metadata: jsonb('metadata').notNull().default({}),
    weight: decimal('weight', { precision: 12, scale: 3, mode: 'number' }),
    volume: decimal('volume', { precision: 12, scale: 3, mode: 'number' }),
    length: decimal('length', { precision: 12, scale: 3, mode: 'number' }),
    width: decimal('width', { precision: 12, scale: 3, mode: 'number' }),
    height: decimal('height', { precision: 12, scale: 3, mode: 'number' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_inventory_items_org_sku').on(table.organizationId, table.sku),
    codeCheck('inventory_items_sku_chk', table.sku),
    check(
      'inventory_items_measures_chk',
      sql`(${table.weight} IS NULL OR ${table.weight} > 0)
        AND (${table.volume} IS NULL OR ${table.volume} > 0)
        AND (${table.length} IS NULL OR ${table.length} > 0)
        AND (${table.width} IS NULL OR ${table.width} > 0)
        AND (${table.height} IS NULL OR ${table.height} > 0)`,
    ),
    index('idx_inventory_items_category').on(table.categoryId),
    index('idx_inventory_items_tax_class').on(table.taxClassId),
    index('idx_inventory_items_feed').on(table.organizationId, table.createdAt.desc(), table.id),
    index('idx_inventory_items_name').on(table.organizationId, table.name, table.id),
    index('idx_inventory_items_sku_sort').on(table.organizationId, table.sku, table.id),
    orgIsolationPolicy(),
  ],
);

export type InventoryItem = typeof inventoryItems.$inferSelect;
export type NewInventoryItem = typeof inventoryItems.$inferInsert;
