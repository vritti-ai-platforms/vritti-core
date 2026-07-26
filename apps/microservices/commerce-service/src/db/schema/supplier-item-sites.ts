import { sql } from '@vritti/api-sdk/drizzle-orm';
import { index, integer, pgPolicy, timestamp, unique, uuid } from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { supplierItems } from './suppliers';

export const supplierItemSites = commerceSchema.table(
  'supplier_item_sites',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    supplierItemId: uuid('supplier_item_id')
      .notNull()
      .references(() => supplierItems.id, { onDelete: 'cascade' }),
    // Explicit (no GUC default): the LE workspace manages overrides for any site; resolution is record-level —
    // a site row replaces the general supplier_items values wholesale for that site.
    siteId: uuid('site_id').notNull(),
    leadTimeDays: integer('lead_time_days'),
    minOrderQuantity: integer('min_order_quantity'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_supplier_item_sites').on(table.supplierItemId, table.siteId),
    index('idx_supplier_item_sites_site').on(table.siteId),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select current_setting('app.org_id', true)::uuid)`,
    }),
    pgPolicy('site_read', {
      for: 'select',
      using: sql`site_id = (select current_setting('app.site_id', true)::uuid)`,
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

export type SupplierItemSite = typeof supplierItemSites.$inferSelect;
export type NewSupplierItemSite = typeof supplierItemSites.$inferInsert;
