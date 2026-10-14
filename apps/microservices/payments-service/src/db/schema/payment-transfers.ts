import { sql } from '@vritti/api-sdk/drizzle-orm';
import { bigint, boolean, char, index, timestamp, unique, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { paymentTransferStatusEnum } from './enums';
import { paymentIntents } from './payment-intents';
import { paymentsSchema } from './payments-schema';
import { organizationIdColumn, orgIsolationPolicy } from './workspace-scope';

export const paymentTransfers = paymentsSchema.table(
  'payment_transfers',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: organizationIdColumn,
    intentId: uuid('intent_id')
      .notNull()
      .references(() => paymentIntents.id, { onDelete: 'cascade' }),
    linkedAccountId: uuid('linked_account_id').notNull(),
    // Matches core's payment_linked_accounts.provider_account_id width
    providerAccountId: varchar('provider_account_id', { length: 100 }).notNull(),
    amount: bigint('amount', { mode: 'bigint' }).notNull(),
    currency: char('currency', { length: 3 }).notNull(),
    onHold: boolean('on_hold').notNull().default(false),
    onHoldUntil: timestamp('on_hold_until', { withTimezone: true }),
    status: paymentTransferStatusEnum('status').notNull().default('CREATED'),
    providerTransferId: varchar('provider_transfer_id', { length: 100 }),
    errorCode: varchar('error_code', { length: 100 }),
    errorDescription: varchar('error_description', { length: 1000 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_payment_transfers_provider_transfer_id').on(table.providerTransferId),
    // One leg per seller per intent — a seller's shares are summed into one transfer, never split across rows
    unique('uq_payment_transfers_intent_linked_account').on(table.intentId, table.linkedAccountId),
    index('idx_payment_transfers_intent').on(table.intentId),
    orgIsolationPolicy(),
  ],
);

export type PaymentTransfer = typeof paymentTransfers.$inferSelect;
export type NewPaymentTransfer = typeof paymentTransfers.$inferInsert;
