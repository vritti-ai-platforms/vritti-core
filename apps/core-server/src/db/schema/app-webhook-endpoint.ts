import { sql } from '@vritti/api-sdk/drizzle-orm';
import { boolean, index, pgPolicy, text, timestamp, unique, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { apps } from './apps';
import { coreSchema } from './core-schema';
import { organizations } from './organizations';

export const PAYMENT_WEBHOOK_EVENT_TYPES = [
  'payment_intent.succeeded',
  'payment_intent.payment_failed',
  'payment_intent.expired',
] as const;
export type PaymentWebhookEventType = (typeof PAYMENT_WEBHOOK_EVENT_TYPES)[number];

export const appWebhookEndpoints = coreSchema.table(
  'app_webhook_endpoints',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    appId: uuid('app_id')
      .notNull()
      .references(() => apps.id, { onDelete: 'cascade' }),
    url: varchar('url', { length: 2000 }).notNull(),
    events: text('events')
      .array()
      .notNull()
      .default(
        sql`ARRAY['payment_intent.succeeded', 'payment_intent.payment_failed', 'payment_intent.expired']::text[]`,
      ),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_app_webhook_endpoints_app').on(table.appId),
    index('idx_app_webhook_endpoints_org').on(table.organizationId),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select nullif(current_setting('app.org_id', true), '')::uuid)`,
    }),
  ],
);

export type AppWebhookEndpoint = typeof appWebhookEndpoints.$inferSelect;
export type NewAppWebhookEndpoint = typeof appWebhookEndpoints.$inferInsert;
