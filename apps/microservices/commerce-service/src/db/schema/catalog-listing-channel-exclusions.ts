import { sql } from '@vritti/api-sdk/drizzle-orm';
import { index, timestamp, unique, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { catalogChannels } from './catalog-channels';
import { catalogListings } from './catalog-listings';
import { commerceSchema } from './commerce-schema';
import { organizationIdColumn, scopeFromOwnerPolicies } from './workspace-scope';

export const catalogListingChannelExclusions = commerceSchema.table(
  'catalog_listing_channel_exclusions',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: organizationIdColumn,
    catalogListingId: uuid('catalog_listing_id')
      .notNull()
      .references(() => catalogListings.id, { onDelete: 'cascade' }),
    catalogChannelId: uuid('catalog_channel_id')
      .notNull()
      .references(() => catalogChannels.id, { onDelete: 'cascade' }),
    // Null excludes the listing from the channel outright; a code excludes it only from callers
    // asking in that currency, so a shop can keep an item available domestically and not to foreign buyers
    currencyCode: varchar('currency_code', { length: 3 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique('uq_catalog_listing_channel_exclusions')
      .on(table.catalogListingId, table.catalogChannelId, table.currencyCode)
      .nullsNotDistinct(),
    index('idx_catalog_listing_channel_exclusions_listing').on(table.catalogListingId),
    index('idx_catalog_listing_channel_exclusions_channel').on(table.catalogChannelId),
    ...scopeFromOwnerPolicies({ owner: catalogChannels, fk: table.catalogChannelId }),
  ],
);

export type CatalogListingChannelExclusion = typeof catalogListingChannelExclusions.$inferSelect;
export type NewCatalogListingChannelExclusion = typeof catalogListingChannelExclusions.$inferInsert;
