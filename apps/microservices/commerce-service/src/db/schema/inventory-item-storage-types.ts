import { sql } from '@vritti/api-sdk/drizzle-orm';
import { check, decimal, index, timestamp, unique, uuid } from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { inventoryItems } from './inventory-items';
import { storageTypes } from './storage-types';
import { uom } from './uom';
import { organizationIdColumn, orgIsolationPolicy } from './workspace-scope';

export const inventoryItemStorageTypes = commerceSchema.table(
  'inventory_item_storage_types',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: organizationIdColumn(),
    inventoryItemId: uuid('inventory_item_id')
      .notNull()
      .references(() => inventoryItems.id, { onDelete: 'cascade' }),
    storageTypeId: uuid('storage_type_id')
      .notNull()
      .references(() => storageTypes.id, { onDelete: 'restrict' }),
    maxQuantity: decimal('max_quantity', { precision: 12, scale: 3, mode: 'number' }).notNull(),
    uomId: uuid('uom_id')
      .notNull()
      .references(() => uom.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_inventory_item_storage_types_item_type').on(table.inventoryItemId, table.storageTypeId),
    check('inventory_item_storage_types_max_quantity_chk', sql`${table.maxQuantity} > 0`),
    index('idx_inventory_item_storage_types_type').on(table.storageTypeId),
    orgIsolationPolicy(),
  ],
);

export type InventoryItemStorageType = typeof inventoryItemStorageTypes.$inferSelect;
export type NewInventoryItemStorageType = typeof inventoryItemStorageTypes.$inferInsert;
