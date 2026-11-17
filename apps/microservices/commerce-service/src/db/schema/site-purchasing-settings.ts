import { and, eq, exists, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import { type AnyPgColumn, boolean, QueryBuilder, timestamp, unique, uuid } from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { organizationIdColumn, siteDocumentColumns, siteDocumentPolicies } from './workspace-scope';

export const sitePurchasingSettings = commerceSchema.table(
  'site_purchasing_settings',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: organizationIdColumn(),
    ...siteDocumentColumns(),
    supplierItemsRequired: boolean('supplier_items_required').notNull().default(false),
    updateSupplierItemsFromOrders: boolean('update_supplier_items_from_orders').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_site_purchasing_settings_site').on(table.siteId),
    ...siteDocumentPolicies({ legalEntityWritesOnly: true }),
  ],
);

export type SitePurchasingSettings = typeof sitePurchasingSettings.$inferSelect;
export type NewSitePurchasingSettings = typeof sitePurchasingSettings.$inferInsert;

// Whether the site buys every item only from what the legal entity set up as its suppliers' items
export function siteRequiresSupplierItems(siteId: AnyPgColumn | string): SQL {
  return exists(
    new QueryBuilder()
      .select({ one: sql`1` })
      .from(sitePurchasingSettings)
      .where(and(eq(sitePurchasingSettings.siteId, siteId), eq(sitePurchasingSettings.supplierItemsRequired, true))),
  );
}
