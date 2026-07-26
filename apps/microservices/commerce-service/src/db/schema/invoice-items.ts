import { sql } from '@vritti/api-sdk/drizzle-orm';
import { bigint, decimal, index, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { invoices } from './invoices';

export const invoiceItems = commerceSchema.table(
  'invoice_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    invoiceId: uuid('invoice_id')
      .notNull()
      .references(() => invoices.id, { onDelete: 'cascade' }),
    description: varchar('description', { length: 255 }).notNull(),
    quantity: decimal('quantity', { precision: 12, scale: 3, mode: 'number' }).notNull(),
    unitPrice: bigint('unit_price', { mode: 'bigint' }).notNull(),
    taxAmount: bigint('tax_amount', { mode: 'bigint' }).notNull().default(0n),
    total: bigint('total', { mode: 'bigint' }).notNull(),
    referenceItemId: uuid('reference_item_id'),
  },
  (table) => [index('idx_invoice_items_invoice').on(table.invoiceId)],
);

export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type NewInvoiceItem = typeof invoiceItems.$inferInsert;
