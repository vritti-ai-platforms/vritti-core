import { sql } from '@vritti/api-sdk/drizzle-orm';
import { check, foreignKey, index, pgPolicy, timestamp, unique, uuid } from '@vritti/api-sdk/drizzle-pg-core';
import { apps } from './apps';
import { bankAccounts } from './bank-account';
import { coreSchema } from './core-schema';
import { paymentChannelEnum } from './enums';
import { legalEntities } from './legal-entity';
import { organizations } from './organizations';
import { sites } from './site';

// A scope — a legal entity, narrowed by site, app or channel — pays out into one bank account of its legal entity
export const payoutChannelBankAccounts = coreSchema.table(
  'payout_channel_bank_accounts',
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
      name: 'payout_channel_bank_accounts_bank_account_le_fkey',
      columns: [table.bankAccountId, table.legalEntityId],
      foreignColumns: [bankAccounts.id, bankAccounts.legalEntityId],
    }).onDelete('restrict'),
    // Lets the scope's payout channels require, through one composite key, that they share its bank account
    unique('uq_payout_channel_bank_accounts_id_bank').on(table.id, table.bankAccountId),
    // One bank account per scope; a narrower scope overrides a wider one as a whole
    unique('uq_payout_channel_bank_accounts_scope')
      .on(table.legalEntityId, table.siteId, table.appId, table.channel)
      .nullsNotDistinct(),
    // An app only takes payments through the APP channel
    check('payout_channel_bank_accounts_app_channel_chk', sql`${table.appId} IS NULL OR ${table.channel} = 'APP'`),
    index('idx_payout_channel_bank_accounts_le').on(table.legalEntityId),
    index('idx_payout_channel_bank_accounts_bank_account').on(table.bankAccountId),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select nullif(current_setting('app.org_id', true), '')::uuid)`,
    }),
  ],
);

export type PayoutChannelBankAccount = typeof payoutChannelBankAccounts.$inferSelect;
export type NewPayoutChannelBankAccount = typeof payoutChannelBankAccounts.$inferInsert;
