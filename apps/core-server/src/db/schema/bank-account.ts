import { sql } from '@vritti/api-sdk/drizzle-orm';
import { index, pgPolicy, timestamp, uniqueIndex, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { coreSchema } from './core-schema';
import { legalEntities } from './legal-entity';
import { organizations } from './organizations';

export const bankAccounts = coreSchema.table(
  'bank_accounts',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    legalEntityId: uuid('legal_entity_id')
      .notNull()
      .references(() => legalEntities.id, { onDelete: 'restrict' }),
    label: varchar('label', { length: 100 }),
    accountHolderName: varchar('account_holder_name', { length: 255 }).notNull(),
    accountNumber: varchar('account_number', { length: 50 }).notNull(),
    ifscCode: varchar('ifsc_code', { length: 11 }).notNull(),
    bankName: varchar('bank_name', { length: 255 }).notNull(),
    branchName: varchar('branch_name', { length: 255 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('uq_bank_accounts_le_number').on(table.legalEntityId, table.accountNumber, table.ifscCode),
    index('idx_bank_accounts_le').on(table.legalEntityId),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select nullif(current_setting('app.org_id', true), '')::uuid)`,
    }),
  ],
);

export type BankAccount = typeof bankAccounts.$inferSelect;
export type NewBankAccount = typeof bankAccounts.$inferInsert;
