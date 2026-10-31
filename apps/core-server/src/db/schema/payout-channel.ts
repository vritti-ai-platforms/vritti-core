import { sql } from '@vritti/api-sdk/drizzle-orm';
import { foreignKey, index, pgPolicy, timestamp, unique, uuid } from '@vritti/api-sdk/drizzle-pg-core';
import { coreSchema } from './core-schema';
import { organizations } from './organizations';
import { payoutAccounts } from './payout-account';
import { payoutChannelBankAccounts } from './payout-channel-bank-account';

// One payout account of a scope's bank account, switched on for that scope
export const payoutChannels = coreSchema.table(
  'payout_channels',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    payoutChannelBankAccountId: uuid('payout_channel_bank_account_id').notNull(),
    payoutAccountId: uuid('payout_account_id').notNull(),
    bankAccountId: uuid('bank_account_id').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    // The scope's bank account row, and its bank account with it
    foreignKey({
      name: 'payout_channels_channel_bank_fkey',
      columns: [table.payoutChannelBankAccountId, table.bankAccountId],
      foreignColumns: [payoutChannelBankAccounts.id, payoutChannelBankAccounts.bankAccountId],
    }).onDelete('cascade'),
    // A payout account of that same bank account; one switched on cannot be removed
    foreignKey({
      name: 'payout_channels_account_bank_fkey',
      columns: [table.payoutAccountId, table.bankAccountId],
      foreignColumns: [payoutAccounts.id, payoutAccounts.bankAccountId],
    }).onDelete('restrict'),
    unique('uq_payout_channels_channel_account').on(table.payoutChannelBankAccountId, table.payoutAccountId),
    index('idx_payout_channels_account').on(table.payoutAccountId),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select nullif(current_setting('app.org_id', true), '')::uuid)`,
    }),
  ],
);

export type PayoutChannel = typeof payoutChannels.$inferSelect;
export type NewPayoutChannel = typeof payoutChannels.$inferInsert;
