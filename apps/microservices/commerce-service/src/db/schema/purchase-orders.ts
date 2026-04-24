import { sql } from '@vritti/api-sdk/drizzle-orm';
import { bigint, date, decimal, index, pgPolicy, text, timestamp, unique, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { coreSchema } from './core-schema';
import { purchaseOrderStatusEnum } from './enums';
import { inventoryItems } from './inventory-items';
import { suppliers } from './suppliers';

export const purchaseOrders = coreSchema.table(
  'purchase_orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql`current_setting('app.org_id')::uuid`),
    businessUnitId: uuid('business_unit_id').notNull().default(sql`current_setting('app.bu_id')::uuid`),
    supplierId: uuid('supplier_id')
      .notNull()
      .references(() => suppliers.id),
    poNumber: varchar('po_number', { length: 50 }).notNull(),
    status: purchaseOrderStatusEnum('status').notNull().default('DRAFT'),
    currencyCode: varchar('currency_code', { length: 3 }).notNull(),
    conversionRate: decimal('conversion_rate', { precision: 18, scale: 6 }).notNull().default('1'),
    orderDate: date('order_date', { mode: 'string' }).notNull(),
    expectedBy: timestamp('expected_by', { withTimezone: true, mode: 'string' }),
    timezone: varchar('timezone', { length: 50 }).notNull().default(sql`current_setting('app.bu_timezone')::text`),
    notes: text('notes'),
    totalAmount: bigint('total_amount', { mode: 'number' }).notNull().default(0),
    createdBy: uuid('created_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_purchase_orders_org_po_number').on(table.organizationId, table.poNumber),
    index('idx_purchase_orders_bu').on(table.organizationId, table.businessUnitId),
    index('idx_purchase_orders_supplier').on(table.supplierId),
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

export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type NewPurchaseOrder = typeof purchaseOrders.$inferInsert;

export const purchaseOrderItems = coreSchema.table(
  'purchase_order_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql`current_setting('app.org_id')::uuid`),
    purchaseOrderId: uuid('purchase_order_id')
      .notNull()
      .references(() => purchaseOrders.id, { onDelete: 'cascade' }),
    inventoryItemId: uuid('inventory_item_id')
      .notNull()
      .references(() => inventoryItems.id),
    orderedQuantity: decimal('ordered_quantity', { precision: 12, scale: 3 }).notNull(),
    receivedQuantity: decimal('received_quantity', { precision: 12, scale: 3 }).notNull().default('0'),
    supplierUnitPrice: bigint('supplier_unit_price', { mode: 'number' }).notNull(),
    unitPrice: bigint('unit_price', { mode: 'number' }).notNull(),
    totalPrice: bigint('total_price', { mode: 'number' }).notNull(),
  },
  (table) => [
    unique('uq_purchase_order_items_po_item').on(table.purchaseOrderId, table.inventoryItemId),
    index('idx_purchase_order_items_po').on(table.purchaseOrderId),
  ],
);

export type PurchaseOrderItem = typeof purchaseOrderItems.$inferSelect;
export type NewPurchaseOrderItem = typeof purchaseOrderItems.$inferInsert;
