import { boolean, decimal, index, integer, pgPolicy, timestamp, unique, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { sql } from '@vritti/api-sdk/drizzle-orm';
import { coreSchema } from './core-schema';
import { inventoryItems } from './inventory-items';
import { uom } from './uom';

export const suppliers = coreSchema.table(
  'suppliers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql`current_setting('app.org_id')::uuid`),
    businessUnitId: uuid('business_unit_id').notNull().default(sql`current_setting('app.bu_id')::uuid`),
    name: varchar('name', { length: 255 }).notNull(),
    code: varchar('code', { length: 100 }).notNull(),
    contactName: varchar('contact_name', { length: 255 }),
    phone: varchar('phone', { length: 20 }),
    email: varchar('email', { length: 255 }),
    address: varchar('address', { length: 500 }),
    gstin: varchar('gstin', { length: 15 }),
    paymentTerms: varchar('payment_terms', { length: 50 }),
    leadTimeDays: integer('lead_time_days'),
    notes: varchar('notes', { length: 500 }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_suppliers_bu_code').on(table.businessUnitId, table.code),
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

export const supplierItems = coreSchema.table(
  'supplier_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql`current_setting('app.org_id')::uuid`),
    supplierId: uuid('supplier_id').notNull().references(() => suppliers.id, { onDelete: 'cascade' }),
    inventoryItemId: uuid('inventory_item_id').notNull().references(() => inventoryItems.id, { onDelete: 'cascade' }),
    supplierCode: varchar('supplier_code', { length: 100 }),
    unitPrice: decimal('unit_price', { precision: 12, scale: 2 }),
    uomId: uuid('uom_id').references(() => uom.id),
    minOrderQuantity: decimal('min_order_quantity', { precision: 12, scale: 3 }),
    leadTimeDays: integer('lead_time_days'),
    isPreferred: boolean('is_preferred').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_supplier_items_supplier_item').on(table.supplierId, table.inventoryItemId),
    index('idx_supplier_items_supplier').on(table.supplierId),
  ],
);

export type SupplierItem = typeof supplierItems.$inferSelect;
export type NewSupplierItem = typeof supplierItems.$inferInsert;
