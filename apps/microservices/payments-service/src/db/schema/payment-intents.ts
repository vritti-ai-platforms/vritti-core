import { sql } from '@vritti/api-sdk/drizzle-orm';
import { bigint, char, index, jsonb, text, timestamp, unique, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { paymentChannelTypeEnum, paymentIntentStatusEnum } from './enums';
import { paymentsSchema } from './payments-schema';
import { organizationIdColumn, orgIsolationPolicy } from './workspace-scope';

export interface PaymentIntentCustomer {
  name?: string;
  email?: string;
  phone?: string;
}

export const paymentIntents = paymentsSchema.table(
  'payment_intents',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: organizationIdColumn,
    legalEntityId: uuid('legal_entity_id').notNull(),
    siteId: uuid('site_id'),
    appId: uuid('app_id'),
    // The party the payment is made by, when the caller acts for one; null for a guest payment
    partyId: uuid('party_id'),
    configId: uuid('config_id').notNull(),
    gatewayCode: varchar('gateway_code', { length: 100 }).notNull(),
    bankAccountId: uuid('bank_account_id'),
    type: paymentChannelTypeEnum('type').notNull(),
    // What is being paid for, as the caller names it — an order, a booking, a donation. Opaque to payments:
    // it is handed back on every event so the owner can act on it
    referenceType: varchar('reference_type', { length: 100 }).notNull(),
    referenceId: varchar('reference_id', { length: 200 }).notNull(),
    description: varchar('description', { length: 500 }),
    idempotencyKey: varchar('idempotency_key', { length: 100 }).notNull(),
    receipt: varchar('receipt', { length: 40 }).notNull(),
    amount: bigint('amount', { mode: 'bigint' }).notNull(),
    currency: char('currency', { length: 3 }).notNull(),
    status: paymentIntentStatusEnum('status').notNull().default('CREATED'),
    providerOrderId: varchar('provider_order_id', { length: 100 }),
    providerPaymentId: varchar('provider_payment_id', { length: 100 }),
    // What the client launcher needs to open the gateway's checkout — public values only (key id, order id)
    checkout: jsonb('checkout').$type<Record<string, unknown>>(),
    method: varchar('method', { length: 30 }),
    fee: bigint('fee', { mode: 'bigint' }),
    tax: bigint('tax', { mode: 'bigint' }),
    customer: jsonb('customer').$type<PaymentIntentCustomer>(),
    metadata: jsonb('metadata').$type<Record<string, string>>(),
    // Where core's hosted checkout callback sends the shopper after a payment, and back to on a failure or cancel
    returnUrl: varchar('return_url', { length: 2048 }),
    checkoutUrl: varchar('checkout_url', { length: 2048 }),
    failureCode: varchar('failure_code', { length: 100 }),
    failureMessage: text('failure_message'),
    succeededAt: timestamp('succeeded_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_payment_intents_org_idempotency_key').on(table.organizationId, table.idempotencyKey),
    index('idx_payment_intents_org_status').on(table.organizationId, table.status),
    index('idx_payment_intents_provider_order').on(table.providerOrderId),
    index('idx_payment_intents_config').on(table.configId),
    index('idx_payment_intents_reference').on(table.organizationId, table.referenceType, table.referenceId),
    index('idx_payment_intents_expiry').on(table.status, table.expiresAt),
    orgIsolationPolicy(),
  ],
);

export type PaymentIntent = typeof paymentIntents.$inferSelect;
export type NewPaymentIntent = typeof paymentIntents.$inferInsert;
