import { and, eq, exists, inArray, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  type AnyPgColumn,
  boolean,
  check,
  decimal,
  index,
  integer,
  QueryBuilder,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { inventoryItemSites } from './inventory-item-sites';
import { inventoryItems } from './inventory-items';
import { parties } from './parties';
import { paymentTerms } from './payment-terms';
import { sitePurchasingSettings } from './site-purchasing-settings';
import { supplierEnrollments } from './supplier-enrollments';
import { uom } from './uom';
import {
  legalEntityIdColumn,
  legalEntityOwnedPolicies,
  organizationIdColumn,
  scopeFromOwnerPolicies,
} from './workspace-scope';

export const suppliers = commerceSchema.table(
  'suppliers',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: organizationIdColumn(),
    legalEntityId: legalEntityIdColumn().notNull(),
    partyId: uuid('party_id')
      .notNull()
      .references(() => parties.id),
    code: varchar('code', { length: 100 }).notNull(),
    // The default currency; new supplier items, quotations and POs start in it
    currencyCode: varchar('currency_code', { length: 3 }).notNull(),
    // Every currency the supplier trades in, the default included
    currencyCodes: varchar('currency_codes', { length: 3 }).array().notNull(),
    defaultPaymentTermId: uuid('default_payment_term_id')
      .notNull()
      .references(() => paymentTerms.id, { onDelete: 'restrict' }),
    notes: varchar('notes', { length: 500 }),
    purchasingBlocked: boolean('purchasing_blocked').notNull().default(false),
    paymentBlocked: boolean('payment_blocked').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    check('ck_suppliers_default_currency_listed', sql`${table.currencyCode} = ANY(${table.currencyCodes})`),
    uniqueIndex('uq_suppliers_le_code').on(table.legalEntityId, table.code),
    uniqueIndex('uq_suppliers_le_party').on(table.legalEntityId, table.partyId),
    index('idx_suppliers_le').on(table.organizationId, table.legalEntityId),
    index('idx_suppliers_party').on(table.partyId),
    ...legalEntityOwnedPolicies(),
  ],
);

export type Supplier = typeof suppliers.$inferSelect;
export type NewSupplier = typeof suppliers.$inferInsert;

export const supplierItems = commerceSchema.table(
  'supplier_items',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: organizationIdColumn(),
    supplierId: uuid('supplier_id')
      .notNull()
      .references(() => suppliers.id, { onDelete: 'cascade' }),
    inventoryItemId: uuid('inventory_item_id')
      .notNull()
      .references(() => inventoryItems.id, { onDelete: 'cascade' }),
    supplierItemCode: varchar('supplier_item_code', { length: 100 }),
    // The least the supplier sells of the item per order, in the supplier item's unit
    minOrderQuantity: decimal('min_order_quantity', { precision: 12, scale: 3, mode: 'number' }),
    // Days from order to delivery; every site of the item follows it unless the site overrides it
    defaultLeadTimeDays: integer('default_lead_time_days').notNull().default(0),
    uomId: uuid('uom_id')
      .notNull()
      .references(() => uom.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('uq_supplier_items_supplier_item_uom').on(table.supplierId, table.inventoryItemId, table.uomId),
    check('supplier_items_default_lead_time_chk', sql`${table.defaultLeadTimeDays} between 0 and 365`),
    index('idx_supplier_items_supplier').on(table.supplierId),
    ...scopeFromOwnerPolicies({
      owner: suppliers,
      fk: table.supplierId,
      siteInsertsThrough: {
        table: supplierEnrollments,
        fk: (enrollment) => enrollment.supplierId,
        active: (enrollment) => enrollment.isActive,
        unlessFlagged: [
          { flag: sitePurchasingSettings.supplierItemsRequired },
          {
            flag: inventoryItemSites.supplierItemsRequired,
            item: { column: inventoryItemSites.inventoryItemId, childColumn: table.inventoryItemId },
          },
        ],
      },
    }),
  ],
);

export type SupplierItem = typeof supplierItems.$inferSelect;
export type NewSupplierItem = typeof supplierItems.$inferInsert;

// Whether the legal entity has set the item, or any of the items, up as one of the supplier's items, in any unit — what a
// site whose rules require supplier items buys it by
export function hasSupplierItem(
  supplierId: AnyPgColumn | string,
  inventoryItemId: AnyPgColumn | string | string[],
): SQL {
  return exists(
    new QueryBuilder()
      .select({ one: sql`1` })
      .from(supplierItems)
      .where(
        and(
          eq(supplierItems.supplierId, supplierId),
          Array.isArray(inventoryItemId)
            ? inArray(supplierItems.inventoryItemId, inventoryItemId)
            : eq(supplierItems.inventoryItemId, inventoryItemId),
        ),
      ),
  );
}
