import { sql } from '@vritti/api-sdk/drizzle-orm';
import {
  boolean,
  check,
  decimal,
  index,
  integer,
  pgPolicy,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { inventoryItems } from './inventory-items';
import { parties } from './parties';
import { paymentTerms } from './payment-terms';
import { uom } from './uom';
import { organizationIdColumn, orgIsolationPolicy } from './workspace-scope';

export const suppliers = commerceSchema.table(
  'suppliers',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: organizationIdColumn,
    legalEntityId: uuid('legal_entity_id').notNull().default(sql.raw("cast(current_setting('app.le_id') as uuid)")),
    partyId: uuid('party_id')
      .notNull()
      .references(() => parties.id),
    code: varchar('code', { length: 100 }).notNull(),
    // The default currency; new supplier items, quotations and POs start in it
    currencyCode: varchar('currency_code', { length: 3 }).notNull(),
    // Every currency the supplier trades in, the default included
    currencyCodes: varchar('currency_codes', { length: 3 }).array().notNull(),
    defaultPaymentTermId: uuid('default_payment_term_id').references(() => paymentTerms.id, { onDelete: 'restrict' }),
    notes: varchar('notes', { length: 500 }),
    purchasingBlocked: boolean('purchasing_blocked').notNull().default(false),
    paymentBlocked: boolean('payment_blocked').notNull().default(false),
    orderEmail: varchar('order_email', { length: 255 }),
    orderPhone: varchar('order_phone', { length: 20 }),
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
    orgIsolationPolicy(),
    pgPolicy('le_read', {
      for: 'select',
      using: sql`legal_entity_id = (select current_setting('app.le_id', true)::uuid)`,
    }),
    pgPolicy('le_write', {
      for: 'insert',
      withCheck: sql`legal_entity_id = (select current_setting('app.le_id', true)::uuid)`,
    }),
    pgPolicy('le_update', {
      for: 'update',
      using: sql`legal_entity_id = (select current_setting('app.le_id', true)::uuid)`,
    }),
    pgPolicy('le_delete', {
      for: 'delete',
      using: sql`legal_entity_id = (select current_setting('app.le_id', true)::uuid)`,
    }),
  ],
);

export type Supplier = typeof suppliers.$inferSelect;
export type NewSupplier = typeof suppliers.$inferInsert;

export const supplierItems = commerceSchema.table(
  'supplier_items',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: organizationIdColumn,
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
    leadTimeDays: integer('lead_time_days'),
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
    index('idx_supplier_items_supplier').on(table.supplierId),
  ],
);

export type SupplierItem = typeof supplierItems.$inferSelect;
export type NewSupplierItem = typeof supplierItems.$inferInsert;
