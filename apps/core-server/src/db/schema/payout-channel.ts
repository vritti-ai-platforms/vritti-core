import { sql } from '@vritti/api-sdk/drizzle-orm';
import { check, foreignKey, index, pgPolicy, timestamp, unique, uuid } from '@vritti/api-sdk/drizzle-pg-core';
import { apps } from './apps';
import { bankAccounts } from './bank-account';
import { coreSchema } from './core-schema';
import { paymentChannelEnum } from './enums';
import { legalEntities } from './legal-entity';
import { organizations } from './organizations';
import { sites } from './site';

export const payoutChannels = coreSchema.table(
  'payout_channels',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    bankAccountId: uuid('bank_account_id').notNull(),
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
    // The bank account must be held by the scope's legal entity
    foreignKey({
      name: 'payout_channels_bank_account_le_fkey',
      columns: [table.bankAccountId, table.legalEntityId],
      foreignColumns: [bankAccounts.id, bankAccounts.legalEntityId],
    }).onDelete('restrict'),
    // Lets a channel's accounts require, through one composite key, that they share the channel's bank account
    unique('uq_payout_channels_id_bank').on(table.id, table.bankAccountId),
    // One bank account per scope; a narrower scope overrides a wider one as a whole
    unique('uq_payout_channels_scope')
      .on(table.legalEntityId, table.siteId, table.appId, table.channel)
      .nullsNotDistinct(),
    // An app only takes payments through the APP channel
    check('payout_channels_app_channel_chk', sql`${table.appId} IS NULL OR ${table.channel} = 'APP'`),
    index('idx_payout_channels_le').on(table.legalEntityId),
    index('idx_payout_channels_bank_account').on(table.bankAccountId),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select nullif(current_setting('app.org_id', true), '')::uuid)`,
    }),
  ],
);

export type PayoutChannel = typeof payoutChannels.$inferSelect;
export type NewPayoutChannel = typeof payoutChannels.$inferInsert;
