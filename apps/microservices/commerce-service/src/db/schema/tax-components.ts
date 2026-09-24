import { boolean, codeCheck, index, timestamp, unique, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { taxAuthorityLevelEnum } from './enums';
import { organizationIdColumn, orgIsolationPolicy } from './workspace-scope';

export const taxComponents = commerceSchema.table(
  'tax_components',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: organizationIdColumn,
    code: varchar('code', { length: 50 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    authorityLevel: taxAuthorityLevelEnum('authority_level').notNull(),
    isRecoverable: boolean('is_recoverable').notNull().default(true),
    isWithholding: boolean('is_withholding').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    isSystem: boolean('is_system').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_tax_components_org_code').on(table.organizationId, table.code),
    index('idx_tax_components_org').on(table.organizationId),
    codeCheck('tax_components_code_chk', table.code),
    orgIsolationPolicy(),
  ],
);

export type TaxComponent = typeof taxComponents.$inferSelect;
export type NewTaxComponent = typeof taxComponents.$inferInsert;
