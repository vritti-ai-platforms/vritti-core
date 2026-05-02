import { sql } from '@vritti/api-sdk/drizzle-orm';
import { index, jsonb, pgPolicy, text, timestamp, unique, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { coreSchema } from './core-schema';
import { goodsReceiptStatusEnum } from './enums';
import { purchaseOrders } from './purchase-orders';
import { suppliers } from './suppliers';

export const goodsReceipts = coreSchema.table(
  'goods_receipts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("current_setting('app.org_id')::uuid")),
    businessUnitId: uuid('business_unit_id').notNull().default(sql.raw("current_setting('app.bu_id')::uuid")),
    supplierId: uuid('supplier_id')
      .notNull()
      .references(() => suppliers.id),
    grNumber: varchar('gr_number', { length: 50 }).notNull(),
    status: goodsReceiptStatusEnum('status').notNull().default('DRAFT'),
    purchaseOrderId: uuid('purchase_order_id').references(() => purchaseOrders.id),
    receivedBy: uuid('received_by'),
    receivedDate: timestamp('received_date', { withTimezone: true, mode: 'string' }).notNull(),
    notes: text('notes'),
    metadata: jsonb('metadata').notNull().default({}),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique('uq_goods_receipts_org_gr_number').on(table.organizationId, table.grNumber),
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
