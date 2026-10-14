import { sql } from '@vritti/api-sdk/drizzle-orm';
import {
  boolean,
  codeCheck,
  index,
  pgPolicy,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from '@vritti/api-sdk/drizzle-pg-core';
import { apps } from './apps';
import { bankAccounts } from './bank-account';
import { coreSchema } from './core-schema';
import { paymentGatewayConfigTypeEnum } from './enums';
import { legalEntities } from './legal-entity';
import { organizations } from './organizations';
import { sites } from './site';

export const paymentGatewayConfigs = coreSchema.table(
  'payment_gateway_configs',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    legalEntityId: uuid('legal_entity_id')
      .notNull()
      .references(() => legalEntities.id, { onDelete: 'restrict' }),
    type: paymentGatewayConfigTypeEnum('type').notNull(),
    siteId: uuid('site_id').references(() => sites.id, { onDelete: 'restrict' }),
    appId: uuid('app_id').references(() => apps.id, { onDelete: 'restrict' }),
    gatewayCode: varchar('gateway_code', { length: 100 }).notNull(),
    bankAccountId: uuid('bank_account_id')
      .notNull()
      .references(() => bankAccounts.id, { onDelete: 'restrict' }),
    label: varchar('label', { length: 100 }),
    keyId: varchar('key_id', { length: 255 }).notNull(),
    credentials: text('credentials').notNull(),
    webhookSecret: text('webhook_secret'),
    providerMerchantId: varchar('provider_merchant_id', { length: 100 }),
    splitEnabled: boolean('split_enabled').notNull().default(false),
    verifiedAt: timestamp('verified_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_payment_gateway_configs_scope')
      .on(table.legalEntityId, table.type, table.gatewayCode, table.siteId, table.appId)
      .nullsNotDistinct(),
    codeCheck('payment_gateway_configs_gateway_code_chk', table.gatewayCode),
    index('idx_payment_gateway_configs_le').on(table.legalEntityId),
    index('idx_payment_gateway_configs_bank_account').on(table.bankAccountId),
    index('idx_payment_gateway_configs_site').on(table.siteId),
    index('idx_payment_gateway_configs_app').on(table.appId),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select nullif(current_setting('app.org_id', true), '')::uuid)`,
    }),
  ],
);

export type PaymentGatewayConfig = typeof paymentGatewayConfigs.$inferSelect;
export type NewPaymentGatewayConfig = typeof paymentGatewayConfigs.$inferInsert;
