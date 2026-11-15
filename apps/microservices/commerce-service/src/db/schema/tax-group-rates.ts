import { sql } from '@vritti/api-sdk/drizzle-orm';
import {
  bigint,
  check,
  date,
  decimal,
  index,
  integer,
  timestamp,
  uuid,
  varchar,
} from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { taxBaseEnum, taxCalculationEnum, taxJurisdictionCheckEnum, taxMeasureEnum } from './enums';
import { taxComponents } from './tax-components';
import { taxGroups } from './tax-groups';
import { taxJurisdictions } from './tax-jurisdictions';
import { organizationIdColumn, orgIsolationPolicy } from './workspace-scope';

export const taxGroupRates = commerceSchema.table(
  'tax_group_rates',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: organizationIdColumn(),
    taxGroupId: uuid('tax_group_id')
      .notNull()
      .references(() => taxGroups.id, { onDelete: 'cascade' }),
    taxComponentId: uuid('tax_component_id')
      .notNull()
      .references(() => taxComponents.id),
    jurisdictionId: uuid('jurisdiction_id').references(() => taxJurisdictions.id),
    jurisdictionCheck: taxJurisdictionCheckEnum('jurisdiction_check'),
    calculation: taxCalculationEnum('calculation').notNull(),
    rate: decimal('rate', { precision: 7, scale: 4, mode: 'number' }),
    amount: bigint('amount', { mode: 'bigint' }),
    currencyCode: varchar('currency_code', { length: 3 }),
    measure: taxMeasureEnum('measure'),
    base: taxBaseEnum('base').notNull().default('PRICE'),
    sequence: integer('sequence').notNull().default(0),
    validFrom: date('valid_from', { mode: 'string' }).notNull(),
    validTo: date('valid_to', { mode: 'string' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('idx_tax_group_rates_group').on(table.taxGroupId),
    index('idx_tax_group_rates_component').on(table.taxComponentId),
    index('idx_tax_group_rates_jurisdiction').on(table.jurisdictionId),
    check(
      'tax_group_rates_calculation_chk',
      sql`(${table.calculation} = 'PERCENT' and ${table.rate} is not null and ${table.amount} is null and ${table.currencyCode} is null and ${table.measure} is null)
        or (${table.calculation} = 'AMOUNT_PER_MEASURE' and ${table.rate} is null and ${table.amount} is not null and ${table.currencyCode} is not null and ${table.measure} is not null)`,
    ),
    check('tax_group_rates_validity_chk', sql`${table.validTo} is null or ${table.validTo} >= ${table.validFrom}`),
    orgIsolationPolicy(),
  ],
);

export type TaxGroupRate = typeof taxGroupRates.$inferSelect;
export type NewTaxGroupRate = typeof taxGroupRates.$inferInsert;
