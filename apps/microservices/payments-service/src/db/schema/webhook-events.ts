import { sql } from '@vritti/api-sdk/drizzle-orm';
import { index, jsonb, text, timestamp, unique, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { webhookEventStatusEnum } from './enums';
import { paymentsSchema } from './payments-schema';
import { organizationIdColumn, orgIsolationPolicy } from './workspace-scope';

export const webhookEvents = paymentsSchema.table(
  'webhook_events',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: organizationIdColumn,
    configId: uuid('config_id').notNull(),
    gatewayCode: varchar('gateway_code', { length: 100 }).notNull(),
    // Derived from signed content by the transport — what makes a delivery unique within an organization
    dedupeKey: varchar('dedupe_key', { length: 150 }).notNull(),
    // The provider's own event id, for tracing only (Razorpay sends it in an unsigned header)
    providerEventId: varchar('provider_event_id', { length: 150 }).notNull(),
    eventType: varchar('event_type', { length: 100 }).notNull(),
    payloadHash: varchar('payload_hash', { length: 64 }).notNull(),
    payload: jsonb('payload').$type<unknown>().notNull(),
    status: webhookEventStatusEnum('status').notNull().default('RECEIVED'),
    error: text('error'),
    receivedAt: timestamp('received_at', { withTimezone: true }).defaultNow().notNull(),
    processedAt: timestamp('processed_at', { withTimezone: true }),
  },
  (table) => [
    // Per organization: RLS only lets a request see its own organization's rows, so a key spanning
    // organizations would collide on rows the dedupe lookup can never find
    unique('uq_webhook_events_org_gateway_dedupe').on(table.organizationId, table.gatewayCode, table.dedupeKey),
    index('idx_webhook_events_config_received').on(table.configId, table.receivedAt),
    orgIsolationPolicy(),
  ],
);

export type WebhookEvent = typeof webhookEvents.$inferSelect;
export type NewWebhookEvent = typeof webhookEvents.$inferInsert;
