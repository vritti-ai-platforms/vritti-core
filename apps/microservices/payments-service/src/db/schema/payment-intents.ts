import { sql } from '@vritti/api-sdk/drizzle-orm';
import {
  bigint,
  char,
  index,
  jsonb,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from '@vritti/api-sdk/drizzle-pg-core';
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
    // Null for a checkout that spans legal entities — the split legs then say who is paid
    legalEntityId: uuid('legal_entity_id'),
    siteId: uuid('site_id'),
    appId: uuid('app_id'),
    // The party the payment is made by, when the caller acts for one; null for a guest payment
    partyId: uuid('party_id'),
    configId: uuid('config_id').notNull(),
    gatewayCode: varchar('gateway_code', { length: 100 }).notNull(),
    type: paymentChannelTypeEnum('type').notNull(),
    // What is being paid for, as the caller names it — an order, a booking, a donation. Opaque to payments:
    // it is handed back on every event so the owner can act on it
    referenceType: varchar('reference_type', { length: 100 }).notNull(),
    referenceId: varchar('reference_id', { length: 200 }).notNull(),
    // The record this payment settles, as a uuid for the caller to look its payments up by — a commerce checkout
    // today, a point-of-sale sale next. No foreign key: the row lives in the caller's service, and `reference_type`
    // says what kind it is. A target can have several payments (a failed one, a retry, another gateway); only one of
    // them can pay it
    targetId: uuid('target_id'),
    description: varchar('description', { length: 500 }),
    idempotencyKey: varchar('idempotency_key', { length: 100 }).notNull(),
    receipt: varchar('receipt', { length: 40 }).notNull(),
    amount: bigint('amount', { mode: 'bigint' }).notNull(),
    currency: char('currency', { length: 3 }).notNull(),
    status: paymentIntentStatusEnum('status').notNull().default('CREATED'),
    providerOrderId: varchar('provider_order_id', { length: 100 }),
    providerPaymentId: varchar('provider_payment_id', { length: 100 }),
    // What the browser needs to open the gateway's page or popup — public values only (key id, order id, session,
    // checkout mode). Not commerce's checkout
    launch: jsonb('launch').$type<Record<string, unknown>>(),
    method: varchar('method', { length: 30 }),
    fee: bigint('fee', { mode: 'bigint' }),
    tax: bigint('tax', { mode: 'bigint' }),
    customer: jsonb('customer').$type<PaymentIntentCustomer>(),
    metadata: jsonb('metadata').$type<Record<string, string>>(),
    // Where core's hosted checkout callback sends the shopper after a payment, and back to on a failure or cancel
    returnUrl: varchar('return_url', { length: 2048 }),
    retryUrl: varchar('retry_url', { length: 2048 }),
    failureCode: varchar('failure_code', { length: 100 }),
    failureMessage: text('failure_message'),
    succeededAt: timestamp('succeeded_at', { withTimezone: true }),
    refundedAt: timestamp('refunded_at', { withTimezone: true }),
    refundReference: varchar('refund_reference', { length: 100 }),
    refundFailureMessage: text('refund_failure_message'),
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
    // One intent per gateway order within an account, so a webhook or a read-back can only ever land on one payment
    uniqueIndex('uq_payment_intents_provider_order')
      .on(table.configId, table.providerOrderId)
      .where(sql`provider_order_id IS NOT NULL`),
    index('idx_payment_intents_config').on(table.configId),
    index('idx_payment_intents_reference').on(table.organizationId, table.referenceType, table.referenceId),
    index('idx_payment_intents_target').on(table.organizationId, table.targetId),
    // A target has at most one active payment: paying again cancels the one still waiting before it opens another
    uniqueIndex('uq_payment_intents_one_active_per_target')
      .on(table.organizationId, table.targetId)
      .where(sql`target_id IS NOT NULL AND status IN ('CREATED', 'REQUIRES_ACTION', 'PROCESSING')`),
    // Whatever is paid for has at most one active payment: paying again for the same reference replaces the waiting one
    uniqueIndex('uq_payment_intents_one_active_per_reference')
      .on(table.organizationId, table.referenceType, table.referenceId)
      .where(sql`status IN ('CREATED', 'REQUIRES_ACTION', 'PROCESSING')`),
    index('idx_payment_intents_expiry').on(table.status, table.expiresAt),
    orgIsolationPolicy(),
  ],
);

export type PaymentIntent = typeof paymentIntents.$inferSelect;
export type NewPaymentIntent = typeof paymentIntents.$inferInsert;
