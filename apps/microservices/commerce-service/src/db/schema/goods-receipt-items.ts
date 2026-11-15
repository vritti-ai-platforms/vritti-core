import { sql } from '@vritti/api-sdk/drizzle-orm';
import { decimal, index, jsonb, timestamp, unique, uuid } from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { goodsReceipts } from './goods-receipts';
import { inboundDeliveryLines } from './inbound-deliveries';
import { inventoryItems } from './inventory-items';
import { purchaseOrderItems } from './purchase-orders';
import { uom } from './uom';
import { organizationIdColumn, scopeFromOwnerPolicies, siteIdColumn } from './workspace-scope';

export const goodsReceiptItems = commerceSchema.table(
  'goods_receipt_items',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: organizationIdColumn(),
    siteId: siteIdColumn().notNull(),
    goodsReceiptId: uuid('goods_receipt_id')
      .notNull()
      .references(() => goodsReceipts.id, { onDelete: 'cascade' }),
    inventoryItemId: uuid('inventory_item_id')
      .notNull()
      .references(() => inventoryItems.id),
    uomId: uuid('uom_id')
      .notNull()
      .references(() => uom.id),
    purchaseOrderItemId: uuid('purchase_order_item_id')
      .notNull()
      .references(() => purchaseOrderItems.id),
    inboundDeliveryLineId: uuid('inbound_delivery_line_id')
      .notNull()
      .references(() => inboundDeliveryLines.id, { onDelete: 'restrict' }),
    receivedQty: decimal('received_qty', { precision: 12, scale: 3, mode: 'number' }).notNull().default(0),
    rejectedQuantity: decimal('rejected_quantity', { precision: 12, scale: 3, mode: 'number' }).notNull().default(0),
    receivedPrimaryQty: decimal('received_primary_qty', { precision: 12, scale: 3, mode: 'number' })
      .notNull()
      .default(0),
    rejectedPrimaryQty: decimal('rejected_primary_qty', { precision: 12, scale: 3, mode: 'number' })
      .notNull()
      .default(0),
    metadata: jsonb('metadata').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_goods_receipt_items_gr_po_item').on(table.goodsReceiptId, table.purchaseOrderItemId),
    index('idx_goods_receipt_items_po_item').on(table.purchaseOrderItemId),
    index('idx_goods_receipt_items_delivery_line').on(table.inboundDeliveryLineId),
    index('idx_goods_receipt_items_receipt').on(table.goodsReceiptId),
    index('idx_goods_receipt_items_inventory').on(table.inventoryItemId),
    index('idx_goods_receipt_items_uom').on(table.uomId),
    ...scopeFromOwnerPolicies({ owner: goodsReceipts, fk: table.goodsReceiptId, ownerIs: 'siteDocument' }),
  ],
);

export type GoodsReceiptItem = typeof goodsReceiptItems.$inferSelect;
export type NewGoodsReceiptItem = typeof goodsReceiptItems.$inferInsert;
