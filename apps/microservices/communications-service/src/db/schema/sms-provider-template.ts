import { sql } from '@vritti/api-sdk/drizzle-orm';
import { index, jsonb, pgPolicy, timestamp, unique, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { communicationsSchema } from './communications-schema';

/**
 * Templates registered against an SMS provider.
 *
 * The WhatsApp equivalent is not stored at all — Meta exposes `GET /{waba}/message_templates`, so
 * that tab reads live on every load and the WABA stays the single source of truth. MSG91 offers no
 * such endpoint for SMS: its only template read is `GET /v5/flow/getVersions`, which **requires** a
 * `template_id` you already hold. (Its Email and WhatsApp channels both have list endpoints; SMS
 * simply does not.) So an account's templates cannot be enumerated, and these rows ARE the list.
 *
 * MSG91 stays the source of truth for content: a row is only written after the vendor confirms the
 * ID exists on that auth key's account, and `details` holds what it returned. That snapshot goes
 * stale if someone edits the template in the MSG91 panel, which is what `syncedAt` and the per-row
 * refresh are for.
 */
export const smsProviderTemplates = communicationsSchema.table(
  'sms_provider_templates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
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
    /**
     * The raw `getVersions` payload, exactly as MSG91 returned it.
     *
     * Stored whole instead of unpacked into columns because MSG91 publishes no schema for this
     * response — the vendor's own OpenAPI document describes the request and leaves the body as an
     * undescribed `200`. Committing to guessed column names would bake a guess into a migration;
     * this keeps every field that arrives, and promoting the ones that prove useful to real columns
     * later is a widening change rather than a rewrite.
     */
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
