import Decimal from '@vritti/api-sdk/decimal';
import { sql } from '@vritti/api-sdk/drizzle-orm';
import {
  bigint,
  boolean,
  check,
  decimal,
  index,
  timestamp,
  unique,
  uuid,
  varchar,
} from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { purchaseItems } from './purchase-items';
import { purchaseOrderItems } from './purchase-orders';
import { purchaseSuppliers } from './purchase-suppliers';
import { purchases } from './purchases';
import { supplierQuotationItems } from './supplier-quotations';
import { uom } from './uom';
import { organizationIdColumn, scopeFromOwnerPolicies } from './workspace-scope';

export const purchaseItemAllocations = commerceSchema.table(
  'purchase_item_allocations',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: organizationIdColumn(),
    purchaseItemId: uuid('purchase_item_id')
      .notNull()
      .references(() => purchaseItems.id, { onDelete: 'cascade' }),
    purchaseSupplierId: uuid('purchase_supplier_id')
      .notNull()
      .references(() => purchaseSuppliers.id, { onDelete: 'cascade' }),
    supplierQuotationItemId: uuid('supplier_quotation_item_id').references(() => supplierQuotationItems.id, {
      onDelete: 'restrict',
    }),
    uomId: uuid('uom_id')
      .notNull()
      .references(() => uom.id, { onDelete: 'restrict' }),
    uomQty: decimal('uom_qty', { precision: 12, scale: 3, mode: 'number' }).notNull(),
    primaryUomQty: decimal('primary_uom_qty', { precision: 12, scale: 3, mode: 'number' }).notNull(),
    currencyCode: varchar('currency_code', { length: 3 }).notNull(),
    unitPrice: bigint('unit_price', { mode: 'bigint' }),
    schemeBuyQty: decimal('scheme_buy_qty', { precision: 12, scale: 3, mode: 'number' }),
    schemeFreeQty: decimal('scheme_free_qty', { precision: 12, scale: 3, mode: 'number' }),
    hasScheme: boolean('has_scheme').notNull().default(false),
    freePrimaryQty: decimal('free_primary_qty', { precision: 12, scale: 3, mode: 'number' }).notNull().default(0),
    purchaseOrderItemId: uuid('purchase_order_item_id').references(() => purchaseOrderItems.id, {
      onDelete: 'restrict',
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_purchase_item_allocations_item_supplier').on(table.purchaseItemId, table.purchaseSupplierId),
    unique('uq_purchase_item_allocations_po_item').on(table.purchaseOrderItemId),
    index('idx_purchase_item_allocations_supplier').on(table.purchaseSupplierId),
    index('idx_purchase_item_allocations_quotation_item').on(table.supplierQuotationItemId),
    check('purchase_item_allocations_qty_chk', sql`${table.uomQty} > 0 AND ${table.primaryUomQty} > 0`),
    check(
      'purchase_item_allocations_scheme_chk',
      sql`(${table.schemeBuyQty} IS NULL) = (${table.schemeFreeQty} IS NULL)`,
    ),
    ...scopeFromOwnerPolicies({
      owner: purchases,
      fk: table.purchaseItemId,
      through: [{ table: purchaseItems, fk: (items) => items.purchaseId }],
      ownerIs: 'siteDocument',
    }),
  ],
);

export type PurchaseItemAllocation = typeof purchaseItemAllocations.$inferSelect;
export type NewPurchaseItemAllocation = typeof purchaseItemAllocations.$inferInsert;

// Derives the bonus (free) quantity for a slab trade scheme given the paid/ordered quantity. one free block per
// complete buyQty (9+1 on 15 → 1; on 18 → 2) Returns 0 when there is no scheme or the ratio is incomplete. Decimal keeps
// fractional quantities exact: in floats 0.3 / 0.1 is 2.999…, which would floor to one block short.
export function computeFreeQty(
  orderedQty: number,
  buyQty?: number | null,
  freeQty?: number | null,
  hasScheme?: boolean | null,
): number {
  if (!hasScheme || !buyQty || buyQty <= 0 || !freeQty || freeQty <= 0 || !orderedQty || orderedQty <= 0) return 0;
  return new Decimal(orderedQty).dividedToIntegerBy(buyQty).times(freeQty).toNumber();
}
