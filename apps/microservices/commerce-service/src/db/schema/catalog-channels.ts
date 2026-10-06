import { type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import { check, index, timestamp, unique, uuid } from '@vritti/api-sdk/drizzle-pg-core';
import { catalogs } from './catalogs';
import { commerceSchema } from './commerce-schema';
import { catalogChannelTypeEnum } from './enums';
import { parties } from './parties';
import { posTerminals } from './pos-terminals';
import { organizationIdColumn, workspaceScopeColumns, workspaceScopePolicies } from './workspace-scope';

export const catalogChannels = commerceSchema.table(
  'catalog_channels',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: organizationIdColumn,
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
    unique('uq_catalog_channels_scope')
      .on(table.type, table.organizationId, table.legalEntityId, table.siteId, table.appId, table.terminalId)
      .nullsNotDistinct(),
    check(
      'ck_catalog_channels_target_matches_type',
      // A wholesale site is still a site, so B2B names an app exactly as APP does — only the till
      // is particular to POS. Which of the two an app resolves through comes from the party buying.
      sql`case
            when ${table.type} = 'POS' then ${table.appId} is null
            else ${table.terminalId} is null
          end`,
    ),
    check('ck_catalog_channels_terminal_needs_site', sql`${table.terminalId} is null or ${table.siteId} is not null`),
    check('ck_catalog_channels_site_needs_le', sql`${table.siteId} is null or ${table.legalEntityId} is not null`),
    index('idx_catalog_channels_catalog').on(table.catalogId),
    index('idx_catalog_channels_resolve').on(table.type, table.organizationId, table.legalEntityId, table.siteId),
    ...workspaceScopePolicies('catalog_channel_reach'),
  ],
);

export type CatalogChannel = typeof catalogChannels.$inferSelect;
export type NewCatalogChannel = typeof catalogChannels.$inferInsert;

export const channelSpecificity = sql`
  (case when ${catalogChannels.appId} is not null or ${catalogChannels.terminalId} is not null then 8 else 0 end)
  + (case when ${catalogChannels.siteId} is not null then 4 else 0 end)
  + (case when ${catalogChannels.legalEntityId} is not null then 2 else 0 end)`;

// Which channel a party buys through
export const partyChannelType = (partyId: SQL | string | null | undefined) =>
  partyId
    ? sql`coalesce(
        (select case when p.party_type = 'COMPANY' then 'B2B' else 'APP' end
         from ${parties} p where p.id = ${partyId}),
        'APP')`
    : sql`'APP'`;

export const partyChannelCatalogId = (
  partyId: SQL | string | null | undefined,
  // SQL as well as a literal, so a read whose storefront varies per row can correlate on app_id
  appId?: SQL | string | null,
) => {
  const channel = partyChannelType(partyId);
  // Unaliased so the shared `channelSpecificity` applies rather than a hand-spelled copy
  return sql<string>`(
  select ${catalogChannels.catalogId} from ${catalogChannels}
  where ${catalogChannels.type}::text = ${channel}
    and (${appId ? sql`${catalogChannels.appId} = ${appId} or ` : sql``}${catalogChannels.appId} is null)
  order by ${channelSpecificity} desc
  limit 1
)`;
};
