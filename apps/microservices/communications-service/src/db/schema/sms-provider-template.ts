import { sql } from '@vritti/api-sdk/drizzle-orm';
import { index, jsonb, pgPolicy, timestamp, unique, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { communicationsSchema } from './communications-schema';

export const smsProviderTemplates = communicationsSchema.table(
  'sms_provider_templates',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    // No FK, matching every other table in this schema (sms_otps references its provider the same
    // way). Deleting a provider therefore leaves these rows behind — the service cascades.
    providerId: uuid('provider_id').notNull(),
    // The vendor's own identifier, passed as `template_id` when sending. Not a UUID — MSG91 mints
    // its own format, so it is stored and compared as an opaque string.
    templateId: varchar('template_id', { length: 64 }).notNull(),
    // Operator-supplied label. Deliberately ours rather than the vendor's: `getVersions` has no
    // documented response schema, so nothing from MSG91 can be relied on to name a row in a list.
    name: varchar('name', { length: 255 }).notNull(),
    // The raw `getVersions` payload, exactly as MSG91 returned it
    details: jsonb('details').$type<Record<string, unknown>>().notNull().default({}),
    // When `details` was last read from MSG91 — the age of the snapshot, not of the row
    syncedAt: timestamp('synced_at', { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    // A template ID means nothing outside the account that owns it, so uniqueness is per provider
    // rather than per organization — two MSG91 accounts may legitimately both be registered
    unique('uq_sms_provider_templates_provider_template').on(table.providerId, table.templateId),
    index('idx_sms_provider_templates_provider').on(table.providerId),
    index('idx_sms_provider_templates_org').on(table.organizationId),
    // Strict org scoping, like sms_otps — there is no platform-row equivalent here: a template
    // belongs to whichever account's credentials proved it exists
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select current_setting('app.org_id', true)::uuid)`,
    }),
  ],
);

export type SmsProviderTemplate = typeof smsProviderTemplates.$inferSelect;
export type NewSmsProviderTemplate = typeof smsProviderTemplates.$inferInsert;
