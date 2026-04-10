import { decimal, index, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { sql } from '@vritti/api-sdk/drizzle-orm';
import { coreSchema } from './core-schema';
import { invoices } from './invoices';

export const invoiceItems = coreSchema.table(
  'invoice_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql`current_setting('app.org_id')::uuid`),
    invoiceId: uuid('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
    description: varchar('description', { length: 255 }).notNull(),
    quantity: decimal('quantity', { precision: 12, scale: 3 }).notNull(),
    unitPrice: decimal('unit_price', { precision: 12, scale: 2 }).notNull(),
    taxAmount: decimal('tax_amount', { precision: 12, scale: 2 }).notNull().default('0'),
    total: decimal('total', { precision: 12, scale: 2 }).notNull(),
    referenceItemId: uuid('reference_item_id'),
  },
  (table) => [
    index('idx_invoice_items_invoice').on(table.invoiceId),
  ],
);

export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type NewInvoiceItem = typeof invoiceItems.$inferInsert;
