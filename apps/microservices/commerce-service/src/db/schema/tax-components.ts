import { sql } from '@vritti/api-sdk/drizzle-orm';
import {
  type AnyPgColumn,
  boolean,
  check,
  codeCheck,
  index,
  timestamp,
  unique,
  uuid,
  varchar,
} from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { taxAuthorityLevelEnum } from './enums';
import { organizationIdColumn, orgIsolationPolicy } from './workspace-scope';

export const taxComponents = commerceSchema.table(
  'tax_components',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: organizationIdColumn,
    countryCode: varchar('country_code', { length: 2 }).notNull(),
    code: varchar('code', { length: 50 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    authorityLevel: taxAuthorityLevelEnum('authority_level').notNull(),
    standsInForId: uuid('stands_in_for_id').references((): AnyPgColumn => taxComponents.id),
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
    unique('uq_tax_components_org_country_code').on(table.organizationId, table.countryCode, table.code),
    index('idx_tax_components_org_country').on(table.organizationId, table.countryCode),
    codeCheck('tax_components_code_chk', table.code),
    check('tax_components_stands_in_for_chk', sql`${table.standsInForId} <> ${table.id}`),
    orgIsolationPolicy(),
  ],
);

export type TaxComponent = typeof taxComponents.$inferSelect;
export type NewTaxComponent = typeof taxComponents.$inferInsert;
