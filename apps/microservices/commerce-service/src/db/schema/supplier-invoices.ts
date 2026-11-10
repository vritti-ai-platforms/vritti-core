import { sql } from '@vritti/api-sdk/drizzle-orm';
import {
  type AnyPgColumn,
  bigint,
  date,
  decimal,
  index,
  integer,
  jsonb,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { supplierInvoiceStatusEnum } from './enums';
import { goodsReceiptItems } from './goods-receipt-items';
import { goodsReceiptLots } from './goods-receipt-lots';
import { inventoryItems } from './inventory-items';
import { purchaseOrderItems, purchaseOrders } from './purchase-orders';
import { suppliers } from './suppliers';
import { uom } from './uom';
import {
  LE_GUC,
  organizationIdColumn,
  SITE_GUC,
  scopeFromOwnerPolicies,
  siteDocumentPolicies,
} from './workspace-scope';

export interface SupplierInvoiceLineFlag {
  code: string;
  detail: string;
}

export const supplierInvoices = commerceSchema.table(
  'supplier_invoices',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: organizationIdColumn,
    legalEntityId: uuid('legal_entity_id').notNull().default(sql.raw(LE_GUC)),
    siteId: uuid('site_id').notNull().default(sql.raw(SITE_GUC)),
    supplierId: uuid('supplier_id')
      .notNull()
      .references(() => suppliers.id),
    purchaseOrderId: uuid('purchase_order_id')
      .notNull()
      .references(() => purchaseOrders.id),
    invoiceNumber: varchar('invoice_number', { length: 100 }).notNull(),
    invoiceDate: date('invoice_date', { mode: 'string' }).notNull(),
    taxDate: date('tax_date', { mode: 'string' }).notNull(),
    currencyCode: varchar('currency_code', { length: 3 }).notNull(),
    exchangeRate: decimal('exchange_rate', { precision: 18, scale: 6, mode: 'number' }).notNull().default(1),
    status: supplierInvoiceStatusEnum('status').notNull().default('DRAFT'),
    subtotal: bigint('subtotal', { mode: 'bigint' }).notNull().default(0n),
    discountAmount: bigint('discount_amount', { mode: 'bigint' }).notNull().default(0n),
    taxAmount: bigint('tax_amount', { mode: 'bigint' }).notNull().default(0n),
    totalAmount: bigint('total_amount', { mode: 'bigint' }).notNull().default(0n),
    flagCount: integer('flag_count').notNull().default(0),
    flags: jsonb('flags').$type<SupplierInvoiceLineFlag[]>().notNull().default([]),
    notes: text('notes'),
    createdBy: uuid('created_by'),
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
    index('idx_supplier_invoices_po').on(table.purchaseOrderId),
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
    organizationId: organizationIdColumn,
    supplierInvoiceId: uuid('supplier_invoice_id')
      .notNull()
      .references((): AnyPgColumn => supplierInvoices.id, { onDelete: 'cascade' }),
    purchaseOrderItemId: uuid('purchase_order_item_id')
      .notNull()
      .references(() => purchaseOrderItems.id),
    inventoryItemId: uuid('inventory_item_id')
      .notNull()
      .references(() => inventoryItems.id),
    uomId: uuid('uom_id')
      .notNull()
      .references(() => uom.id),
    lotNumber: varchar('lot_number', { length: 100 }),
    expiryDate: date('expiry_date', { mode: 'string' }),
    mrp: bigint('mrp', { mode: 'bigint' }),
    billedQty: decimal('billed_qty', { precision: 12, scale: 3, mode: 'number' }).notNull(),
    freeQty: decimal('free_qty', { precision: 12, scale: 3, mode: 'number' }).notNull().default(0),
    unitPrice: bigint('unit_price', { mode: 'bigint' }).notNull(),
    discountAmount: bigint('discount_amount', { mode: 'bigint' }).notNull().default(0n),
    taxAmount: bigint('tax_amount', { mode: 'bigint' }).notNull().default(0n),
    lineTotal: bigint('line_total', { mode: 'bigint' }).notNull(),
    flags: jsonb('flags').$type<SupplierInvoiceLineFlag[]>().notNull().default([]),
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
    ...scopeFromOwnerPolicies({ owner: supplierInvoices, fk: table.supplierInvoiceId, ownerIs: 'siteDocument' }),
  ],
);

export type SupplierInvoiceLine = typeof supplierInvoiceLines.$inferSelect;
export type NewSupplierInvoiceLine = typeof supplierInvoiceLines.$inferInsert;

export const supplierInvoiceLineReceipts = commerceSchema.table(
  'supplier_invoice_line_receipts',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: organizationIdColumn,
    supplierInvoiceLineId: uuid('supplier_invoice_line_id')
      .notNull()
      .references(() => supplierInvoiceLines.id, { onDelete: 'cascade' }),
    goodsReceiptItemId: uuid('goods_receipt_item_id')
      .notNull()
      .references(() => goodsReceiptItems.id),
    goodsReceiptLotId: uuid('goods_receipt_lot_id').references(() => goodsReceiptLots.id),
    quantity: decimal('quantity', { precision: 12, scale: 3, mode: 'number' }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique('uq_supplier_invoice_line_receipts')
      .on(table.supplierInvoiceLineId, table.goodsReceiptItemId, table.goodsReceiptLotId)
      .nullsNotDistinct(),
    index('idx_supplier_invoice_line_receipts_gr_item').on(table.goodsReceiptItemId),
    ...scopeFromOwnerPolicies({
      owner: supplierInvoices,
      fk: table.supplierInvoiceLineId,
      through: [{ table: supplierInvoiceLines, fk: (lines) => lines.supplierInvoiceId }],
      ownerIs: 'siteDocument',
    }),
  ],
);

export type SupplierInvoiceLineReceipt = typeof supplierInvoiceLineReceipts.$inferSelect;
export type NewSupplierInvoiceLineReceipt = typeof supplierInvoiceLineReceipts.$inferInsert;
