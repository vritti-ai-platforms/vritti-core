import { sql } from '@vritti/api-sdk/drizzle-orm';
import { check, index, pgPolicy, timestamp, unique, uuid } from '@vritti/api-sdk/drizzle-pg-core';
import { catalogs } from './catalogs';
import { commerceSchema } from './commerce-schema';
import { catalogChannelTypeEnum } from './enums';
import { posTerminals } from './pos-terminals';
import { workspaceScopeColumns, workspaceScopePolicies } from './workspace-scope';

export const catalogChannels = commerceSchema.table(
  'catalog_channels',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    catalogId: uuid('catalog_id')
      .notNull()
      .references(() => catalogs.id, { onDelete: 'cascade' }),
    type: catalogChannelTypeEnum('type').notNull(),
    legalEntityId: workspaceScopeColumns.legalEntityId,
    siteId: workspaceScopeColumns.siteId,
    appId: uuid('app_id'),
    terminalId: uuid('terminal_id').references(() => posTerminals.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    // One catalog per channel per scope, so resolution never has a tie to break
    unique('uq_catalog_channels_scope')
      .on(table.type, table.organizationId, table.legalEntityId, table.siteId, table.appId, table.terminalId)
      .nullsNotDistinct(),
    check(
      'ck_catalog_channels_target_matches_type',
      sql`case ${table.type}
            when 'APP' then ${table.terminalId} is null
            when 'POS' then ${table.appId} is null
            else ${table.appId} is null and ${table.terminalId} is null
          end`,
    ),
    // A till belongs to an outlet, so naming one without its site is incoherent
    check('ck_catalog_channels_terminal_needs_site', sql`${table.terminalId} is null or ${table.siteId} is not null`),
    check('ck_catalog_channels_site_needs_le', sql`${table.siteId} is null or ${table.legalEntityId} is not null`),
    index('idx_catalog_channels_catalog').on(table.catalogId),
    index('idx_catalog_channels_resolve').on(table.type, table.organizationId, table.legalEntityId, table.siteId),
    ...workspaceScopePolicies('catalog_channel_reach'),
  ],
);

export type CatalogChannel = typeof catalogChannels.$inferSelect;
export type NewCatalogChannel = typeof catalogChannels.$inferInsert;
