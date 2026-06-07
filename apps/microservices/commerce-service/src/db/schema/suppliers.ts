import { sql } from '@vritti/api-sdk/drizzle-orm';
import {
  bigint,
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
import { coreSchema } from './core-schema';
import { taxIdTypeEnum } from './enums';
import { inventoryItems } from './inventory-items';
import { uom } from './uom';

export const suppliers = coreSchema.table(
  'suppliers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    businessUnitId: uuid('business_unit_id').notNull().default(sql.raw("cast(current_setting('app.bu_id') as uuid)")),
    name: varchar('name', { length: 255 }).notNull(),
    code: varchar('code', { length: 100 }).notNull(),
    currencyCode: varchar('currency_code', { length: 3 }).notNull(),
    contactName: varchar('contact_name', { length: 255 }),
    phone: varchar('phone', { length: 20 }).notNull(),
    email: varchar('email', { length: 255 }),
    website: varchar('website', { length: 255 }),
    address: varchar('address', { length: 500 }),
    taxId: varchar('tax_id', { length: 15 }),
    taxIdType: taxIdTypeEnum('tax_id_type'),
    paymentTerms: varchar('payment_terms', { length: 50 }),
    leadTimeDays: integer('lead_time_days'),
    notes: varchar('notes', { length: 500 }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('uq_suppliers_bu_code').on(table.businessUnitId, table.code),
    // Composite uniqueness on (id, currency_code) exists purely as a target for the composite FK
    // on supplier_items below. `id` is already PK so this adds no new uniqueness, but Postgres
    // requires the FK target column tuple to have a matching UNIQUE / PRIMARY KEY constraint.
    unique('uq_suppliers_id_currency').on(table.id, table.currencyCode),
    index('idx_suppliers_bu').on(table.organizationId, table.businessUnitId),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select current_setting('app.org_id', true)::uuid)`,
    }),
    pgPolicy('bu_ancestor_read', {
      for: 'select',
      using: sql`business_unit_id = ANY((select current_setting('app.bu_ancestor_ids', true))::uuid[])`,
    }),
    pgPolicy('bu_write', {
      for: 'insert',
      withCheck: sql`business_unit_id = (select current_setting('app.bu_id', true)::uuid)`,
    }),
    pgPolicy('bu_update', {
      for: 'update',
      using: sql`business_unit_id = (select current_setting('app.bu_id', true)::uuid)`,
    }),
    pgPolicy('bu_delete', {
      for: 'delete',
      using: sql`business_unit_id = (select current_setting('app.bu_id', true)::uuid)`,
    }),
  ],
);

export type Supplier = typeof suppliers.$inferSelect;
export type NewSupplier = typeof suppliers.$inferInsert;

export const supplierContacts = coreSchema.table(
  'supplier_contacts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    businessUnitId: uuid('business_unit_id').notNull().default(sql.raw("cast(current_setting('app.bu_id') as uuid)")),
    supplierId: uuid('supplier_id')
      .notNull()
      .references(() => suppliers.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 20 }).notNull(),
    alternatePhone: varchar('alternate_phone', { length: 20 }),
    email: varchar('email', { length: 255 }),
    alternateEmail: varchar('alternate_email', { length: 255 }),
    designation: varchar('designation', { length: 100 }),
    notes: varchar('notes', { length: 500 }),
    isPrimary: boolean('is_primary').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('idx_supplier_contacts_supplier').on(table.supplierId),
    uniqueIndex('uq_supplier_contacts_primary').on(table.supplierId).where(sql`is_primary = true`),
    uniqueIndex('uq_supplier_contacts_supplier_email').on(table.supplierId, table.email),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select current_setting('app.org_id', true)::uuid)`,
    }),
    pgPolicy('bu_ancestor_read', {
      for: 'select',
      using: sql`business_unit_id = ANY((select current_setting('app.bu_ancestor_ids', true))::uuid[])`,
    }),
    pgPolicy('bu_write', {
      for: 'insert',
      withCheck: sql`business_unit_id = (select current_setting('app.bu_id', true)::uuid)`,
    }),
    pgPolicy('bu_update', {
      for: 'update',
      using: sql`business_unit_id = (select current_setting('app.bu_id', true)::uuid)`,
    }),
    pgPolicy('bu_delete', {
      for: 'delete',
      using: sql`business_unit_id = (select current_setting('app.bu_id', true)::uuid)`,
    }),
  ],
);

export type SupplierContact = typeof supplierContacts.$inferSelect;
export type NewSupplierContact = typeof supplierContacts.$inferInsert;

export const supplierItems = coreSchema.table(
  'supplier_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    // No inline .references() on supplier_id — the composite FK below covers it. A single-column
    // FK in addition to the composite would conflict on the delete action.
    supplierId: uuid('supplier_id').notNull(),
    inventoryItemId: uuid('inventory_item_id')
      .notNull()
      .references(() => inventoryItems.id, { onDelete: 'cascade' }),
    supplierItemCode: varchar('supplier_item_code', { length: 100 }),
    unitPrice: bigint('unit_price', { mode: 'bigint' }).notNull(),
    currencyCode: varchar('currency_code', { length: 3 }).notNull(),
    uomId: uuid('uom_id')
      .notNull()
      .references(() => uom.id, { onDelete: 'restrict' }),
    minOrderQuantity: integer('min_order_quantity'),
    leadTimeDays: integer('lead_time_days'),
    // Standing free-goods scheme template (e.g. buy 9 get 1). Prefills PO/GR lines; null = no scheme.
    schemeBuyQty: decimal('scheme_buy_qty', { precision: 12, scale: 3, mode: 'number' }),
    schemeFreeQty: decimal('scheme_free_qty', { precision: 12, scale: 3, mode: 'number' }),
    hasScheme: boolean('has_scheme').notNull().default(false),
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
    // Composite FK enforces per-row currency match with the parent supplier. ON UPDATE CASCADE
    // means a supplier currency change propagates to its items automatically. ON DELETE CASCADE
    // preserves the previous single-column FK behavior — deleting a supplier deletes its items.
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
