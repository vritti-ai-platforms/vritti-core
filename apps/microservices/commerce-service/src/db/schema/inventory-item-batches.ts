import { date, decimal, index, pgPolicy, timestamp, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { sql } from '@vritti/api-sdk/drizzle-orm';
import { coreSchema } from './core-schema';
import { inventoryItems } from './inventory-items';
import { storageLocations } from './storage-locations';
import { goodsReceiptItems } from './goods-receipts';

export const inventoryItemBatches = coreSchema.table(
  'inventory_item_batches',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql`current_setting('app.org_id')::uuid`),
    businessUnitId: uuid('business_unit_id').notNull().default(sql`current_setting('app.bu_id')::uuid`),
    inventoryItemId: uuid('inventory_item_id').notNull().references(() => inventoryItems.id, { onDelete: 'cascade' }),
    locationId: uuid('location_id').notNull().references(() => storageLocations.id),
    batchNumber: varchar('batch_number', { length: 100 }),
    quantity: decimal('quantity', { precision: 12, scale: 3 }).notNull().default('0'),
    reservedQuantity: decimal('reserved_quantity', { precision: 12, scale: 3 }).notNull().default('0'),
    manufacturingDate: date('manufacturing_date'),
    expiryDate: date('expiry_date'),
    goodsReceiptItemId: uuid('goods_receipt_item_id').references(() => goodsReceiptItems.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('idx_inventory_item_batches_item').on(table.inventoryItemId),
    index('idx_inventory_item_batches_location').on(table.locationId),
    index('idx_inventory_item_batches_item_location').on(table.inventoryItemId, table.locationId),
    index('idx_inventory_item_batches_expiry').on(table.expiryDate),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = current_setting('app.org_id', true)::uuid`,
    }),
    pgPolicy('bu_ancestor_read', {
      for: 'select',
      using: sql`business_unit_id = ANY(current_setting('app.bu_ancestor_ids', true)::uuid[])`,
    }),
    pgPolicy('bu_write', {
      for: 'insert',
      withCheck: sql`business_unit_id = current_setting('app.bu_id', true)::uuid`,
    }),
    pgPolicy('bu_update', {
      for: 'update',
      using: sql`business_unit_id = current_setting('app.bu_id', true)::uuid`,
    }),
    pgPolicy('bu_delete', {
      for: 'delete',
      using: sql`business_unit_id = current_setting('app.bu_id', true)::uuid`,
    }),
  ],
);

export type InventoryItemBatch = typeof inventoryItemBatches.$inferSelect;
export type NewInventoryItemBatch = typeof inventoryItemBatches.$inferInsert;
