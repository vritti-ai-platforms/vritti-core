import { sql } from '@vritti/api-sdk/drizzle-orm';
import {
  bigint,
  boolean,
  check,
  date,
  decimal,
  index,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { inventoryItemMrps } from './inventory-item-mrps';
import { inventoryItems } from './inventory-items';
import { suppliers } from './suppliers';
import { uom } from './uom';
import {
  organizationIdColumn,
  scopeFromOwnerPolicies,
  workspaceHierarchyPolicies,
  workspaceScopeColumns,
} from './workspace-scope';

// A supplier's price list document: the LE records it once and posts it to the sites it applies to
export const supplierQuotations = commerceSchema.table(
  'supplier_quotations',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: organizationIdColumn,
    ...workspaceScopeColumns,
    supplierId: uuid('supplier_id')
      .notNull()
      .references(() => suppliers.id, { onDelete: 'restrict' }),
    quotationNumber: varchar('quotation_number', { length: 100 }).notNull(),
    // One of the supplier's currencies; every line's price and MRP is in it
    currencyCode: varchar('currency_code', { length: 3 }).notNull(),
    quotationDate: date('quotation_date', { mode: 'string' }).notNull(),
    validFrom: date('valid_from', { mode: 'string' }).notNull(),
    validTo: date('valid_to', { mode: 'string' }),
    note: varchar('note', { length: 500 }),
    createdBy: uuid('created_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('uq_supplier_quotations_supplier_number').on(table.supplierId, table.quotationNumber),
    index('idx_supplier_quotations_supplier').on(table.supplierId, table.validFrom),
    check('supplier_quotations_validity_chk', sql`${table.validTo} IS NULL OR ${table.validTo} >= ${table.validFrom}`),
    ...workspaceHierarchyPolicies(),
  ],
);

export type SupplierQuotation = typeof supplierQuotations.$inferSelect;
export type NewSupplierQuotation = typeof supplierQuotations.$inferInsert;

// One quoted item in a unit: the price terms every site the quotation is posted to receives. Posting finds or creates
// the matching supplier item (supplier + item + unit) and sets it up at the site
export const supplierQuotationItems = commerceSchema.table(
  'supplier_quotation_items',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: organizationIdColumn,
    quotationId: uuid('quotation_id')
      .notNull()
      .references(() => supplierQuotations.id, { onDelete: 'cascade' }),
    inventoryItemId: uuid('inventory_item_id')
      .notNull()
      .references(() => inventoryItems.id, { onDelete: 'restrict' }),
    uomId: uuid('uom_id')
      .notNull()
      .references(() => uom.id, { onDelete: 'restrict' }),
    supplierItemCode: varchar('supplier_item_code', { length: 100 }),
    unitPrice: bigint('unit_price', { mode: 'bigint' }).notNull(),
    mrpId: uuid('mrp_id').references(() => inventoryItemMrps.id, { onDelete: 'restrict' }),
    schemeBuyQty: decimal('scheme_buy_qty', { precision: 12, scale: 3, mode: 'number' }),
    schemeFreeQty: decimal('scheme_free_qty', { precision: 12, scale: 3, mode: 'number' }),
    taxInclusive: boolean('tax_inclusive').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('uq_supplier_quotation_items_item_uom').on(table.quotationId, table.inventoryItemId, table.uomId),
    index('idx_supplier_quotation_items_inventory_item').on(table.inventoryItemId),
    check(
      'supplier_quotation_items_scheme_chk',
      sql`(${table.schemeBuyQty} IS NULL) = (${table.schemeFreeQty} IS NULL)`,
    ),
    ...scopeFromOwnerPolicies({ owner: supplierQuotations, fk: table.quotationId }),
  ],
);

export type SupplierQuotationItem = typeof supplierQuotationItems.$inferSelect;
export type NewSupplierQuotationItem = typeof supplierQuotationItems.$inferInsert;

// A site the quotation is posted to; its price rows point back here and leave with it
export const supplierQuotationSites = commerceSchema.table(
  'supplier_quotation_sites',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: organizationIdColumn,
    quotationId: uuid('quotation_id')
      .notNull()
      .references(() => supplierQuotations.id, { onDelete: 'cascade' }),
    siteId: uuid('site_id').notNull(),
    postedBy: uuid('posted_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('uq_supplier_quotation_sites_site').on(table.quotationId, table.siteId),
    index('idx_supplier_quotation_sites_site').on(table.siteId),
    ...scopeFromOwnerPolicies({ owner: supplierQuotations, fk: table.quotationId }),
  ],
);

export type SupplierQuotationSite = typeof supplierQuotationSites.$inferSelect;
export type NewSupplierQuotationSite = typeof supplierQuotationSites.$inferInsert;
