import { sql } from '@vritti/api-sdk/drizzle-orm';
import { boolean, decimal, index, jsonb, pgPolicy, timestamp, unique, uuid } from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { goodsReceiptItems } from './goods-receipt-items';
import { goodsReceiptLots } from './goods-receipt-lots';
import { inventoryItemQuants } from './inventory-item-quants';
import { locations } from './locations';
import { organizationIdColumn, orgIsolationPolicy } from './workspace-scope';

export const goodsReceiptLines = commerceSchema.table(
  'goods_receipt_lines',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: organizationIdColumn,
    siteId: uuid('site_id').notNull().default(sql.raw("cast(current_setting('app.site_id') as uuid)")),
    goodsReceiptItemId: uuid('goods_receipt_item_id')
      .notNull()
      .references(() => goodsReceiptItems.id, { onDelete: 'cascade' }),
    goodsReceiptLotId: uuid('goods_receipt_lot_id').references(() => goodsReceiptLots.id, { onDelete: 'cascade' }),
    locationId: uuid('location_id')
      .notNull()
      .references(() => locations.id),
    quantity: decimal('quantity', { precision: 12, scale: 3, mode: 'number' }).notNull(),
    primaryUomQty: decimal('primary_uom_qty', { precision: 12, scale: 3, mode: 'number' }).notNull(),
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
    unique('uq_goods_receipt_lines_item_lot_location')
      .on(table.goodsReceiptItemId, table.goodsReceiptLotId, table.locationId)
      .nullsNotDistinct(),
    orgIsolationPolicy(),
    pgPolicy('site_read', {
      for: 'select',
      using: sql`site_id = (select current_setting('app.site_id', true)::uuid)`,
    }),
    pgPolicy('site_write', {
      for: 'insert',
      withCheck: sql`site_id = (select current_setting('app.site_id', true)::uuid)`,
    }),
    pgPolicy('site_update', {
      for: 'update',
      using: sql`site_id = (select current_setting('app.site_id', true)::uuid)`,
    }),
    pgPolicy('site_delete', {
      for: 'delete',
      using: sql`site_id = (select current_setting('app.site_id', true)::uuid)`,
    }),
  ],
);

export type GoodsReceiptLine = typeof goodsReceiptLines.$inferSelect;
export type NewGoodsReceiptLine = typeof goodsReceiptLines.$inferInsert;
