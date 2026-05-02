import { sql } from '@vritti/api-sdk/drizzle-orm';
import { boolean, decimal, index, jsonb, pgPolicy, timestamp, uuid } from '@vritti/api-sdk/drizzle-pg-core';
import { coreSchema } from './core-schema';
import { goodsReceiptItems } from './goods-receipt-items';
import { goodsReceiptLots } from './goods-receipt-lots';
import { inventoryItemQuants } from './inventory-item-quants';
import { storageLocations } from './storage-locations';

export const goodsReceiptLines = coreSchema.table(
  'goods_receipt_lines',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("current_setting('app.org_id')::uuid")),
    businessUnitId: uuid('business_unit_id').notNull().default(sql.raw("current_setting('app.bu_id')::uuid")),
    goodsReceiptItemId: uuid('goods_receipt_item_id')
      .notNull()
      .references(() => goodsReceiptItems.id, { onDelete: 'cascade' }),
    // null when the parent item.tracking = 'quantity'; required for 'lot' or 'serial'
    goodsReceiptLotId: uuid('goods_receipt_lot_id').references(() => goodsReceiptLots.id, { onDelete: 'cascade' }),
    locationId: uuid('location_id')
      .notNull()
      .references(() => storageLocations.id),
    quantity: decimal('quantity', { precision: 12, scale: 3 }).notNull(),
    resolvedQuantId: uuid('resolved_quant_id').references(() => inventoryItemQuants.id, { onDelete: 'set null' }),
    isBalanced: boolean('is_balanced').notNull().default(true),
    metadata: jsonb('metadata').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('idx_goods_receipt_lines_item').on(table.goodsReceiptItemId),
    index('idx_goods_receipt_lines_lot').on(table.goodsReceiptLotId),
    index('idx_goods_receipt_lines_location').on(table.locationId),
    index('idx_goods_receipt_lines_resolved').on(table.resolvedQuantId),
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

export type GoodsReceiptLine = typeof goodsReceiptLines.$inferSelect;
export type NewGoodsReceiptLine = typeof goodsReceiptLines.$inferInsert;
