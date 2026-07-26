import { sql } from '@vritti/api-sdk/drizzle-orm';
import {
  bigint,
  check,
  index,
  jsonb,
  pgPolicy,
  timestamp,
  unique,
  uuid,
  varchar,
} from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { goodsReceiptItems } from './goods-receipt-items';
import { inventoryItemLots } from './inventory-item-lots';

export const goodsReceiptLots = commerceSchema.table(
  'goods_receipt_lots',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    siteId: uuid('site_id').notNull().default(sql.raw("cast(current_setting('app.site_id') as uuid)")),
    goodsReceiptItemId: uuid('goods_receipt_item_id')
      .notNull()
      .references(() => goodsReceiptItems.id, { onDelete: 'cascade' }),
    lotNumber: varchar('lot_number', { length: 100 }).notNull(),
    manufacturingDate: timestamp('manufacturing_date', { withTimezone: true, mode: 'string' }),
    expiryDate: timestamp('expiry_date', { withTimezone: true, mode: 'string' }).notNull(),
    resolvedLotId: uuid('resolved_lot_id').references(() => inventoryItemLots.id, { onDelete: 'set null' }),
    // Per-batch printed MRP (BU minor units); wins over the GR item's mrp at publish.
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

export type GoodsReceiptLot = typeof goodsReceiptLots.$inferSelect;
export type NewGoodsReceiptLot = typeof goodsReceiptLots.$inferInsert;
