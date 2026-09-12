import { sql } from '@vritti/api-sdk/drizzle-orm';
import { bigint, index, pgPolicy, timestamp, unique, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { catalogListings } from './catalog-listings';
import { commerceSchema } from './commerce-schema';

export const catalogListingPrices = commerceSchema.table(
  'catalog_listing_prices',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
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
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select current_setting('app.org_id', true)::uuid)`,
    }),
  ],
);

export type CatalogListingPrice = typeof catalogListingPrices.$inferSelect;
export type NewCatalogListingPrice = typeof catalogListingPrices.$inferInsert;
