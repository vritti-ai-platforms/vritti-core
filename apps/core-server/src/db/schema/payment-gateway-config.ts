import { sql } from '@vritti/api-sdk/drizzle-orm';
import {
  check,
  codeCheck,
  integer,
  pgPolicy,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from '@vritti/api-sdk/drizzle-pg-core';
import { coreSchema } from './core-schema';
import { paymentGatewayConfigKindEnum } from './enums';
import { organizations } from './organizations';

export const paymentGatewayConfigs = coreSchema.table(
  'payment_gateway_configs',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
    kind: paymentGatewayConfigKindEnum('kind').notNull(),
    gatewayCode: varchar('gateway_code', { length: 100 }).notNull(),
    keyId: varchar('key_id', { length: 255 }).notNull(),
    credentials: text('credentials').notNull(),
    webhookSecret: text('webhook_secret'),
    // The main account's id at the gateway (a Razorpay acc_…). A payout account that names it keeps its share there
    gatewayAccountId: varchar('gateway_account_id', { length: 100 }).notNull(),
    platformFeeBps: integer('platform_fee_bps').notNull().default(0),
    // The catalog gateway's logos, copied from Vritti Cloud whenever the config is saved, for checkout to show
    logoLightUrl: varchar('logo_light_url', { length: 1000 }),
    logoDarkUrl: varchar('logo_dark_url', { length: 1000 }),
    // When the stored API credentials last passed the gateway's check — every save verifies them first
    verifiedAt: timestamp('verified_at'),
    // When the first webhook signed with this config's secret reached its URL — the proof that the URL and secret
    // registered in the gateway's dashboard match. Cleared when the gateway, credentials or secret change
    webhookVerifiedAt: timestamp('webhook_verified_at'),
    // When the latest signed webhook arrived, so a webhook that later stops can be noticed
    lastWebhookAt: timestamp('last_webhook_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    // NULLS NOT DISTINCT makes the platform rows (no organization) one group, so each group has one row per gateway
    unique('uq_payment_gateway_configs_org_gateway').on(table.organizationId, table.gatewayCode).nullsNotDistinct(),
    // Lets payout accounts carry their config's gateway code through one composite key
    unique('uq_payment_gateway_configs_id_gateway').on(table.id, table.gatewayCode),
    codeCheck('payment_gateway_configs_gateway_code_chk', table.gatewayCode),
    check(
      'payment_gateway_configs_kind_org_chk',
      sql`(${table.kind} = 'PLATFORM' AND ${table.organizationId} IS NULL) OR (${table.kind} = 'ORG' AND ${table.organizationId} IS NOT NULL)`,
    ),
    check(
      'payment_gateway_configs_fee_bps_chk',
      sql`${table.platformFeeBps} >= 0 AND ${table.platformFeeBps} <= 10000`,
    ),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id IS NULL OR organization_id = (select nullif(current_setting('app.org_id', true), '')::uuid)`,
    }),
  ],
);

export type PaymentGatewayConfig = typeof paymentGatewayConfigs.$inferSelect;
export type NewPaymentGatewayConfig = typeof paymentGatewayConfigs.$inferInsert;
