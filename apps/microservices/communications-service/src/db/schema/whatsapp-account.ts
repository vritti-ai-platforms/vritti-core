import { sql } from '@vritti/api-sdk/drizzle-orm';
import {
  boolean,
  index,
  pgPolicy,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from '@vritti/api-sdk/drizzle-pg-core';
import { communicationsSchema } from './communications-schema';

export const whatsappAccounts = communicationsSchema.table(
  'whatsapp_accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    legalEntityId: uuid('legal_entity_id'),
    metaBusinessId: varchar('meta_business_id', { length: 64 }).notNull(),
    wabaId: varchar('waba_id', { length: 64 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    accessToken: text('access_token').notNull(),
    isDefault: boolean('is_default').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_whatsapp_accounts_org_waba').on(table.organizationId, table.wabaId),
    // Partial index so only one row per org can hold the default sender flag
    uniqueIndex('uq_whatsapp_accounts_org_default').on(table.organizationId).where(sql`is_default = true`),
    index('idx_whatsapp_accounts_org').on(table.organizationId),
    index('idx_whatsapp_accounts_le').on(table.legalEntityId),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select current_setting('app.org_id', true)::uuid)`,
    }),
  ],
);

export type WhatsappAccount = typeof whatsappAccounts.$inferSelect;
export type NewWhatsappAccount = typeof whatsappAccounts.$inferInsert;
