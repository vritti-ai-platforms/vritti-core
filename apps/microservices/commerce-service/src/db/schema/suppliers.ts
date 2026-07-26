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
import { uom } from './uom';

export const suppliers = commerceSchema.table(
  'suppliers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    legalEntityId: uuid('legal_entity_id').notNull().default(sql.raw("cast(current_setting('app.le_id') as uuid)")),
    partyId: uuid('party_id')
      .notNull()
      .references(() => parties.id),
    code: varchar('code', { length: 100 }).notNull(),
    currencyCode: varchar('currency_code', { length: 3 }).notNull(),
    paymentTerms: varchar('payment_terms', { length: 50 }),
    leadTimeDays: integer('lead_time_days'),
    notes: varchar('notes', { length: 500 }),
    // Purchasing block stops new POs/RFQs; payment block stops outgoing payments. Independent of isActive.
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
    // Composite uniqueness on (id, currency_code) exists purely as a target for the composite FK
    // on supplier_items below. `id` is already PK so this adds no new uniqueness, but Postgres
    // requires the FK target column tuple to have a matching UNIQUE / PRIMARY KEY constraint.
    unique('uq_suppliers_id_currency').on(table.id, table.currencyCode),
    index('idx_suppliers_le').on(table.organizationId, table.legalEntityId),
    index('idx_suppliers_party').on(table.partyId),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select current_setting('app.org_id', true)::uuid)`,
    }),
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
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    // No inline .references() on supplier_id — the composite FK below covers it. A single-column
    // FK in addition to the composite would conflict on the delete action.
    supplierId: uuid('supplier_id').notNull(),
    inventoryItemId: uuid('inventory_item_id')
      .notNull()
      .references(() => inventoryItems.id, { onDelete: 'cascade' }),
    supplierItemCode: varchar('supplier_item_code', { length: 100 }),
    // Price lives in supplier_item_prices (validity timeline); currency stays anchored here via the composite FK.
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
    // How this supplier quotes the unit price. Mirrors catalogs.taxInclusive on the sale side.
    // false (default) = B2B/exclusive is the norm.
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
