import { sql } from '@vritti/api-sdk/drizzle-orm';
import {
  bigint,
  boolean,
  decimal,
  index,
  integer,
  pgPolicy,
  timestamp,
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
    organizationId: uuid('organization_id').notNull().default(sql.raw("current_setting('app.org_id')::uuid")),
    businessUnitId: uuid('business_unit_id').notNull().default(sql.raw("current_setting('app.bu_id')::uuid")),
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
    index('idx_suppliers_bu').on(table.organizationId, table.businessUnitId),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = current_setting('app.org_id', true)::uuid`,
    }),
    pgPolicy('bu_ancestor_read', {
      for: 'select',
      using: sql`business_unit_id = ANY(current_setting('app.bu_ancestor_ids', true)::uuid[])`,
    }),
    pgPolicy('bu_write', {
      for: 'insert',
      withCheck: sql`business_unit_id = current_setting('app.bu_id', true)::uuid`,
    }),
    pgPolicy('bu_update', {
      for: 'update',
      using: sql`business_unit_id = current_setting('app.bu_id', true)::uuid`,
    }),
    pgPolicy('bu_delete', {
      for: 'delete',
      using: sql`business_unit_id = current_setting('app.bu_id', true)::uuid`,
    }),
  ],
);

export type Supplier = typeof suppliers.$inferSelect;
export type NewSupplier = typeof suppliers.$inferInsert;

export const supplierContacts = coreSchema.table(
  'supplier_contacts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("current_setting('app.org_id')::uuid")),
    businessUnitId: uuid('business_unit_id').notNull().default(sql.raw("current_setting('app.bu_id')::uuid")),
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
      using: sql`organization_id = current_setting('app.org_id', true)::uuid`,
    }),
    pgPolicy('bu_ancestor_read', {
      for: 'select',
      using: sql`business_unit_id = ANY(current_setting('app.bu_ancestor_ids', true)::uuid[])`,
    }),
    pgPolicy('bu_write', {
      for: 'insert',
      withCheck: sql`business_unit_id = current_setting('app.bu_id', true)::uuid`,
    }),
    pgPolicy('bu_update', {
      for: 'update',
      using: sql`business_unit_id = current_setting('app.bu_id', true)::uuid`,
    }),
    pgPolicy('bu_delete', {
      for: 'delete',
      using: sql`business_unit_id = current_setting('app.bu_id', true)::uuid`,
    }),
  ],
);

export type SupplierContact = typeof supplierContacts.$inferSelect;
export type NewSupplierContact = typeof supplierContacts.$inferInsert;

export const supplierItems = coreSchema.table(
  'supplier_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("current_setting('app.org_id')::uuid")),
    supplierId: uuid('supplier_id')
      .notNull()
      .references(() => suppliers.id, { onDelete: 'cascade' }),
    inventoryItemId: uuid('inventory_item_id')
      .notNull()
      .references(() => inventoryItems.id, { onDelete: 'cascade' }),
    supplierItemCode: varchar('supplier_item_code', { length: 100 }),
    unitPrice: bigint('unit_price', { mode: 'number' }),
    uomId: uuid('uom_id')
      .notNull()
      .references(() => uom.id, { onDelete: 'restrict' }),
    minOrderQuantity: decimal('min_order_quantity', { precision: 12, scale: 3 }),
    leadTimeDays: integer('lead_time_days'),
    isPreferred: boolean('is_preferred').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('uq_supplier_items_supplier_item').on(table.supplierId, table.inventoryItemId),
    index('idx_supplier_items_supplier').on(table.supplierId),
  ],
);

export type SupplierItem = typeof supplierItems.$inferSelect;
export type NewSupplierItem = typeof supplierItems.$inferInsert;
