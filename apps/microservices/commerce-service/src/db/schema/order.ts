import { numeric, text, timestamp, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { coreSchema } from './core-schema';
import { orderSourceEnum, orderStatusEnum, paymentMethodEnum } from './enums';

export const orders = coreSchema.table('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull(),
  businessUnitId: uuid('business_unit_id').notNull(),
  orderNumber: varchar('order_number', { length: 50 }).notNull(),
  source: orderSourceEnum('source').notNull(),
  status: orderStatusEnum('status').notNull().default('PENDING'),
  customerId: uuid('customer_id'),
  customerPhone: varchar('customer_phone', { length: 20 }),
  voopOrderId: varchar('voop_order_id', { length: 255 }),
  subtotal: numeric('subtotal').notNull(),
  tax: numeric('tax').notNull().default('0'),
  discount: numeric('discount').notNull().default('0'),
  total: numeric('total').notNull(),
  notes: text('notes'),
  paymentMethod: paymentMethodEnum('payment_method').notNull().default('UNPAID'),
  paidAt: timestamp('paid_at'),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
