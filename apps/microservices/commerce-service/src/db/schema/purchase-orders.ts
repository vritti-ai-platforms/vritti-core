import { sql } from '@vritti/api-sdk/drizzle-orm';
import {
  bigint,
  boolean,
  date,
  decimal,
  index,
  jsonb,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { purchaseOrderInvoiceStatusEnum, purchaseOrderReceiptStatusEnum, purchaseOrderStatusEnum } from './enums';
import { inventoryItems } from './inventory-items';
import { paymentTerms } from './payment-terms';
import { purchases } from './purchases';
import { suppliers } from './suppliers';
import { uom } from './uom';
import {
  organizationIdColumn,
  scopeFromOwnerPolicies,
  siteDocumentColumns,
  siteDocumentPolicies,
} from './workspace-scope';

export const purchaseOrders = commerceSchema.table(
  'purchase_orders',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: organizationIdColumn(),
    ...siteDocumentColumns(),
    supplierId: uuid('supplier_id')
      .notNull()
      .references(() => suppliers.id),
    purchaseId: uuid('purchase_id').references(() => purchases.id, { onDelete: 'restrict' }),
    poNumber: varchar('po_number', { length: 50 }).notNull(),
    status: purchaseOrderStatusEnum('status').notNull().default('DRAFT'),
    receiptStatus: purchaseOrderReceiptStatusEnum('receipt_status').notNull().default('NOT_RECEIVED'),
    invoiceStatus: purchaseOrderInvoiceStatusEnum('invoice_status').notNull().default('NOTHING_TO_INVOICE'),
    paymentTermId: uuid('payment_term_id')
      .notNull()
      .references(() => paymentTerms.id, { onDelete: 'restrict' }),
    currencyCode: varchar('currency_code', { length: 3 }).notNull(),
    exchangeRate: decimal('exchange_rate', { precision: 18, scale: 6, mode: 'number' }).notNull().default(1),
    // Rates from the currencies of lines priced in another of the supplier's currencies into the PO currency,
    // as decimal strings: { "USD": "83.250000" } reads 1 USD = 83.25 in the PO currency
    conversionRates: jsonb('conversion_rates').$type<Record<string, string>>().notNull().default({}),
    orderDate: date('order_date', { mode: 'string' }).notNull(),
    taxDate: date('tax_date', { mode: 'string' }).notNull(),
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
    index('idx_purchase_orders_purchase').on(table.purchaseId),
    ...siteDocumentPolicies(),
  ],
);

export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type NewPurchaseOrder = typeof purchaseOrders.$inferInsert;

export const purchaseOrderItems = commerceSchema.table(
  'purchase_order_items',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: organizationIdColumn(),
    purchaseOrderId: uuid('purchase_order_id')
      .notNull()
      .references(() => purchaseOrders.id, { onDelete: 'cascade' }),
    inventoryItemId: uuid('inventory_item_id')
      .notNull()
      .references(() => inventoryItems.id),
    expectedDeliveryDate: date('expected_delivery_date', { mode: 'string' }).notNull(),
    taxDate: date('tax_date', { mode: 'string' }).notNull(),
    isTaxDateOverridden: boolean('is_tax_date_overridden').notNull().default(false),
    uomId: uuid('uom_id')
      .notNull()
      .references(() => uom.id, { onDelete: 'restrict' }),
    uomQty: decimal('uom_qty', { precision: 12, scale: 3, mode: 'number' }).notNull(),
    schemeBuyQty: decimal('scheme_buy_qty', { precision: 12, scale: 3, mode: 'number' }),
    schemeFreeQty: decimal('scheme_free_qty', { precision: 12, scale: 3, mode: 'number' }),
    hasScheme: boolean('has_scheme').notNull().default(false),
    primaryUomQty: decimal('primary_uom_qty', { precision: 12, scale: 3, mode: 'number' }).notNull(),
    freePrimaryQty: decimal('free_primary_qty', { precision: 12, scale: 3, mode: 'number' }).notNull().default(0),
    receivedPrimaryQty: decimal('received_primary_qty', { precision: 12, scale: 3, mode: 'number' })
      .notNull()
      .default(0),
    rejectedPrimaryQty: decimal('rejected_primary_qty', { precision: 12, scale: 3, mode: 'number' })
      .notNull()
      .default(0),
    invoicedPrimaryQty: decimal('invoiced_primary_qty', { precision: 12, scale: 3, mode: 'number' })
      .notNull()
      .default(0),
    returnedPrimaryQty: decimal('returned_primary_qty', { precision: 12, scale: 3, mode: 'number' })
      .notNull()
      .default(0),
    cancelledPrimaryQty: decimal('cancelled_primary_qty', { precision: 12, scale: 3, mode: 'number' })
      .notNull()
      .default(0),
    primaryUomUnitPrice: bigint('primary_uom_unit_price', { mode: 'bigint' }).notNull(),
    unitPrice: bigint('unit_price', { mode: 'bigint' }).notNull(),
    totalPrice: bigint('total_price', { mode: 'bigint' }).notNull(),
    currencyCode: varchar('currency_code', { length: 3 }).notNull(),
    // The supplier item's own price when it is in another currency than the PO; unit_price is its conversion
    sourceCurrencyCode: varchar('source_currency_code', { length: 3 }),
    sourceUnitPrice: bigint('source_unit_price', { mode: 'bigint' }),
  },
  (table) => [
    unique('uq_purchase_order_items_po_item_uom').on(table.purchaseOrderId, table.inventoryItemId, table.uomId),
    index('idx_purchase_order_items_po').on(table.purchaseOrderId),
    ...scopeFromOwnerPolicies({ owner: purchaseOrders, fk: table.purchaseOrderId, ownerIs: 'siteDocument' }),
  ],
);

export type PurchaseOrderItem = typeof purchaseOrderItems.$inferSelect;
export type NewPurchaseOrderItem = typeof purchaseOrderItems.$inferInsert;
