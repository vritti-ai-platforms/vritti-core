import { sql } from '@vritti/api-sdk/drizzle-orm';
import {
  check,
  codeCheck,
  decimal,
  index,
  integer,
  timestamp,
  unique,
  uuid,
  varchar,
} from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { paymentTermBaselineEnum, paymentTermStatusEnum } from './enums';
import { organizationIdColumn, orgIsolationPolicy } from './workspace-scope';

export const paymentTerms = commerceSchema.table(
  'payment_terms',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: organizationIdColumn,
    code: varchar('code', { length: 50 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    baseline: paymentTermBaselineEnum('baseline').notNull().default('INVOICE_DATE'),
    description: varchar('description', { length: 500 }),
    status: paymentTermStatusEnum('status').notNull().default('DRAFT'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_payment_terms_org_code').on(table.organizationId, table.code),
    index('idx_payment_terms_org').on(table.organizationId),
    index('idx_payment_terms_org_status').on(table.organizationId, table.status),
    codeCheck('payment_terms_code_chk', table.code),
    orgIsolationPolicy(),
  ],
);

export type PaymentTerm = typeof paymentTerms.$inferSelect;
export type NewPaymentTerm = typeof paymentTerms.$inferInsert;

export const paymentTermLines = commerceSchema.table(
  'payment_term_lines',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: organizationIdColumn,
    paymentTermId: uuid('payment_term_id')
      .notNull()
      .references(() => paymentTerms.id, { onDelete: 'cascade' }),
    sortOrder: integer('sort_order').notNull().default(0),
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
    index('idx_payment_term_lines_term').on(table.paymentTermId, table.sortOrder),
    check('payment_term_lines_percent_chk', sql`${table.percent} > 0 AND ${table.percent} <= 100`),
    check('payment_term_lines_due_days_chk', sql`${table.dueDays} >= 0`),
    check(
      'payment_term_lines_discount_chk',
      sql`(${table.discountPercent} IS NULL) = (${table.discountDays} IS NULL)
        AND (${table.discountPercent} IS NULL OR (${table.discountPercent} > 0 AND ${table.discountPercent} < 100))
        AND (${table.discountDays} IS NULL OR (${table.discountDays} >= 0 AND ${table.discountDays} <= ${table.dueDays}))`,
    ),
    orgIsolationPolicy(),
  ],
);

export type PaymentTermLine = typeof paymentTermLines.$inferSelect;
export type NewPaymentTermLine = typeof paymentTermLines.$inferInsert;
