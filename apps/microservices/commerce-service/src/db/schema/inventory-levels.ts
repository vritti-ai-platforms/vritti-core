import { decimal, index, timestamp, unique, uuid } from '@vritti/api-sdk/drizzle-pg-core';
import { sql } from '@vritti/api-sdk/drizzle-orm';
import { coreSchema } from './core-schema';
import { inventoryItems } from './inventory-items';

export const inventoryLevels = coreSchema.table(
  'inventory_levels',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql`current_setting('app.org_id')::uuid`),
    inventoryItemId: uuid('inventory_item_id').notNull().references(() => inventoryItems.id, { onDelete: 'cascade' }),
    businessUnitId: uuid('business_unit_id').notNull().default(sql`current_setting('app.bu_id')::uuid`),
    stockedQuantity: decimal('stocked_quantity', { precision: 12, scale: 3 }).notNull().default('0'),
    reservedQuantity: decimal('reserved_quantity', { precision: 12, scale: 3 }).notNull().default('0'),
    reorderLevel: decimal('reorder_level', { precision: 12, scale: 3 }).notNull().default('0'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_inventory_levels_item_bu').on(table.inventoryItemId, table.businessUnitId),
    index('idx_inventory_levels_item').on(table.inventoryItemId),
    index('idx_inventory_levels_bu').on(table.businessUnitId),
  ],
);

export type InventoryLevel = typeof inventoryLevels.$inferSelect;
export type NewInventoryLevel = typeof inventoryLevels.$inferInsert;
