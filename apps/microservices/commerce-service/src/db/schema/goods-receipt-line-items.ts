import { sql } from '@vritti/api-sdk/drizzle-orm';
import { index, jsonb, pgPolicy, timestamp, unique, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { coreSchema } from './core-schema';
import { goodsReceiptLines } from './goods-receipt-lines';

export const goodsReceiptLineItems = coreSchema.table(
  'goods_receipt_line_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    siteId: uuid('site_id').notNull().default(sql.raw("cast(current_setting('app.site_id') as uuid)")),
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
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select current_setting('app.org_id', true)::uuid)`,
    }),
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

export type GoodsReceiptLineItem = typeof goodsReceiptLineItems.$inferSelect;
export type NewGoodsReceiptLineItem = typeof goodsReceiptLineItems.$inferInsert;
