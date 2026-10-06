import type { FeatureUnlocks } from '@vritti/api-sdk/catalog-resolver';
import { sql } from '@vritti/api-sdk/drizzle-orm';
import { boolean, index, jsonb, text, timestamp, uniqueIndex, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { coreSchema } from './core-schema';
import { appTypeEnum } from './enums';
import { organizations } from './organizations';

export interface AppWhatsappOtpConfig {
  accountId: string;
  phoneNumberId: string;
  templateName: string;
  templateLanguage: string;
  codeLength: number;
  expirySeconds: number;
  maxAttempts: number;
  resendCooldownSeconds: number;
}

// The SMS sibling: delivery is addressed by an sms_providers row (platform or the org's own)
// instead of a WABA + number + template; the provider code and credentials live on that row
export interface AppSmsOtpConfig {
  providerId: string;
  // The provider's template the code is rendered into. Required for providers whose transport
  // declares requiresTemplate (MSG91, for DLT); absent for the console transport.
  templateId?: string;
  senderId?: string;
  codeLength: number;
  expirySeconds: number;
  maxAttempts: number;
  resendCooldownSeconds: number;
}

export const apps = coreSchema.table(
  'apps',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    // The public identifier the client sends
    clientId: varchar('client_id', { length: 64 }).notNull(),
    name: varchar('name', { length: 120 }).notNull(),
    type: appTypeEnum('type').notNull(),
    // What this credential is allowed to do, keyed by bare feature code
    permissions: jsonb('permissions').$type<FeatureUnlocks>().notNull().default({}),
    whatsappOtpConfig: jsonb('whatsapp_otp_config').$type<AppWhatsappOtpConfig>(),
    smsOtpConfig: jsonb('sms_otp_config').$type<AppSmsOtpConfig>(),
    // Ed25519 private key, base64 pkcs8 DER. Goes in the client's environment
    signingKey: text('signing_key').notNull(),
    // Ed25519 public key, base64 spki DER. What request signatures verify against
    signingPublicKey: text('signing_public_key').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    // The hot path — resolved on every signed request from a client.
    uniqueIndex('apps_client_id_unique').on(table.clientId),
    index('idx_apps_org').on(table.organizationId),
  ],
);

export type App = typeof apps.$inferSelect;
export type NewApp = typeof apps.$inferInsert;
