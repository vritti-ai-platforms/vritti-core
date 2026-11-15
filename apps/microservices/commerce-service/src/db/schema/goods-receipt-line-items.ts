import { sql } from '@vritti/api-sdk/drizzle-orm';
import { index, jsonb, timestamp, unique, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { goodsReceiptItems } from './goods-receipt-items';
import { goodsReceiptLines } from './goods-receipt-lines';
import { goodsReceipts } from './goods-receipts';
import { organizationIdColumn, scopeFromOwnerPolicies, siteIdColumn } from './workspace-scope';

export const goodsReceiptLineItems = commerceSchema.table(
  'goods_receipt_line_items',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: organizationIdColumn(),
    siteId: siteIdColumn().notNull(),
    goodsReceiptLineId: uuid('goods_receipt_line_id')
      .notNull()
      .references(() => goodsReceiptLines.id, { onDelete: 'cascade' }),
    serialNumber: varchar('serial_number', { length: 100 }).notNull(),
    metadata: jsonb('metadata').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_goods_receipt_line_items_line_serial').on(table.goodsReceiptLineId, table.serialNumber),
    index('idx_goods_receipt_line_items_line').on(table.goodsReceiptLineId),
    ...scopeFromOwnerPolicies({
      owner: goodsReceipts,
      fk: table.goodsReceiptLineId,
      through: [
        { table: goodsReceiptLines, fk: (lines) => lines.goodsReceiptItemId },
        { table: goodsReceiptItems, fk: (items) => items.goodsReceiptId },
      ],
      ownerIs: 'siteDocument',
    }),
  ],
);

export type GoodsReceiptLineItem = typeof goodsReceiptLineItems.$inferSelect;
export type NewGoodsReceiptLineItem = typeof goodsReceiptLineItems.$inferInsert;
