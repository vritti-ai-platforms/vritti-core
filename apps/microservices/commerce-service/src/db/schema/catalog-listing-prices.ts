import { bigint, index, timestamp, unique, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { catalogListings } from './catalog-listings';
import { commerceSchema } from './commerce-schema';
import { organizationIdColumn, orgIsolationPolicy } from './workspace-scope';

export const catalogListingPrices = commerceSchema.table(
  'catalog_listing_prices',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: organizationIdColumn,
    catalogListingId: uuid('catalog_listing_id')
      .notNull()
      .references(() => catalogListings.id, { onDelete: 'cascade' }),
    currencyCode: varchar('currency_code', { length: 3 }).notNull(),
    amount: bigint('amount', { mode: 'bigint' }).notNull(),
    siteId: uuid('site_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_catalog_listing_prices_scope')
      .on(table.catalogListingId, table.currencyCode, table.siteId)
      .nullsNotDistinct(),
    index('idx_catalog_listing_prices_listing').on(table.catalogListingId),
    orgIsolationPolicy(),
  ],
);

export type CatalogListingPrice = typeof catalogListingPrices.$inferSelect;
export type NewCatalogListingPrice = typeof catalogListingPrices.$inferInsert;
