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

// A collector: an organization's own gateway account (ORG) or one of Vritti's on this deployment (PLATFORM, no
// organization). The org id is the visibility mechanism: NULL means platform, readable by every organization and
// written only by cloud admin calls, which run with no org context and can therefore reach nothing else. A config
// only names a gateway account; which one a payment uses is decided by the payout account of the legal entity or
// site, so nothing here marks a row as default or live.
export const paymentGatewayConfigs = coreSchema.table(
  'payment_gateway_configs',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
    kind: paymentGatewayConfigKindEnum('kind').notNull(),
    gatewayCode: varchar('gateway_code', { length: 100 }).notNull(),
    label: varchar('label', { length: 100 }).notNull(),
    keyId: varchar('key_id', { length: 255 }).notNull(),
    credentials: text('credentials').notNull(),
    webhookSecret: text('webhook_secret'),
    // The main account's id at the gateway (a Razorpay acc_…). A payout account that names it keeps its share there
    gatewayAccountId: varchar('gateway_account_id', { length: 100 }).notNull(),
    platformFeeBps: integer('platform_fee_bps').notNull().default(0),
    verifiedAt: timestamp('verified_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_payment_gateway_configs_org_label').on(table.organizationId, table.label).nullsNotDistinct(),
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
