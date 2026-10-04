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

/**
 * How strongly a row claims a caller. Highest wins.
 *
 * Naming an app or terminal is a deliberate exception, so it outranks any workspace — the most a
 * workspace alone can score is 4 + 2. Below that the narrower workspace wins, and the organization
 * scores zero as the fallback everything beats. A row names at most one target (the CHECK above
 * enforces it), so those two scores never both apply.
 *
 * Lives on the schema rather than in a domain because two domains rank by it — channels to build the
 * list, carts to price a basket — and a second copy that drifted would resolve the wrong catalog.
 */
export const channelSpecificity = sql`
  (case when ${catalogChannels.appId} is not null or ${catalogChannels.terminalId} is not null then 8 else 0 end)
  + (case when ${catalogChannels.siteId} is not null then 4 else 0 end)
  + (case when ${catalogChannels.legalEntityId} is not null then 2 else 0 end)`;

/**
 * Which channel a party buys through. A company buys wholesale, a person through the storefront.
 *
 * Derived rather than passed, so a caller cannot ask for B2B prices by claiming to be one. Absent or
 * unknown falls back to APP: an anonymous browser is shopping the storefront, not negotiating.
 */
export const partyChannelType = (partyId: SQL | string | null | undefined) =>
  partyId
    ? sql`coalesce(
        (select case when p.party_type = 'COMPANY' then 'B2B' else 'APP' end
         from ${parties} p where p.id = ${partyId}),
        'APP')`
    : sql`'APP'`;

/**
 * The catalog a caller resolves to, as a scalar subquery.
 *
 * The channel comes from the party: a company's basket prices against B2B, a person's against APP.
 * `appId` narrows either of them to one storefront — a wholesale site names an app just as a retail
 * one does, so the same filter serves both.
 *
 * A null party resolves the workspace's own APP default — what a staff surface with no credential
 * gets. RLS bounds the rows either way, so the answer is always within reach.
 */
export const partyChannelCatalogId = (partyId: SQL | string | null | undefined, appId?: string | null) => {
  const channel = partyChannelType(partyId);
  return sql<string>`(
  select cc.catalog_id from ${catalogChannels} cc
  where cc.type::text = ${channel}
    and (${appId ? sql`cc.app_id = ${appId} or ` : sql``}cc.app_id is null)
  order by
      (case when cc.app_id is not null then 8 else 0 end)
    + (case when cc.site_id is not null then 4 else 0 end)
    + (case when cc.legal_entity_id is not null then 2 else 0 end) desc
  limit 1
)`;
};
