import { sql } from '@vritti/api-sdk/drizzle-orm';
import { decimal, index, pgPolicy, text, timestamp, unique, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { coreSchema } from './core-schema';
import { goodsReceiptStatusEnum } from './enums';
import { inventoryItems } from './inventory-items';
import { purchaseOrderItems, purchaseOrders } from './purchase-orders';
import { suppliers } from './suppliers';

export const goodsReceipts = coreSchema.table(
  'goods_receipts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql`current_setting('app.org_id')::uuid`),
    businessUnitId: uuid('business_unit_id').notNull().default(sql`current_setting('app.bu_id')::uuid`),
    supplierId: uuid('supplier_id')
      .notNull()
      .references(() => suppliers.id),
    grNumber: varchar('gr_number', { length: 50 }).notNull(),
    status: goodsReceiptStatusEnum('status').notNull().default('DRAFT'),
    purchaseOrderId: uuid('purchase_order_id').references(() => purchaseOrders.id),
    receivedBy: uuid('received_by'),
    receivedDate: timestamp('received_date', { withTimezone: true, mode: 'string' }).notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique('uq_goods_receipts_bu_gr_number').on(table.businessUnitId, table.grNumber),
    index('idx_goods_receipts_supplier').on(table.supplierId),
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
    goodsReceiptId: uuid('goods_receipt_id')
      .notNull()
      .references(() => goodsReceipts.id, { onDelete: 'cascade' }),
    purchaseOrderItemId: uuid('purchase_order_item_id').references(() => purchaseOrderItems.id),
    inventoryItemId: uuid('inventory_item_id')
      .notNull()
      .references(() => inventoryItems.id),
    acceptedQuantity: decimal('accepted_quantity', { precision: 12, scale: 3 }).notNull(),
    rejectedQuantity: decimal('rejected_quantity', { precision: 12, scale: 3 }).notNull().default('0'),
    rejectionReason: text('rejection_reason'),
    batchNumber: varchar('batch_number', { length: 100 }),
    manufacturingDate: timestamp('manufacturing_date', { withTimezone: true, mode: 'string' }),
    expiryDate: timestamp('expiry_date', { withTimezone: true, mode: 'string' }),
  },
  (table) => [
    index('idx_goods_receipt_items_gr').on(table.goodsReceiptId),
    index('idx_goods_receipt_items_inventory').on(table.inventoryItemId),
  ],
);

export type GoodsReceiptItem = typeof goodsReceiptItems.$inferSelect;
export type NewGoodsReceiptItem = typeof goodsReceiptItems.$inferInsert;
