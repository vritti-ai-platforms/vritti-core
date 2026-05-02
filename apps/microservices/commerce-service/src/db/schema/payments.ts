import { sql } from '@vritti/api-sdk/drizzle-orm';
import { bigint, index, text, timestamp, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { coreSchema } from './core-schema';
import { paymentMethodEnum, paymentStatusEnum } from './enums';
import { invoices } from './invoices';

export const payments = coreSchema.table(
  'payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("current_setting('app.org_id')::uuid")),
    invoiceId: uuid('invoice_id')
      .notNull()
      .references(() => invoices.id, { onDelete: 'cascade' }),
    amount: bigint('amount', { mode: 'number' }).notNull(),
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
