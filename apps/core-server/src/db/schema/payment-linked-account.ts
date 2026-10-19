import { sql } from '@vritti/api-sdk/drizzle-orm';
import { index, jsonb, pgPolicy, text, timestamp, unique, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { bankAccounts } from './bank-account';
import { coreSchema } from './core-schema';
import { paymentLinkedAccountStatusEnum } from './enums';
import { organizations } from './organizations';
import { paymentGatewayConfigs } from './payment-gateway-config';

export const paymentLinkedAccounts = coreSchema.table(
  'payment_linked_accounts',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    collectorConfigId: uuid('collector_config_id')
      .notNull()
      .references(() => paymentGatewayConfigs.id, { onDelete: 'restrict' }),
    bankAccountId: uuid('bank_account_id')
      .notNull()
      .references(() => bankAccounts.id, { onDelete: 'restrict' }),
    // The receiver's id at the provider (Razorpay acc_…, a Cashfree vendor id, …); null until the provider creates it
    providerAccountId: varchar('provider_account_id', { length: 100 }),
    // Opaque references only the gateway's transport reads, returned at creation and sent back on status checks
    providerData: jsonb('provider_data').$type<Record<string, string>>().notNull().default({}),
    status: paymentLinkedAccountStatusEnum('status').notNull().default('PENDING'),
    transfersAllowedAt: timestamp('transfers_allowed_at'),
    lastError: text('last_error'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_payment_linked_accounts_collector_bank').on(table.collectorConfigId, table.bankAccountId),
    index('idx_payment_linked_accounts_collector').on(table.collectorConfigId),
    index('idx_payment_linked_accounts_bank_account').on(table.bankAccountId),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select nullif(current_setting('app.org_id', true), '')::uuid)`,
    }),
  ],
);

export type PaymentLinkedAccount = typeof paymentLinkedAccounts.$inferSelect;
export type NewPaymentLinkedAccount = typeof paymentLinkedAccounts.$inferInsert;
