import { sql } from '@vritti/api-sdk/drizzle-orm';
import {
  type AnyPgColumn,
  bigint,
  boolean,
  check,
  date,
  decimal,
  index,
  integer,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { costCategories } from './cost-categories';
import {
  supplierInvoiceHoldCodeEnum,
  supplierInvoiceHoldStatusEnum,
  supplierInvoiceLineTypeEnum,
  supplierInvoicePaymentStatusEnum,
  supplierInvoiceSourceEnum,
  supplierInvoiceStatusEnum,
} from './enums';
import { goodsReceiptItems } from './goods-receipt-items';
import { goodsReceiptLots } from './goods-receipt-lots';
import { inventoryItems } from './inventory-items';
import { paymentTerms } from './payment-terms';
import { purchaseOrderItems } from './purchase-orders';
import { suppliers } from './suppliers';
import { uom } from './uom';
import {
  organizationIdColumn,
  scopeFromOwnerPolicies,
  siteDocumentColumns,
  siteDocumentPolicies,
} from './workspace-scope';

export const supplierInvoices = commerceSchema.table(
  'supplier_invoices',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: organizationIdColumn(),
    ...siteDocumentColumns(),
    supplierId: uuid('supplier_id')
      .notNull()
      .references(() => suppliers.id),
    invoiceNumber: varchar('invoice_number', { length: 100 }).notNull(),
    invoiceDate: date('invoice_date', { mode: 'string' }).notNull(),
    taxDate: date('tax_date', { mode: 'string' }).notNull(),
    source: supplierInvoiceSourceEnum('source').notNull().default('ENTERED'),
    currencyCode: varchar('currency_code', { length: 3 }).notNull(),
    exchangeRate: decimal('exchange_rate', { precision: 18, scale: 6, mode: 'number' }).notNull().default(1),
    paymentTermId: uuid('payment_term_id')
      .notNull()
      .references(() => paymentTerms.id, { onDelete: 'restrict' }),
    dueDate: date('due_date', { mode: 'string' }).notNull(),
    status: supplierInvoiceStatusEnum('status').notNull().default('DRAFT'),
    paymentStatus: supplierInvoicePaymentStatusEnum('payment_status').notNull().default('UNPAID'),
    subtotal: bigint('subtotal', { mode: 'bigint' }).notNull().default(0n),
    discountAmount: bigint('discount_amount', { mode: 'bigint' }).notNull().default(0n),
    taxAmount: bigint('tax_amount', { mode: 'bigint' }).notNull().default(0n),
    totalAmount: bigint('total_amount', { mode: 'bigint' }).notNull().default(0n),
    openHoldCount: integer('open_hold_count').notNull().default(0),
    notes: text('notes'),
    postedBy: uuid('posted_by'),
    postedAt: timestamp('posted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_supplier_invoices_supplier_number').on(table.supplierId, table.invoiceNumber),
    index('idx_supplier_invoices_site').on(table.siteId),
    index('idx_supplier_invoices_supplier').on(table.supplierId),
    ...siteDocumentPolicies(),
  ],
);

export type SupplierInvoice = typeof supplierInvoices.$inferSelect;
export type NewSupplierInvoice = typeof supplierInvoices.$inferInsert;

