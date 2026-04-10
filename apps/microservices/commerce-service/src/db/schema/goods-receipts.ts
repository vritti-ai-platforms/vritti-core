import { date, decimal, index, pgPolicy, text, timestamp, uuid } from '@vritti/api-sdk/drizzle-pg-core';
import { sql } from '@vritti/api-sdk/drizzle-orm';
import { coreSchema } from './core-schema';
import { purchaseOrders, purchaseOrderItems } from './purchase-orders';

export const goodsReceipts = coreSchema.table(
  'goods_receipts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql`current_setting('app.org_id')::uuid`),
    businessUnitId: uuid('business_unit_id').notNull().default(sql`current_setting('app.bu_id')::uuid`),
    purchaseOrderId: uuid('purchase_order_id').notNull().references(() => purchaseOrders.id),
    receivedBy: uuid('received_by'),
    receivedDate: date('received_date').notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_goods_receipts_po').on(table.purchaseOrderId),
    index('idx_goods_receipts_bu').on(table.organizationId, table.businessUnitId),
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

export type GoodsReceipt = typeof goodsReceipts.$inferSelect;
export type NewGoodsReceipt = typeof goodsReceipts.$inferInsert;

export const goodsReceiptItems = coreSchema.table(
  'goods_receipt_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql`current_setting('app.org_id')::uuid`),
    goodsReceiptId: uuid('goods_receipt_id').notNull().references(() => goodsReceipts.id, { onDelete: 'cascade' }),
    purchaseOrderItemId: uuid('purchase_order_item_id').notNull().references(() => purchaseOrderItems.id),
    acceptedQuantity: decimal('accepted_quantity', { precision: 12, scale: 3 }).notNull(),
    rejectedQuantity: decimal('rejected_quantity', { precision: 12, scale: 3 }).notNull().default('0'),
    rejectionReason: text('rejection_reason'),
  },
  (table) => [
    index('idx_goods_receipt_items_gr').on(table.goodsReceiptId),
  ],
);

export type GoodsReceiptItem = typeof goodsReceiptItems.$inferSelect;
export type NewGoodsReceiptItem = typeof goodsReceiptItems.$inferInsert;
