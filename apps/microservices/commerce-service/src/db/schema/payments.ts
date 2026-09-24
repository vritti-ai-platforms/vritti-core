import { bigint, index, text, timestamp, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { paymentMethodEnum, paymentStatusEnum } from './enums';
import { invoices } from './invoices';
import { organizationIdColumn } from './workspace-scope';

export const payments = commerceSchema.table(
  'payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: organizationIdColumn,
    invoiceId: uuid('invoice_id')
      .notNull()
      .references(() => invoices.id, { onDelete: 'cascade' }),
    amount: bigint('amount', { mode: 'bigint' }).notNull(),
    method: paymentMethodEnum('method').notNull(),
    reference: varchar('reference', { length: 255 }),
    status: paymentStatusEnum('status').notNull().default('COMPLETED'),
    paidAt: timestamp('paid_at', { withTimezone: true }).defaultNow().notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('idx_payments_invoice').on(table.invoiceId)],
);

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
