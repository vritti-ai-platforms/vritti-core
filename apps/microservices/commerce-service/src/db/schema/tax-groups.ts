import { sql } from '@vritti/api-sdk/drizzle-orm';
import { boolean, codeCheck, index, text, timestamp, unique, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { taxTreatmentEnum } from './enums';
import { organizationIdColumn, orgIsolationPolicy } from './workspace-scope';

export const taxGroups = commerceSchema.table(
  'tax_groups',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: organizationIdColumn(),
    countryCode: varchar('country_code', { length: 2 }).notNull(),
    code: varchar('code', { length: 50 }).notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    treatment: taxTreatmentEnum('treatment').notNull(),
    legalText: text('legal_text'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_tax_groups_org_country_code').on(table.organizationId, table.countryCode, table.code),
    index('idx_tax_groups_org_country').on(table.organizationId, table.countryCode),
    codeCheck('tax_groups_code_chk', table.code),
    orgIsolationPolicy(),
  ],
);

export type TaxGroup = typeof taxGroups.$inferSelect;
export type NewTaxGroup = typeof taxGroups.$inferInsert;
