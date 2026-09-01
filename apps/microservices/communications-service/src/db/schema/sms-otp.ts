import { sql } from '@vritti/api-sdk/drizzle-orm';
import { boolean, index, integer, pgPolicy, text, timestamp, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { communicationsSchema } from './communications-schema';

export const smsOtps = communicationsSchema.table(
  'sms_otps',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    appId: uuid('app_id').notNull(),
    // The sms_providers row that carried the code, plus its provider code denormalized at send
    // time — stats stay attributable even after the provider row is edited or removed
    providerId: uuid('provider_id').notNull(),
    provider: varchar('provider', { length: 32 }).notNull(),
    recipient: varchar('recipient', { length: 32 }).notNull(),
    codeHash: varchar('code_hash', { length: 255 }).notNull(),
    attempts: integer('attempts').notNull().default(0),
    // Captured at send time so editing the config never re-budgets a code already in flight
    maxAttempts: integer('max_attempts').notNull(),
    isVerified: boolean('is_verified').notNull().default(false),
    // Provider message id when the vendor issues one; the console transport never does
    messageId: varchar('message_id', { length: 128 }),
    // Vendor delivery callbacks land here when a real provider ships its webhook; a failure also
    // writes `error`, so a code that never reached a handset stops counting as sent
    deliveryStatus: varchar('delivery_status', { length: 32 }),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }),
    error: text('error'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_sms_otps_org').on(table.organizationId),
    // Newest live code for a credential and number — the verify hot path
    index('idx_sms_otps_lookup').on(table.appId, table.recipient, table.expiresAt),
    index('idx_sms_otps_provider').on(table.providerId),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select current_setting('app.org_id', true)::uuid)`,
    }),
  ],
);

export type SmsOtp = typeof smsOtps.$inferSelect;
export type NewSmsOtp = typeof smsOtps.$inferInsert;
