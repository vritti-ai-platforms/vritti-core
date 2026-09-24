import { sql } from '@vritti/api-sdk/drizzle-orm';
import {
  boolean,
  decimal,
  foreignKey,
  index,
  integer,
  pgPolicy,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { inventoryItems } from './inventory-items';
import { parties } from './parties';
import { taxClasses } from './tax-classes';
import { uom } from './uom';
import { organizationIdColumn, orgIsolationPolicy } from './workspace-scope';

export const suppliers = commerceSchema.table(
  'suppliers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: organizationIdColumn,
    legalEntityId: uuid('legal_entity_id').notNull().default(sql.raw("cast(current_setting('app.le_id') as uuid)")),
    partyId: uuid('party_id')
      .notNull()
      .references(() => parties.id),
    code: varchar('code', { length: 100 }).notNull(),
    currencyCode: varchar('currency_code', { length: 3 }).notNull(),
    paymentTerms: varchar('payment_terms', { length: 50 }),
    leadTimeDays: integer('lead_time_days'),
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
    uniqueIndex('uq_suppliers_le_code').on(table.legalEntityId, table.code),
    uniqueIndex('uq_suppliers_le_party').on(table.legalEntityId, table.partyId),
    unique('uq_suppliers_id_currency').on(table.id, table.currencyCode),
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
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: organizationIdColumn,
    supplierId: uuid('supplier_id').notNull(),
    inventoryItemId: uuid('inventory_item_id')
      .notNull()
      .references(() => inventoryItems.id, { onDelete: 'cascade' }),
    supplierItemCode: varchar('supplier_item_code', { length: 100 }),
    taxClassId: uuid('tax_class_id')
      .notNull()
      .references(() => taxClasses.id),
    currencyCode: varchar('currency_code', { length: 3 }).notNull(),
    uomId: uuid('uom_id')
      .notNull()
      .references(() => uom.id, { onDelete: 'restrict' }),
    minOrderQuantity: integer('min_order_quantity'),
    leadTimeDays: integer('lead_time_days'),
    schemeBuyQty: decimal('scheme_buy_qty', { precision: 12, scale: 3, mode: 'number' }),
    schemeFreeQty: decimal('scheme_free_qty', { precision: 12, scale: 3, mode: 'number' }),
    hasScheme: boolean('has_scheme').notNull().default(false),
    taxInclusive: boolean('tax_inclusive').notNull().default(false),
    isPreferred: boolean('is_preferred').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('uq_supplier_items_supplier_item_uom').on(table.supplierId, table.inventoryItemId, table.uomId),
    uniqueIndex('uq_supplier_items_preferred').on(table.inventoryItemId).where(sql`is_preferred = true`),
    index('idx_supplier_items_supplier').on(table.supplierId),
    foreignKey({
      columns: [table.supplierId, table.currencyCode],
      foreignColumns: [suppliers.id, suppliers.currencyCode],
      name: 'fk_supplier_items_supplier_currency',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
  ],
);

export type SupplierItem = typeof supplierItems.$inferSelect;
export type NewSupplierItem = typeof supplierItems.$inferInsert;
