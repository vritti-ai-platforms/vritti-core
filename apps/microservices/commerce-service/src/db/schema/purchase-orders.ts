import { sql } from '@vritti/api-sdk/drizzle-orm';
import {
  bigint,
  boolean,
  date,
  decimal,
  index,
  pgPolicy,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { exchangeRateTypeEnum, purchaseOrderStatusEnum } from './enums';
import { inventoryItems } from './inventory-items';
import { suppliers } from './suppliers';
import { uom } from './uom';
import { organizationIdColumn, orgIsolationPolicy } from './workspace-scope';

export const purchaseOrders = commerceSchema.table(
  'purchase_orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: organizationIdColumn,
    siteId: uuid('site_id').notNull().default(sql.raw("cast(current_setting('app.site_id') as uuid)")),
    supplierId: uuid('supplier_id')
      .notNull()
      .references(() => suppliers.id),
    poNumber: varchar('po_number', { length: 50 }).notNull(),
    status: purchaseOrderStatusEnum('status').notNull().default('DRAFT'),
    currencyCode: varchar('currency_code', { length: 3 }).notNull(),
    exchangeRate: decimal('exchange_rate', { precision: 18, scale: 6, mode: 'number' }).default(1),
    exchangeRateType: exchangeRateTypeEnum('exchange_rate_type').notNull().default('FIXED'),
    orderDate: date('order_date', { mode: 'string' }).notNull(),
    expectedBy: timestamp('expected_by', { withTimezone: true, mode: 'string' }),
    timezone: varchar('timezone', { length: 50 })
      .notNull()
      .default(sql.raw("cast(current_setting('app.site_timezone') as text)")),
    notes: text('notes'),
    totalAmount: bigint('total_amount', { mode: 'bigint' }).notNull().default(0n),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_purchase_orders_org_po_number').on(table.organizationId, table.poNumber),
    index('idx_purchase_orders_site').on(table.organizationId, table.siteId),
    index('idx_purchase_orders_supplier').on(table.supplierId),
    orgIsolationPolicy(),
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

export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type NewPurchaseOrder = typeof purchaseOrders.$inferInsert;

export const purchaseOrderItems = commerceSchema.table(
  'purchase_order_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: organizationIdColumn,
    purchaseOrderId: uuid('purchase_order_id')
      .notNull()
      .references(() => purchaseOrders.id, { onDelete: 'cascade' }),
    inventoryItemId: uuid('inventory_item_id')
      .notNull()
      .references(() => inventoryItems.id),
    uomId: uuid('uom_id')
      .notNull()
      .references(() => uom.id, { onDelete: 'restrict' }),
    uomQty: decimal('uom_qty', { precision: 12, scale: 3, mode: 'number' }).notNull(),
    receivedQuantity: decimal('received_quantity', { precision: 12, scale: 3, mode: 'number' }).notNull().default(0),
    schemeBuyQty: decimal('scheme_buy_qty', { precision: 12, scale: 3, mode: 'number' }),
    schemeFreeQty: decimal('scheme_free_qty', { precision: 12, scale: 3, mode: 'number' }),
    hasScheme: boolean('has_scheme').notNull().default(false),
    freeQty: decimal('free_qty', { precision: 12, scale: 3, mode: 'number' }).notNull().default(0),
    primaryUomQty: decimal('primary_uom_qty', { precision: 12, scale: 3, mode: 'number' }).notNull(),
    primaryUomUnitPrice: bigint('primary_uom_unit_price', { mode: 'bigint' }).notNull(),
    unitPrice: bigint('unit_price', { mode: 'bigint' }).notNull(),
    totalPrice: bigint('total_price', { mode: 'bigint' }).notNull(),
    currencyCode: varchar('currency_code', { length: 3 }).notNull(),
  },
  (table) => [
    unique('uq_purchase_order_items_po_item_uom').on(table.purchaseOrderId, table.inventoryItemId, table.uomId),
    index('idx_purchase_order_items_po').on(table.purchaseOrderId),
  ],
);

export type PurchaseOrderItem = typeof purchaseOrderItems.$inferSelect;
export type NewPurchaseOrderItem = typeof purchaseOrderItems.$inferInsert;
