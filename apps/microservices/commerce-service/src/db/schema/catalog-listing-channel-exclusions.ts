import { sql } from '@vritti/api-sdk/drizzle-orm';
import { check, index, timestamp, unique, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { catalogChannels } from './catalog-channels';
import { catalogListings } from './catalog-listings';
import { commerceSchema } from './commerce-schema';
import { posTerminals } from './pos-terminals';
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
    appId: uuid('app_id'),
    terminalId: uuid('terminal_id').references(() => posTerminals.id, { onDelete: 'cascade' }),
    currencyCode: varchar('currency_code', { length: 3 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique('uq_catalog_listing_channel_exclusions')
      .on(table.catalogListingId, table.catalogChannelId, table.appId, table.terminalId, table.currencyCode)
      .nullsNotDistinct(),
    check(
      'catalog_listing_channel_exclusions_one_target_chk',
      sql`${table.appId} is null or ${table.terminalId} is null`,
    ),
    index('idx_catalog_listing_channel_exclusions_listing').on(table.catalogListingId),
    index('idx_catalog_listing_channel_exclusions_channel').on(table.catalogChannelId),
    ...scopeFromOwnerPolicies({ owner: catalogChannels, fk: table.catalogChannelId }),
  ],
);

export type CatalogListingChannelExclusion = typeof catalogListingChannelExclusions.$inferSelect;
export type NewCatalogListingChannelExclusion = typeof catalogListingChannelExclusions.$inferInsert;
