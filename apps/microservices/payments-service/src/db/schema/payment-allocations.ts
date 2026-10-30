import { sql } from '@vritti/api-sdk/drizzle-orm';
import { bigint, boolean, char, index, timestamp, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { paymentIntents } from './payment-intents';
import { paymentTransfers } from './payment-transfers';
import { paymentsSchema } from './payments-schema';
import { organizationIdColumn, orgIsolationPolicy } from './workspace-scope';

// One store's share of a payment, and where it was paid out — written with the intent, never changed after. A payment
// across several stores has one row per store, and a payment for one store has one row, so every payment says whose
// sale each part of it was. The payout fields are snapshots taken when the payment opened: a payout account edited
// or removed later does not rewrite which bank a past payment went to. A share kept in the gateway's main account has
// no transfer; one paid to a linked account names the leg it travelled on, which may carry other stores' shares too
export const paymentAllocations = paymentsSchema.table(
  'payment_allocations',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: organizationIdColumn,
    intentId: uuid('intent_id')
      .notNull()
      .references(() => paymentIntents.id, { onDelete: 'cascade' }),
    // Whose sale this share is. Both live in core, so no foreign keys
    legalEntityId: uuid('legal_entity_id').notNull(),
    siteId: uuid('site_id'),
    // Core's payout account the share was routed by, and the bank and gateway account it named at the time
    payoutAccountId: uuid('payout_account_id').notNull(),
    bankAccountId: uuid('bank_account_id').notNull(),
    // Matches payment_transfers.provider_account_id width
    gatewayAccountId: varchar('gateway_account_id', { length: 100 }).notNull(),
    // True when the share stays in the gateway's main account and nothing is transferred
    isMainAccount: boolean('is_main_account').notNull(),
    // What the store sold, what the platform kept, and what was paid out — gross = fee + net
    grossAmount: bigint('gross_amount', { mode: 'bigint' }).notNull(),
    platformFeeAmount: bigint('platform_fee_amount', { mode: 'bigint' }).notNull(),
    netAmount: bigint('net_amount', { mode: 'bigint' }).notNull(),
    currency: char('currency', { length: 3 }).notNull(),
    // The split leg that carried the share; null for a main-account share
    transferId: uuid('transfer_id').references(() => paymentTransfers.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_payment_allocations_intent').on(table.intentId),
    // Collections per legal entity and per bank, for invoices and reconciliation
    index('idx_payment_allocations_legal_entity').on(table.organizationId, table.legalEntityId),
    index('idx_payment_allocations_bank_account').on(table.organizationId, table.bankAccountId),
    orgIsolationPolicy(),
  ],
);

export type PaymentAllocation = typeof paymentAllocations.$inferSelect;
export type NewPaymentAllocation = typeof paymentAllocations.$inferInsert;
