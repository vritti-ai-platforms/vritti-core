import { sql } from '@vritti/api-sdk/drizzle-orm';
import { boolean, check, index, integer, timestamp, unique, uniqueIndex, uuid } from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { inventoryItems } from './inventory-items';
import { supplierItems } from './suppliers';
import { organizationIdColumn, siteDocumentPolicies } from './workspace-scope';

export const supplierSiteItems = commerceSchema.table(
  'supplier_site_items',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: organizationIdColumn,
    legalEntityId: uuid('legal_entity_id').notNull(),
    siteId: uuid('site_id').notNull(),
    supplierItemId: uuid('supplier_item_id')
      .notNull()
      .references(() => supplierItems.id, { onDelete: 'cascade' }),
    inventoryItemId: uuid('inventory_item_id')
      .notNull()
      .references(() => inventoryItems.id, { onDelete: 'cascade' }),
    isPreferred: boolean('is_preferred').notNull().default(false),
    leadTimeDays: integer('lead_time_days').notNull().default(0),
    // True once the site sets its own lead time; until then it follows the supplier item's
    isLeadTimeOverridden: boolean('is_lead_time_overridden').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_supplier_site_items').on(table.supplierItemId, table.siteId),
    uniqueIndex('uq_supplier_site_items_preferred')
      .on(table.inventoryItemId, table.siteId)
      .where(sql`is_preferred = true`),
    index('idx_supplier_site_items_site').on(table.siteId),
    index('idx_supplier_site_items_item').on(table.inventoryItemId),
    index('idx_supplier_site_items_le').on(table.legalEntityId),
    check('supplier_site_items_lead_time_chk', sql`${table.leadTimeDays} between 0 and 365`),
    ...siteDocumentPolicies(),
  ],
);

export type SupplierSiteItem = typeof supplierSiteItems.$inferSelect;
export type NewSupplierSiteItem = typeof supplierSiteItems.$inferInsert;
