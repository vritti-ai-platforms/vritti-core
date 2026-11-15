import { sql } from '@vritti/api-sdk/drizzle-orm';
import { bigint, check, index, jsonb, timestamp, unique, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { goodsReceiptItems } from './goods-receipt-items';
import { goodsReceipts } from './goods-receipts';
import { inventoryItemLots } from './inventory-item-lots';
import { organizationIdColumn, scopeFromOwnerPolicies, siteIdColumn } from './workspace-scope';

export const goodsReceiptLots = commerceSchema.table(
  'goods_receipt_lots',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: organizationIdColumn(),
    siteId: siteIdColumn().notNull(),
    goodsReceiptItemId: uuid('goods_receipt_item_id')
      .notNull()
      .references(() => goodsReceiptItems.id, { onDelete: 'cascade' }),
    lotNumber: varchar('lot_number', { length: 100 }).notNull(),
    manufacturingDate: timestamp('manufacturing_date', { withTimezone: true, mode: 'string' }),
    expiryDate: timestamp('expiry_date', { withTimezone: true, mode: 'string' }).notNull(),
    resolvedLotId: uuid('resolved_lot_id').references(() => inventoryItemLots.id, { onDelete: 'set null' }),
    mrp: bigint('mrp', { mode: 'bigint' }),
    metadata: jsonb('metadata').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_goods_receipt_lots_item_lot').on(table.goodsReceiptItemId, table.lotNumber),
    index('idx_goods_receipt_lots_item').on(table.goodsReceiptItemId),
    index('idx_goods_receipt_lots_resolved').on(table.resolvedLotId),
    check(
      'ck_goods_receipt_lots_expiry_after_mfg',
      sql`${table.manufacturingDate} IS NULL OR ${table.expiryDate} > ${table.manufacturingDate}`,
    ),
    ...scopeFromOwnerPolicies({
      owner: goodsReceipts,
      fk: table.goodsReceiptItemId,
      through: [{ table: goodsReceiptItems, fk: (items) => items.goodsReceiptId }],
      ownerIs: 'siteDocument',
    }),
  ],
);

export type GoodsReceiptLot = typeof goodsReceiptLots.$inferSelect;
export type NewGoodsReceiptLot = typeof goodsReceiptLots.$inferInsert;