export const supplierInvoiceLines = commerceSchema.table(
  'supplier_invoice_lines',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: organizationIdColumn(),
    supplierInvoiceId: uuid('supplier_invoice_id')
      .notNull()
      .references((): AnyPgColumn => supplierInvoices.id, { onDelete: 'cascade' }),
    lineType: supplierInvoiceLineTypeEnum('line_type').notNull().default('ITEM'),
    purchaseOrderItemId: uuid('purchase_order_item_id').references(() => purchaseOrderItems.id),
    goodsReceiptItemId: uuid('goods_receipt_item_id').references(() => goodsReceiptItems.id),
    goodsReceiptLotId: uuid('goods_receipt_lot_id').references(() => goodsReceiptLots.id),
    inventoryItemId: uuid('inventory_item_id').references(() => inventoryItems.id),
    uomId: uuid('uom_id').references(() => uom.id),
    invoicedQty: decimal('invoiced_qty', { precision: 12, scale: 3, mode: 'number' }),
    freeQty: decimal('free_qty', { precision: 12, scale: 3, mode: 'number' }),
    invoicedPrimaryQty: decimal('invoiced_primary_qty', { precision: 12, scale: 3, mode: 'number' }),
    freePrimaryQty: decimal('free_primary_qty', { precision: 12, scale: 3, mode: 'number' }),
    costCategoryId: uuid('cost_category_id').references(() => costCategories.id, { onDelete: 'restrict' }),
    description: varchar('description', { length: 200 }),
    unitPrice: bigint('unit_price', { mode: 'bigint' }).notNull(),
    discountAmount: bigint('discount_amount', { mode: 'bigint' }).notNull().default(0n),
    taxAmount: bigint('tax_amount', { mode: 'bigint' }).notNull().default(0n),
    lineTotal: bigint('line_total', { mode: 'bigint' }).notNull(),
    varianceAmount: bigint('variance_amount', { mode: 'bigint' }).notNull().default(0n),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('idx_supplier_invoice_lines_invoice').on(table.supplierInvoiceId),
    index('idx_supplier_invoice_lines_po_item').on(table.purchaseOrderItemId),
    index('idx_supplier_invoice_lines_gr_item').on(table.goodsReceiptItemId),
    index('idx_supplier_invoice_lines_gr_lot').on(table.goodsReceiptLotId),
    check(
      'supplier_invoice_lines_item_chk',
      sql`${table.lineType} <> 'ITEM' OR (${table.purchaseOrderItemId} IS NOT NULL AND ${table.inventoryItemId} IS NOT NULL AND ${table.uomId} IS NOT NULL AND ${table.invoicedQty} IS NOT NULL AND ${table.freeQty} IS NOT NULL AND ${table.invoicedPrimaryQty} IS NOT NULL AND ${table.freePrimaryQty} IS NOT NULL AND ${table.costCategoryId} IS NULL)`,
    ),
    check(
      'supplier_invoice_lines_charge_chk',
      sql`${table.lineType} <> 'CHARGE' OR (${table.costCategoryId} IS NOT NULL AND ${table.purchaseOrderItemId} IS NULL AND ${table.goodsReceiptItemId} IS NULL AND ${table.goodsReceiptLotId} IS NULL AND ${table.inventoryItemId} IS NULL)`,
    ),
    check(
      'supplier_invoice_lines_receipt_chk',
      sql`${table.goodsReceiptLotId} IS NULL OR ${table.goodsReceiptItemId} IS NOT NULL`,
    ),
    ...scopeFromOwnerPolicies({ owner: supplierInvoices, fk: table.supplierInvoiceId, ownerIs: 'siteDocument' }),
  ],
);

export type SupplierInvoiceLine = typeof supplierInvoiceLines.$inferSelect;
export type NewSupplierInvoiceLine = typeof supplierInvoiceLines.$inferInsert;

export const supplierInvoiceHolds = commerceSchema.table(
  'supplier_invoice_holds',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: organizationIdColumn(),
    supplierInvoiceId: uuid('supplier_invoice_id')
      .notNull()
      .references(() => supplierInvoices.id, { onDelete: 'cascade' }),
    supplierInvoiceLineId: uuid('supplier_invoice_line_id').references(() => supplierInvoiceLines.id, {
      onDelete: 'cascade',
    }),
    code: supplierInvoiceHoldCodeEnum('code').notNull(),
    detail: text('detail').notNull(),
    blocksPayment: boolean('blocks_payment').notNull(),
    status: supplierInvoiceHoldStatusEnum('status').notNull().default('OPEN'),
    releasedBy: uuid('released_by'),
    releasedAt: timestamp('released_at', { withTimezone: true }),
    releaseReason: text('release_reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_supplier_invoice_holds_invoice_line_code')
      .on(table.supplierInvoiceId, table.supplierInvoiceLineId, table.code)
      .nullsNotDistinct(),
    index('idx_supplier_invoice_holds_invoice').on(table.supplierInvoiceId, table.status),
    check(
      'supplier_invoice_holds_release_chk',
      sql`${table.status} <> 'RELEASED' OR (${table.releaseReason} IS NOT NULL AND ${table.releasedBy} IS NOT NULL AND ${table.releasedAt} IS NOT NULL)`,
    ),
    ...scopeFromOwnerPolicies({ owner: supplierInvoices, fk: table.supplierInvoiceId, ownerIs: 'siteDocument' }),
  ],
);

export type SupplierInvoiceHold = typeof supplierInvoiceHolds.$inferSelect;
export type NewSupplierInvoiceHold = typeof supplierInvoiceHolds.$inferInsert;
