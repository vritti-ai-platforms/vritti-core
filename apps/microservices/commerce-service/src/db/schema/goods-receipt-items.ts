import { sql } from '@vritti/api-sdk/drizzle-orm';
import { decimal, index, jsonb, pgPolicy, timestamp, unique, uuid } from '@vritti/api-sdk/drizzle-pg-core';
import { coreSchema } from './core-schema';
import { goodsReceipts } from './goods-receipts';
import { inventoryItems } from './inventory-items';

export const goodsReceiptItems = coreSchema.table(
  'goods_receipt_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("current_setting('app.org_id')::uuid")),
    businessUnitId: uuid('business_unit_id').notNull().default(sql.raw("current_setting('app.bu_id')::uuid")),
    goodsReceiptId: uuid('goods_receipt_id')
      .notNull()
      .references(() => goodsReceipts.id, { onDelete: 'cascade' }),
    inventoryItemId: uuid('inventory_item_id')
      .notNull()
      .references(() => inventoryItems.id),
    rejectedQuantity: decimal('rejected_quantity', { precision: 12, scale: 3 }).notNull().default('0'),
    metadata: jsonb('metadata').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_goods_receipt_items_gr_item').on(table.goodsReceiptId, table.inventoryItemId),
    index('idx_goods_receipt_items_receipt').on(table.goodsReceiptId),
    index('idx_goods_receipt_items_inventory').on(table.inventoryItemId),
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

export type GoodsReceiptItem = typeof goodsReceiptItems.$inferSelect;
export type NewGoodsReceiptItem = typeof goodsReceiptItems.$inferInsert;
