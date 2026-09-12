import { sql } from '@vritti/api-sdk/drizzle-orm';
import { boolean, index, pgPolicy, timestamp, unique, uuid } from '@vritti/api-sdk/drizzle-pg-core';
import { catalogs } from './catalogs';
import { commerceSchema } from './commerce-schema';
import { inventoryItemMrps } from './inventory-item-mrps';
import { offeringVariants } from './offering-variants';

export const catalogListings = commerceSchema.table(
  'catalog_listings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    catalogId: uuid('catalog_id')
      .notNull()
      .references(() => catalogs.id, { onDelete: 'cascade' }),
    offeringVariantId: uuid('offering_variant_id')
      .notNull()
      .references(() => offeringVariants.id, { onDelete: 'cascade' }),
    legalEntityId: uuid('legal_entity_id'),
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
      .on(table.catalogId, table.offeringVariantId, table.legalEntityId, table.inventoryItemMrpId)
      .nullsNotDistinct(),
    index('idx_catalog_listings_catalog').on(table.catalogId),
    index('idx_catalog_listings_variant').on(table.offeringVariantId),
    index('idx_catalog_listings_mrp').on(table.inventoryItemMrpId),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select current_setting('app.org_id', true)::uuid)`,
    }),
  ],
);

export type CatalogListing = typeof catalogListings.$inferSelect;
export type NewCatalogListing = typeof catalogListings.$inferInsert;
