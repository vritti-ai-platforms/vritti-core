import { sql } from '@vritti/api-sdk/drizzle-orm';
import { index, jsonb, text, timestamp, unique, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { goodsReceiptStatusEnum } from './enums';
import { inboundDeliveries } from './inbound-deliveries';
import { suppliers } from './suppliers';
import { LE_GUC, organizationIdColumn, siteDocumentPolicies } from './workspace-scope';

export const goodsReceipts = commerceSchema.table(
  'goods_receipts',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: organizationIdColumn,
    legalEntityId: uuid('legal_entity_id').notNull().default(sql.raw(LE_GUC)),
    siteId: uuid('site_id').notNull().default(sql.raw("cast(current_setting('app.site_id') as uuid)")),
    supplierId: uuid('supplier_id')
      .notNull()
      .references(() => suppliers.id),
    grNumber: varchar('gr_number', { length: 50 }).notNull(),
    status: goodsReceiptStatusEnum('status').notNull().default('DRAFT'),
    inboundDeliveryId: uuid('inbound_delivery_id')
      .notNull()
      .references(() => inboundDeliveries.id),
    receivedDate: timestamp('received_date', { withTimezone: true, mode: 'string' }).notNull(),
    notes: text('notes'),
    metadata: jsonb('metadata').notNull().default({}),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique('uq_goods_receipts_org_gr_number').on(table.organizationId, table.grNumber),
    index('idx_goods_receipts_supplier').on(table.supplierId),
    index('idx_goods_receipts_inbound_delivery').on(table.inboundDeliveryId),
    index('idx_goods_receipts_site').on(table.organizationId, table.siteId),
    ...siteDocumentPolicies(),
  ],
);

export type GoodsReceipt = typeof goodsReceipts.$inferSelect;
export type NewGoodsReceipt = typeof goodsReceipts.$inferInsert;
