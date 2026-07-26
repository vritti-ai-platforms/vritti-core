import { sql } from '@vritti/api-sdk/drizzle-orm';
import { bigint, date, decimal, index, pgPolicy, timestamp, uniqueIndex, uuid } from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { supplierPriceSourceEnum } from './enums';
import { supplierItems } from './suppliers';

export const supplierItemPrices = commerceSchema.table(
  'supplier_item_prices',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    supplierItemId: uuid('supplier_item_id')
      .notNull()
      .references(() => supplierItems.id, { onDelete: 'cascade' }),
    // Nullable + missing_ok GUC default: LE context inserts NULL (general row), site context inserts its own
    // site (site-specific row). Resolution: site row wins over general for the same date. DTOs never carry siteId.
    siteId: uuid('site_id').default(sql.raw("cast(current_setting('app.site_id', true) as uuid)")),
    // Currency = parent supplier_items.currency_code (anchored by its composite FK to the supplier).
    unitPrice: bigint('unit_price', { mode: 'bigint' }).notNull(),
    schemeBuyQty: decimal('scheme_buy_qty', { precision: 12, scale: 3, mode: 'number' }),
    schemeFreeQty: decimal('scheme_free_qty', { precision: 12, scale: 3, mode: 'number' }),
    validFrom: date('valid_from', { mode: 'string' }).notNull(),
    validTo: date('valid_to', { mode: 'string' }),
    source: supplierPriceSourceEnum('source').notNull().default('MANUAL'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('uq_supplier_item_prices_site_from')
      .on(table.supplierItemId, table.siteId, table.validFrom)
      .where(sql`site_id IS NOT NULL`),
    uniqueIndex('uq_supplier_item_prices_general_from')
      .on(table.supplierItemId, table.validFrom)
      .where(sql`site_id IS NULL`),
    index('idx_supplier_item_prices_item').on(table.supplierItemId, table.validFrom),
    index('idx_supplier_item_prices_site').on(table.siteId),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select current_setting('app.org_id', true)::uuid)`,
    }),
    pgPolicy('site_read', {
      for: 'select',
      using: sql`site_id IS NULL OR site_id = (select current_setting('app.site_id', true)::uuid)`,
    }),
    pgPolicy('site_write', {
      for: 'insert',
      withCheck: sql`site_id = (select current_setting('app.site_id', true)::uuid)`,
    }),
    pgPolicy('site_update', {
      for: 'update',
      using: sql`site_id = (select current_setting('app.site_id', true)::uuid)`,
    }),
    pgPolicy('site_delete', {
      for: 'delete',
      using: sql`site_id = (select current_setting('app.site_id', true)::uuid)`,
    }),
  ],
);

export type SupplierItemPrice = typeof supplierItemPrices.$inferSelect;
export type NewSupplierItemPrice = typeof supplierItemPrices.$inferInsert;
