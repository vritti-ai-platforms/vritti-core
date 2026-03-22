import { jsonb, numeric, timestamp, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { coreSchema } from './core-schema';
import { invoiceStatusEnum } from './enums';
import { orders } from './order';

export interface InvoiceLineItem {
  name: string;
  quantity: number;
  unitPrice: string;
  total: string;
}

export const invoices = coreSchema.table('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull(),
  businessUnitId: uuid('business_unit_id').notNull(),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id),
  invoiceNumber: varchar('invoice_number', { length: 50 }).notNull(),
  customerId: uuid('customer_id'),
  customerPhone: varchar('customer_phone', { length: 20 }),
  customerName: varchar('customer_name', { length: 255 }),
  items: jsonb('items').notNull().$type<InvoiceLineItem[]>(),
  subtotal: numeric('subtotal').notNull(),
  tax: numeric('tax').notNull().default('0'),
  discount: numeric('discount').notNull().default('0'),
  total: numeric('total').notNull(),
  status: invoiceStatusEnum('status').notNull().default('DRAFT'),
  issuedAt: timestamp('issued_at'),
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;
