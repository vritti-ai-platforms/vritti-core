import { sql } from '@vritti/api-sdk/drizzle-orm';
import { boolean, index, jsonb, pgPolicy, timestamp, unique, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { communicationsSchema } from './communications-schema';

// PLATFORM rows are Vritti-owned senders every organization may use; CLIENT rows are an
// organization's own provider account. The org id is the visibility mechanism: NULL means platform.
export const SMS_PROVIDER_TYPES = ['PLATFORM', 'CLIENT'] as const;
export type SmsProviderType = (typeof SMS_PROVIDER_TYPES)[number];

// Registry codes — each has an implementation that knows its credential shape:
//   CONSOLE → {} (logs the message; dev only)
//   MSG91   → { authKey }
//   TWILIO  → { accountSid, authToken, messagingServiceSid? }
export const SMS_PROVIDER_CODES = ['CONSOLE', 'MSG91', 'TWILIO'] as const;
export type SmsProviderCode = (typeof SMS_PROVIDER_CODES)[number];

export const smsProviders = communicationsSchema.table(
  'sms_providers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // Nullable, unlike the WhatsApp tables: platform rows carry no organization. Client inserts
    // omit the column and the RLS GUC fills it; platform inserts pass an explicit null, which
    // bypasses the default (evaluating it without an org context would error).
    organizationId: uuid('organization_id').default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    type: varchar('type', { length: 16 }).notNull().$type<SmsProviderType>(),
    provider: varchar('provider', { length: 32 }).notNull().$type<SmsProviderCode>(),
    name: varchar('name', { length: 255 }).notNull(),
    // Provider-specific secrets, shape owned by each registry implementation. Never leaves the
    // service in a DTO — same posture as whatsapp_accounts.access_token.
    credentials: jsonb('credentials').$type<Record<string, unknown>>().notNull().default({}),
    // Default originator (sender id / from number); an app's OTP config may override it
    senderId: varchar('sender_id', { length: 64 }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_sms_providers_org_name').on(table.organizationId, table.name),
    index('idx_sms_providers_org').on(table.organizationId),
    // Reads see the org's own rows plus every platform row; writes on platform rows are blocked at
    // the service layer (the org API rejects type=PLATFORM), while internal cloud calls run with no
    // org GUC and therefore can only ever see the NULL-org rows.
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id IS NULL OR organization_id = (select current_setting('app.org_id', true)::uuid)`,
    }),
  ],
);

export type SmsProvider = typeof smsProviders.$inferSelect;
export type NewSmsProvider = typeof smsProviders.$inferInsert;
