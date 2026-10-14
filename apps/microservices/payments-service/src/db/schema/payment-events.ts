import { sql } from '@vritti/api-sdk/drizzle-orm';
import { index, jsonb, timestamp, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { paymentEventStatusEnum } from './enums';
import { paymentIntents } from './payment-intents';
import { paymentsSchema } from './payments-schema';
import { organizationIdColumn, orgIsolationPolicy } from './workspace-scope';

// The outbox of what happened to an intent, for core to act on. Written in the same transaction as the
// state change it reports, so an intent never succeeds without its event; core acknowledges an event once it
// has dispatched it, and anything left PENDING is picked up again by core's sweep.
export const paymentEvents = paymentsSchema.table(
  'payment_events',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: organizationIdColumn,
    intentId: uuid('intent_id')
      .notNull()
      .references(() => paymentIntents.id, { onDelete: 'cascade' }),
    type: varchar('type', { length: 100 }).notNull(),
    payload: jsonb('payload').$type<Record<string, unknown>>().notNull(),
    status: paymentEventStatusEnum('status').notNull().default('PENDING'),
    ackedAt: timestamp('acked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_payment_events_pending').on(table.organizationId, table.status, table.createdAt),
    index('idx_payment_events_intent').on(table.intentId),
    orgIsolationPolicy(),
  ],
);

export type PaymentEvent = typeof paymentEvents.$inferSelect;
export type NewPaymentEvent = typeof paymentEvents.$inferInsert;
