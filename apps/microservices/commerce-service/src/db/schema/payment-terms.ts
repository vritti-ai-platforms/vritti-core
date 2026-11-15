import { sql } from '@vritti/api-sdk/drizzle-orm';
import {
  boolean,
  check,
  decimal,
  index,
  integer,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { PaymentTermBaselineValues, paymentTermBaselineEnum } from './enums';
import { organizationIdColumn, orgIsolationPolicy } from './workspace-scope';

export const paymentTerms = commerceSchema.table(
  'payment_terms',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: organizationIdColumn(),
    name: varchar('name', { length: 255 }).notNull(),
    baseline: paymentTermBaselineEnum('baseline').notNull().default(PaymentTermBaselineValues.INVOICE_DATE),
    description: varchar('description', { length: 500 }),
    isPublished: boolean('is_published').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('idx_payment_terms_org').on(table.organizationId),
    uniqueIndex('uq_payment_terms_org_name').on(table.organizationId, sql`lower(${table.name})`),
    index('idx_payment_terms_org_published').on(table.organizationId, table.isPublished),
    orgIsolationPolicy(),
  ],
);

export type PaymentTerm = typeof paymentTerms.$inferSelect;
export type NewPaymentTerm = typeof paymentTerms.$inferInsert;

export const paymentTermRules = commerceSchema.table(
  'payment_term_rules',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: organizationIdColumn(),
    paymentTermId: uuid('payment_term_id')
      .notNull()
      .references(() => paymentTerms.id, { onDelete: 'cascade' }),
    percent: decimal('percent', { precision: 5, scale: 2, mode: 'number' }).notNull(),
    dueDays: integer('due_days').notNull(),
    discountPercent: decimal('discount_percent', { precision: 5, scale: 2, mode: 'number' }),
    discountDays: integer('discount_days'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_payment_term_rules_term_due_days').on(table.paymentTermId, table.dueDays),
    check('payment_term_rules_percent_chk', sql`${table.percent} > 0 AND ${table.percent} <= 100`),
    check('payment_term_rules_due_days_chk', sql`${table.dueDays} >= 0`),
    check(
      'payment_term_rules_discount_chk',
      sql`(${table.discountPercent} IS NULL) = (${table.discountDays} IS NULL)
        AND (${table.discountPercent} IS NULL OR (${table.discountPercent} > 0 AND ${table.discountPercent} < 100))
        AND (${table.discountDays} IS NULL OR (${table.discountDays} >= 0 AND ${table.discountDays} <= ${table.dueDays}))`,
    ),
    orgIsolationPolicy(),
  ],
);

export type PaymentTermRule = typeof paymentTermRules.$inferSelect;
export type NewPaymentTermRule = typeof paymentTermRules.$inferInsert;
