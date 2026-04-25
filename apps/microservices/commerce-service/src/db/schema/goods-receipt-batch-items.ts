import { sql } from '@vritti/api-sdk/drizzle-orm';
import { decimal, index, pgPolicy, timestamp, uuid } from '@vritti/api-sdk/drizzle-pg-core';
import { coreSchema } from './core-schema';
import { goodsReceiptBatches } from './goods-receipt-batches';

export const goodsReceiptBatchItems = coreSchema.table(
  'goods_receipt_batch_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql`current_setting('app.org_id')::uuid`),
    businessUnitId: uuid('business_unit_id').notNull().default(sql`current_setting('app.bu_id')::uuid`),
    goodsReceiptBatchId: uuid('goods_receipt_batch_id')
      .notNull()
      .references(() => goodsReceiptBatches.id, { onDelete: 'cascade' }),
    quantity: decimal('quantity', { precision: 12, scale: 3 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('idx_goods_receipt_batch_items_batch').on(table.goodsReceiptBatchId),
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

export type GoodsReceiptBatchItem = typeof goodsReceiptBatchItems.$inferSelect;
export type NewGoodsReceiptBatchItem = typeof goodsReceiptBatchItems.$inferInsert;
