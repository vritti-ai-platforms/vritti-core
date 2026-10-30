import { sql } from '@vritti/api-sdk/drizzle-orm';
import { foreignKey, index, pgPolicy, timestamp, unique, uuid } from '@vritti/api-sdk/drizzle-pg-core';
import { coreSchema } from './core-schema';
import { organizations } from './organizations';
import { payoutAccounts } from './payout-account';
import { payoutChannels } from './payout-channel';

export const payoutChannelAccounts = coreSchema.table(
  'payout_channel_accounts',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    payoutChannelId: uuid('payout_channel_id').notNull(),
    payoutAccountId: uuid('payout_account_id').notNull(),
    bankAccountId: uuid('bank_account_id').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    // The channel, and its bank account with it
    foreignKey({
      name: 'payout_channel_accounts_channel_bank_fkey',
      columns: [table.payoutChannelId, table.bankAccountId],
      foreignColumns: [payoutChannels.id, payoutChannels.bankAccountId],
    }).onDelete('cascade'),
    // A payout account of that same bank account; one switched on cannot be removed
    foreignKey({
      name: 'payout_channel_accounts_account_bank_fkey',
      columns: [table.payoutAccountId, table.bankAccountId],
      foreignColumns: [payoutAccounts.id, payoutAccounts.bankAccountId],
    }).onDelete('restrict'),
    unique('uq_payout_channel_accounts_channel_account').on(table.payoutChannelId, table.payoutAccountId),
    index('idx_payout_channel_accounts_account').on(table.payoutAccountId),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select nullif(current_setting('app.org_id', true), '')::uuid)`,
    }),
  ],
);

export type PayoutChannelAccount = typeof payoutChannelAccounts.$inferSelect;
export type NewPayoutChannelAccount = typeof payoutChannelAccounts.$inferInsert;
