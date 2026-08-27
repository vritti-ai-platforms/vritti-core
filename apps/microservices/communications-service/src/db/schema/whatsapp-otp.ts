import { sql } from '@vritti/api-sdk/drizzle-orm';
import { boolean, index, integer, pgPolicy, text, timestamp, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { communicationsSchema } from './communications-schema';

export const whatsappOtps = communicationsSchema.table(
  'whatsapp_otps',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    appId: uuid('app_id').notNull(),
    accountId: uuid('account_id').notNull(),
    recipient: varchar('recipient', { length: 32 }).notNull(),
    codeHash: varchar('code_hash', { length: 255 }).notNull(),
    attempts: integer('attempts').notNull().default(0),
    // Captured at send time so editing the config never re-budgets a code already in flight
    maxAttempts: integer('max_attempts').notNull(),
    isVerified: boolean('is_verified').notNull().default(false),
    messageId: varchar('message_id', { length: 128 }),
    // Meta's asynchronous delivery outcome, correlated back by messageId. A failure here also writes
    // `error`, so a code that never reached a handset stops counting as sent.
    deliveryStatus: varchar('delivery_status', { length: 32 }),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }),
    error: text('error'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_whatsapp_otps_org').on(table.organizationId),
    // Newest live code for a credential and number — the verify hot path
    index('idx_whatsapp_otps_lookup').on(table.appId, table.recipient, table.expiresAt),
    index('idx_whatsapp_otps_account').on(table.accountId),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select current_setting('app.org_id', true)::uuid)`,
    }),
  ],
);

export type WhatsappOtp = typeof whatsappOtps.$inferSelect;
export type NewWhatsappOtp = typeof whatsappOtps.$inferInsert;
