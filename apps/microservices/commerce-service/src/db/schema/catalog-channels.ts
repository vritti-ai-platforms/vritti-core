import { sql } from '@vritti/api-sdk/drizzle-orm';
import { index, pgPolicy, timestamp, unique, uuid } from '@vritti/api-sdk/drizzle-pg-core';
import { catalogs } from './catalogs';
import { coreSchema } from './core-schema';
import { salesChannels } from './sales-channels';

export const catalogChannels = coreSchema.table(
  'catalog_channels',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    businessUnitId: uuid('business_unit_id').notNull().default(sql.raw("cast(current_setting('app.bu_id') as uuid)")),
    catalogId: uuid('catalog_id')
      .notNull()
      .references(() => catalogs.id, { onDelete: 'cascade' }),
    channelId: uuid('channel_id')
      .notNull()
      .references(() => salesChannels.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique('uq_catalog_channels_bu_channel').on(table.businessUnitId, table.channelId),
    index('idx_catalog_channels_catalog').on(table.catalogId),
    index('idx_catalog_channels_channel').on(table.channelId),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select current_setting('app.org_id', true)::uuid)`,
    }),
    pgPolicy('bu_ancestor_read', {
      for: 'select',
      using: sql`business_unit_id = ANY((select current_setting('app.bu_ancestor_ids', true))::uuid[])`,
    }),
    pgPolicy('bu_write', {
      for: 'insert',
      withCheck: sql`business_unit_id = (select current_setting('app.bu_id', true)::uuid)`,
    }),
    pgPolicy('bu_update', {
      for: 'update',
      using: sql`business_unit_id = (select current_setting('app.bu_id', true)::uuid)`,
    }),
    pgPolicy('bu_delete', {
      for: 'delete',
      using: sql`business_unit_id = (select current_setting('app.bu_id', true)::uuid)`,
    }),
  ],
);

export type CatalogChannel = typeof catalogChannels.$inferSelect;
export type NewCatalogChannel = typeof catalogChannels.$inferInsert;
