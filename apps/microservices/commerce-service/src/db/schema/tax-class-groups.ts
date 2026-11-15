import { sql } from '@vritti/api-sdk/drizzle-orm';
import { bigint, check, date, index, timestamp, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { taxClasses } from './tax-classes';
import { taxGroups } from './tax-groups';
import { organizationIdColumn, orgIsolationPolicy } from './workspace-scope';

export const taxClassGroups = commerceSchema.table(
  'tax_class_groups',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: organizationIdColumn(),
    countryCode: varchar('country_code', { length: 2 }).notNull(),
    taxClassId: uuid('tax_class_id')
      .notNull()
      .references(() => taxClasses.id, { onDelete: 'cascade' }),
    taxGroupId: uuid('tax_group_id')
      .notNull()
      .references(() => taxGroups.id),
    maxUnitPrice: bigint('max_unit_price', { mode: 'bigint' }),
    currencyCode: varchar('currency_code', { length: 3 }),
    validFrom: date('valid_from', { mode: 'string' }).notNull(),
    validTo: date('valid_to', { mode: 'string' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('idx_tax_class_groups_org_country_class').on(table.organizationId, table.countryCode, table.taxClassId),
    index('idx_tax_class_groups_group').on(table.taxGroupId),
    check('tax_class_groups_price_limit_chk', sql`(${table.maxUnitPrice} is null) = (${table.currencyCode} is null)`),
    check('tax_class_groups_validity_chk', sql`${table.validTo} is null or ${table.validTo} >= ${table.validFrom}`),
    orgIsolationPolicy(),
  ],
);

export type TaxClassGroup = typeof taxClassGroups.$inferSelect;
export type NewTaxClassGroup = typeof taxClassGroups.$inferInsert;
