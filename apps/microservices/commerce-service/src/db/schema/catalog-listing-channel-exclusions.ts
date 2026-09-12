import { sql } from '@vritti/api-sdk/drizzle-orm';
import { index, pgPolicy, timestamp, unique, uuid } from '@vritti/api-sdk/drizzle-pg-core';
import { catalogChannels } from './catalog-channels';
import { catalogListings } from './catalog-listings';
import { commerceSchema } from './commerce-schema';

export const catalogListingChannelExclusions = commerceSchema.table(
  'catalog_listing_channel_exclusions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    catalogListingId: uuid('catalog_listing_id')
      .notNull()
      .references(() => catalogListings.id, { onDelete: 'cascade' }),
    catalogChannelId: uuid('catalog_channel_id')
      .notNull()
      .references(() => catalogChannels.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique('uq_catalog_listing_channel_exclusions').on(table.catalogListingId, table.catalogChannelId),
    index('idx_catalog_listing_channel_exclusions_listing').on(table.catalogListingId),
    index('idx_catalog_listing_channel_exclusions_channel').on(table.catalogChannelId),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select current_setting('app.org_id', true)::uuid)`,
    }),
  ],
);

export type CatalogListingChannelExclusion = typeof catalogListingChannelExclusions.$inferSelect;
export type NewCatalogListingChannelExclusion = typeof catalogListingChannelExclusions.$inferInsert;
