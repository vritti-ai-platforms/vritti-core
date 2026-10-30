import { sql } from '@vritti/api-sdk/drizzle-orm';
import {
  bigint,
  boolean,
  date,
  decimal,
  index,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { supplierPriceSourceEnum } from './enums';
import { inventoryItemMrps } from './inventory-item-mrps';
import { supplierQuotationSites } from './supplier-quotations';
import { supplierItems } from './suppliers';
import { organizationIdColumn, siteDocumentPolicies } from './workspace-scope';

export const supplierItemPrices = commerceSchema.table(
  'supplier_item_prices',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: organizationIdColumn,
    legalEntityId: uuid('legal_entity_id').notNull(),
    siteId: uuid('site_id').notNull(),
    supplierItemId: uuid('supplier_item_id')
      .notNull()
      // A priced supplier item cannot be deleted: its price history is never dropped with it
      .references(() => supplierItems.id, { onDelete: 'restrict' }),
    unitPrice: bigint('unit_price', { mode: 'bigint' }).notNull(),
    // One of the supplier's currencies; each price carries its own, so a supplier can requote an item in another
    currencyCode: varchar('currency_code', { length: 3 }).notNull(),
    mrpId: uuid('mrp_id').references(() => inventoryItemMrps.id, { onDelete: 'restrict' }),
    schemeBuyQty: decimal('scheme_buy_qty', { precision: 12, scale: 3, mode: 'number' }),
    schemeFreeQty: decimal('scheme_free_qty', { precision: 12, scale: 3, mode: 'number' }),
    taxInclusive: boolean('tax_inclusive').notNull().default(false),
    validFrom: date('valid_from', { mode: 'string' }).notNull(),
    validTo: date('valid_to', { mode: 'string' }),
    source: supplierPriceSourceEnum('source').notNull().default('MANUAL'),
    // Set on rows a quotation posted; removing the quotation from the site removes them
    quotationSiteId: uuid('quotation_site_id').references(() => supplierQuotationSites.id, { onDelete: 'restrict' }),
    note: varchar('note', { length: 500 }),
    createdBy: uuid('created_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('uq_supplier_item_prices_site_from').on(table.supplierItemId, table.siteId, table.validFrom),
    index('idx_supplier_item_prices_item').on(table.supplierItemId, table.validFrom),
    index('idx_supplier_item_prices_site').on(table.siteId),
    index('idx_supplier_item_prices_le').on(table.legalEntityId),
    index('idx_supplier_item_prices_mrp').on(table.mrpId),
    index('idx_supplier_item_prices_quotation_site').on(table.quotationSiteId),
    ...siteDocumentPolicies(),
  ],
);

export type SupplierItemPrice = typeof supplierItemPrices.$inferSelect;
export type NewSupplierItemPrice = typeof supplierItemPrices.$inferInsert;
