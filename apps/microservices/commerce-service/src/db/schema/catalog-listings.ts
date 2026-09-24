import { sql } from '@vritti/api-sdk/drizzle-orm';
import { boolean, check, index, timestamp, unique, uuid } from '@vritti/api-sdk/drizzle-pg-core';
import { catalogs } from './catalogs';
import { commerceSchema } from './commerce-schema';
import { inventoryItemMrps } from './inventory-item-mrps';
import { offeringVariants } from './offering-variants';
import { organizationIdColumn, workspaceScopeColumns, workspaceScopePolicies } from './workspace-scope';

export const catalogListings = commerceSchema.table(
  'catalog_listings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: organizationIdColumn,
    catalogId: uuid('catalog_id')
      .notNull()
      .references(() => catalogs.id, { onDelete: 'cascade' }),
    offeringVariantId: uuid('offering_variant_id')
      .notNull()
      .references(() => offeringVariants.id, { onDelete: 'cascade' }),
    legalEntityId: workspaceScopeColumns.legalEntityId,
    siteId: workspaceScopeColumns.siteId,
    inventoryItemMrpId: uuid('inventory_item_mrp_id').references(() => inventoryItemMrps.id, { onDelete: 'restrict' }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_catalog_listings')
      .on(table.catalogId, table.offeringVariantId, table.legalEntityId, table.siteId, table.inventoryItemMrpId)
      .nullsNotDistinct(),
    index('idx_catalog_listings_catalog').on(table.catalogId),
    index('idx_catalog_listings_variant').on(table.offeringVariantId),
    index('idx_catalog_listings_mrp').on(table.inventoryItemMrpId),
    check('ck_catalog_listings_site_needs_le', sql`${table.siteId} is null or ${table.legalEntityId} is not null`),
    ...workspaceScopePolicies('catalog_listing_reach'),
  ],
);

export type CatalogListing = typeof catalogListings.$inferSelect;
export type NewCatalogListing = typeof catalogListings.$inferInsert;
