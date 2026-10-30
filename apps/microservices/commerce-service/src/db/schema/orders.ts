import { sql } from '@vritti/api-sdk/drizzle-orm';
import {
  bigint,
  boolean,
  decimal,
  index,
  integer,
  pgPolicy,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from '@vritti/api-sdk/drizzle-pg-core';
import { checkouts } from './checkouts';
import { commerceSchema } from './commerce-schema';
import { customers } from './customers';
import { orderSourceEnum, orderStatusEnum, orderTypeEnum } from './enums';
import { offeringVariants } from './offering-variants';
import { offerings } from './offerings';
import { parties } from './parties';
import { organizationIdColumn, orgIsolationPolicy } from './workspace-scope';

export const orders = commerceSchema.table(
  'orders',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: organizationIdColumn,
    siteId: uuid('site_id').notNull().default(sql.raw("cast(current_setting('app.site_id') as uuid)")),
    orderNumber: varchar('order_number', { length: 50 }).notNull(),
    type: orderTypeEnum('type').notNull(),
    channel: orderSourceEnum('channel').notNull(),
    status: orderStatusEnum('status').notNull().default('PENDING'),
    customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),
    partyId: uuid('party_id').references(() => parties.id, { onDelete: 'set null' }),
    customerName: varchar('customer_name', { length: 255 }),
    customerPhone: varchar('customer_phone', { length: 20 }),
    deliveryAddress: text('delivery_address'),
    subtotal: bigint('subtotal', { mode: 'bigint' }).notNull().default(0n),
    taxAmount: bigint('tax_amount', { mode: 'bigint' }).notNull().default(0n),
    serviceCharge: bigint('service_charge', { mode: 'bigint' }).notNull().default(0n),
    deliveryCharge: bigint('delivery_charge', { mode: 'bigint' }).notNull().default(0n),
    discountAmount: bigint('discount_amount', { mode: 'bigint' }).notNull().default(0n),
    totalAmount: bigint('total_amount', { mode: 'bigint' }).notNull().default(0n),
    currencyCode: varchar('currency_code', { length: 3 }),
    notes: text('notes'),
    externalOrderId: varchar('external_order_id', { length: 100 }),
    placedAt: timestamp('placed_at', { withTimezone: true }).defaultNow().notNull(),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
    readyAt: timestamp('ready_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    cancellationReason: text('cancellation_reason'),
    paymentIntentId: uuid('payment_intent_id'),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    paymentMethod: varchar('payment_method', { length: 30 }),
    paymentReference: varchar('payment_reference', { length: 100 }),
    needsReview: boolean('needs_review').notNull().default(false),
    // The checkout this order was made from once its payment landed; the other stores' orders share it
    checkoutId: uuid('checkout_id').references(() => checkouts.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_orders_org_number').on(table.organizationId, table.orderNumber),
    // A payment pays one order per store; a checkout across stores shares its intent between their orders
    unique('uq_orders_payment_intent').on(table.paymentIntentId, table.siteId),
    index('idx_orders_party').on(table.organizationId, table.partyId),
    index('idx_orders_site').on(table.organizationId, table.siteId),
    index('idx_orders_status').on(table.status),
    index('idx_orders_checkout').on(table.checkoutId),
    orgIsolationPolicy(),
    pgPolicy('site_read', {
      for: 'select',
      using: sql`site_id = (select current_setting('app.site_id', true)::uuid)`,
    }),
    pgPolicy('site_write', {
      for: 'insert',
      withCheck: sql`site_id = (select current_setting('app.site_id', true)::uuid)`,
    }),
    pgPolicy('site_update', {
      for: 'update',
      using: sql`site_id = (select current_setting('app.site_id', true)::uuid)`,
    }),
    pgPolicy('site_delete', {
      for: 'delete',
      using: sql`site_id = (select current_setting('app.site_id', true)::uuid)`,
    }),
  ],
);

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;

export const orderItems = commerceSchema.table(
  'order_items',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: organizationIdColumn,
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    offeringId: uuid('offering_id')
      .notNull()
      .references(() => offerings.id),
    offeringVariantId: uuid('offering_variant_id')
      .notNull()
      .references(() => offeringVariants.id),
    name: varchar('name', { length: 500 }).notNull(),
    code: varchar('code', { length: 200 }),
    quantity: integer('quantity').notNull().default(1),
    unitPrice: bigint('unit_price', { mode: 'bigint' }).notNull(),
    taxRate: decimal('tax_rate', { precision: 5, scale: 2, mode: 'number' }).notNull(),
    taxAmount: bigint('tax_amount', { mode: 'bigint' }).notNull(),
    subtotal: bigint('subtotal', { mode: 'bigint' }).notNull(),
    total: bigint('total', { mode: 'bigint' }).notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_order_items_order').on(table.orderId),
    index('idx_order_items_variant').on(table.offeringVariantId),
  ],
);

export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
