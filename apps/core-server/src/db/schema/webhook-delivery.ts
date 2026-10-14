import { sql } from '@vritti/api-sdk/drizzle-orm';
import {
  index,
  integer,
  jsonb,
  pgPolicy,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from '@vritti/api-sdk/drizzle-pg-core';
import { appWebhookEndpoints } from './app-webhook-endpoint';
import { apps } from './apps';
import { coreSchema } from './core-schema';
import { webhookDeliveryStatusEnum } from './enums';
import { organizations } from './organizations';

export const webhookDeliveries = coreSchema.table(
  'webhook_deliveries',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    appId: uuid('app_id')
      .notNull()
      .references(() => apps.id, { onDelete: 'cascade' }),
    endpointId: uuid('endpoint_id')
      .notNull()
      .references(() => appWebhookEndpoints.id, { onDelete: 'cascade' }),
    eventId: varchar('event_id', { length: 100 }).notNull(),
    eventType: varchar('event_type', { length: 100 }).notNull(),
    payload: jsonb('payload').$type<Record<string, unknown>>().notNull(),
    status: webhookDeliveryStatusEnum('status').notNull().default('PENDING'),
    attempts: integer('attempts').notNull().default(0),
    nextAttemptAt: timestamp('next_attempt_at', { withTimezone: true }).defaultNow().notNull(),
    lastStatusCode: integer('last_status_code'),
    lastError: text('last_error'),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique('uq_webhook_deliveries_endpoint_event').on(table.endpointId, table.eventId),
    index('idx_webhook_deliveries_status_next_attempt').on(table.status, table.nextAttemptAt),
    index('idx_webhook_deliveries_app').on(table.appId),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select nullif(current_setting('app.org_id', true), '')::uuid)`,
    }),
  ],
);

export type WebhookDelivery = typeof webhookDeliveries.$inferSelect;
export type NewWebhookDelivery = typeof webhookDeliveries.$inferInsert;
