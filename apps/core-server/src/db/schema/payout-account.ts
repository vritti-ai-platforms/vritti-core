import { sql } from '@vritti/api-sdk/drizzle-orm';
import {
  boolean,
  foreignKey,
  index,
  pgPolicy,
  timestamp,
  unique,
  uuid,
  varchar,
} from '@vritti/api-sdk/drizzle-pg-core';
import { bankAccounts } from './bank-account';
import { coreSchema } from './core-schema';
import { legalEntities } from './legal-entity';
import { organizations } from './organizations';
import { paymentGatewayConfigs } from './payment-gateway-config';

// A bank account of a legal entity, reached through one account at one gateway (a Razorpay acc_…, a Cashfree vendor
// id). The same bank account can be reached through several gateways, each with its own id. Where it is used — the
// legal entity, a site, an app, a channel — lives on payout channels. Nothing is checked with the gateway: the id is
// stored as entered.
export const payoutAccounts = coreSchema.table(
  'payout_accounts',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    legalEntityId: uuid('legal_entity_id')
      .notNull()
      .references(() => legalEntities.id, { onDelete: 'restrict' }),
    paymentGatewayConfigId: uuid('payment_gateway_config_id')
      .notNull()
      .references(() => paymentGatewayConfigs.id, { onDelete: 'restrict' }),
    bankAccountId: uuid('bank_account_id').notNull(),
    // The receiving account's id at the gateway (a Razorpay acc_…), as the merchant entered it
    gatewayAccountId: varchar('gateway_account_id', { length: 100 }).notNull(),
    // Set by core: true when gatewayAccountId is the gateway config's own main account, so the share stays there and
    // no transfer is made; false when it is a linked account the share is transferred to at order creation
    isMainAccount: boolean('is_main_account').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    // The bank account must be held by the same legal entity the row pays
    foreignKey({
      name: 'payout_accounts_bank_account_le_fkey',
      columns: [table.bankAccountId, table.legalEntityId],
      foreignColumns: [bankAccounts.id, bankAccounts.legalEntityId],
    }).onDelete('restrict'),
    // Lets payout channels require, through one composite key, that their payout account is the same legal entity's
    unique('uq_payout_accounts_id_le').on(table.id, table.legalEntityId),
    // A gateway account is one payout account; this also keeps a gateway's main account to one legal entity
    unique('uq_payout_accounts_config_account').on(table.paymentGatewayConfigId, table.gatewayAccountId),
    index('idx_payout_accounts_le').on(table.legalEntityId),
    index('idx_payout_accounts_config').on(table.paymentGatewayConfigId),
    index('idx_payout_accounts_bank_account').on(table.bankAccountId),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select nullif(current_setting('app.org_id', true), '')::uuid)`,
    }),
  ],
);

export type PayoutAccount = typeof payoutAccounts.$inferSelect;
export type NewPayoutAccount = typeof payoutAccounts.$inferInsert;
