import { sql } from '@vritti/api-sdk/drizzle-orm';
import { check, foreignKey, index, pgPolicy, timestamp, unique, uuid } from '@vritti/api-sdk/drizzle-pg-core';
import { apps } from './apps';
import { coreSchema } from './core-schema';
import { paymentChannelEnum } from './enums';
import { legalEntities } from './legal-entity';
import { organizations } from './organizations';
import { payoutAccounts } from './payout-account';
import { sites } from './site';

// Where a payout account is used: the legal entity as a whole, or narrowed to one site, app or channel. One payout
// account can serve many scopes, so a site override points at an account the legal entity already has instead of
// repeating it. A payment takes the most specific channel of the gateway the shopper picked (app 8, site 4,
// channel 2). One channel per gateway per scope is a service rule, since the gateway lives on the payout account.
export const payoutChannels = coreSchema.table(
  'payout_channels',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    payoutAccountId: uuid('payout_account_id').notNull(),
    legalEntityId: uuid('legal_entity_id')
      .notNull()
      .references(() => legalEntities.id, { onDelete: 'restrict' }),
    siteId: uuid('site_id').references(() => sites.id, { onDelete: 'cascade' }),
    appId: uuid('app_id').references(() => apps.id, { onDelete: 'cascade' }),
    channel: paymentChannelEnum('channel'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    // The payout account must belong to the same legal entity; one in use cannot be removed
    foreignKey({
      name: 'payout_channels_payout_account_le_fkey',
      columns: [table.payoutAccountId, table.legalEntityId],
      foreignColumns: [payoutAccounts.id, payoutAccounts.legalEntityId],
    }).onDelete('restrict'),
    unique('uq_payout_channels_account_scope')
      .on(table.payoutAccountId, table.siteId, table.appId, table.channel)
      .nullsNotDistinct(),
    // An app only takes payments through the APP channel
    check('payout_channels_app_channel_chk', sql`${table.appId} IS NULL OR ${table.channel} = 'APP'`),
    index('idx_payout_channels_le').on(table.legalEntityId),
    index('idx_payout_channels_payout_account').on(table.payoutAccountId),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select nullif(current_setting('app.org_id', true), '')::uuid)`,
    }),
  ],
);

export type PayoutChannel = typeof payoutChannels.$inferSelect;
export type NewPayoutChannel = typeof payoutChannels.$inferInsert;
