import { sql } from '@vritti/api-sdk/drizzle-orm';
import { bigint, check, index, timestamp, unique, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { catalogListings } from './catalog-listings';
import { commerceSchema } from './commerce-schema';
import { organizationIdColumn, workspaceScopeColumns, workspaceScopePolicies } from './workspace-scope';

export const catalogListingPrices = commerceSchema.table(
  'catalog_listing_prices',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: organizationIdColumn,
    catalogListingId: uuid('catalog_listing_id')
      .notNull()
      .references(() => catalogListings.id, { onDelete: 'cascade' }),
    currencyCode: varchar('currency_code', { length: 3 }).notNull(),
    amount: bigint('amount', { mode: 'bigint' }).notNull(),
    legalEntityId: workspaceScopeColumns.legalEntityId,
    siteId: workspaceScopeColumns.siteId,
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_catalog_listing_prices_scope')
      .on(table.catalogListingId, table.currencyCode, table.legalEntityId, table.siteId)
      .nullsNotDistinct(),
    check(
      'ck_catalog_listing_prices_site_needs_le',
      sql`${table.siteId} is null or ${table.legalEntityId} is not null`,
    ),
    index('idx_catalog_listing_prices_listing').on(table.catalogListingId),
    index('idx_catalog_listing_prices_resolve').on(table.catalogListingId, table.currencyCode, table.siteId),
    ...workspaceScopePolicies('catalog_listing_price_reach'),
  ],
);

export type CatalogListingPrice = typeof catalogListingPrices.$inferSelect;
export type NewCatalogListingPrice = typeof catalogListingPrices.$inferInsert;

export const listingPriceSpecificity = sql`
  (case when ${catalogListingPrices.siteId} is not null then 4 else 0 end)
  + (case when ${catalogListingPrices.legalEntityId} is not null then 2 else 0 end)`;
