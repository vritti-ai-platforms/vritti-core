import { sql } from '@vritti/api-sdk/drizzle-orm';
import { boolean, decimal, index, pgPolicy, timestamp, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { coreSchema } from './core-schema';
import { goodsReceiptItems } from './goods-receipt-items';
import { inventoryItems } from './inventory-items';
import { storageLocations } from './storage-locations';

export const goodsReceiptBatches = coreSchema.table(
  'goods_receipt_batches',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql`current_setting('app.org_id')::uuid`),
    businessUnitId: uuid('business_unit_id').notNull().default(sql`current_setting('app.bu_id')::uuid`),
    goodsReceiptLineId: uuid('goods_receipt_line_id')
      .notNull()
      .references(() => goodsReceiptItems.id, { onDelete: 'cascade' }),
    inventoryItemId: uuid('inventory_item_id')
      .notNull()
      .references(() => inventoryItems.id),
    locationId: uuid('location_id')
      .notNull()
      .references(() => storageLocations.id),
    quantity: decimal('quantity', { precision: 12, scale: 3 }).notNull(),
    lotNumber: varchar('lot_number', { length: 100 }),
    isBalanced: boolean('is_balanced').notNull().default(false),
    manufacturingDate: timestamp('manufacturing_date', { withTimezone: true, mode: 'string' }),
    expiryDate: timestamp('expiry_date', { withTimezone: true, mode: 'string' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('idx_goods_receipt_batches_line').on(table.goodsReceiptLineId),
    index('idx_goods_receipt_batches_inventory').on(table.inventoryItemId),
    index('idx_goods_receipt_batches_location').on(table.locationId),
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

export type GoodsReceiptBatch = typeof goodsReceiptBatches.$inferSelect;
export type NewGoodsReceiptBatch = typeof goodsReceiptBatches.$inferInsert;
