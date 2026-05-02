import { bigint, decimal, index, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { sql } from '@vritti/api-sdk/drizzle-orm';
import { coreSchema } from './core-schema';
import { invoices } from './invoices';

export const invoiceItems = coreSchema.table(
  'invoice_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("current_setting('app.org_id')::uuid")),
    invoiceId: uuid('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
    description: varchar('description', { length: 255 }).notNull(),
    quantity: decimal('quantity', { precision: 12, scale: 3 }).notNull(),
    unitPrice: bigint('unit_price', { mode: 'number' }).notNull(),
    taxAmount: bigint('tax_amount', { mode: 'number' }).notNull().default(0),
    total: bigint('total', { mode: 'number' }).notNull(),
    referenceItemId: uuid('reference_item_id'),
  },
  (table) => [
    index('idx_invoice_items_invoice').on(table.invoiceId),
  ],
);

export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type NewInvoiceItem = typeof invoiceItems.$inferInsert;
