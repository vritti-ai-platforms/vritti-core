import { sql } from '@vritti/api-sdk/drizzle-orm';
import { index, jsonb, text, timestamp, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { paymentAttemptStatusEnum } from './enums';
import { paymentIntents } from './payment-intents';
import { paymentsSchema } from './payments-schema';
import { organizationIdColumn, orgIsolationPolicy } from './workspace-scope';

export const paymentAttempts = paymentsSchema.table(
  'payment_attempts',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: organizationIdColumn,
    intentId: uuid('intent_id')
      .notNull()
      .references(() => paymentIntents.id, { onDelete: 'cascade' }),
    providerPaymentId: varchar('provider_payment_id', { length: 100 }),
    status: paymentAttemptStatusEnum('status').notNull().default('CREATED'),
    method: varchar('method', { length: 30 }),
    errorCode: varchar('error_code', { length: 100 }),
    errorMessage: text('error_message'),
    raw: jsonb('raw').$type<unknown>(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [index('idx_payment_attempts_intent').on(table.intentId), orgIsolationPolicy()],
);

export type PaymentAttempt = typeof paymentAttempts.$inferSelect;
export type NewPaymentAttempt = typeof paymentAttempts.$inferInsert;
