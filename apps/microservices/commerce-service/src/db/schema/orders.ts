import { bigint, decimal, index, integer, pgPolicy, text, timestamp, unique, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { sql } from '@vritti/api-sdk/drizzle-orm';
import { coreSchema } from './core-schema';
import { customers } from './customers';
import { orderSourceEnum, orderStatusEnum, orderTypeEnum } from './enums';
import { items } from './items';
import { itemVariants } from './item-variants';

export const orders = coreSchema.table(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql`current_setting('app.org_id')::uuid`),
    businessUnitId: uuid('business_unit_id').notNull().default(sql`current_setting('app.bu_id')::uuid`),
    orderNumber: varchar('order_number', { length: 50 }).notNull(),
    type: orderTypeEnum('type').notNull(),
    channel: orderSourceEnum('channel').notNull(),
    status: orderStatusEnum('status').notNull().default('PENDING'),
    customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),
    customerName: varchar('customer_name', { length: 255 }),
    customerPhone: varchar('customer_phone', { length: 20 }),
    deliveryAddress: text('delivery_address'),
    subtotal: bigint('subtotal', { mode: 'number' }).notNull().default(0),
    taxAmount: bigint('tax_amount', { mode: 'number' }).notNull().default(0),
    serviceCharge: bigint('service_charge', { mode: 'number' }).notNull().default(0),
    deliveryCharge: bigint('delivery_charge', { mode: 'number' }).notNull().default(0),
    discountAmount: bigint('discount_amount', { mode: 'number' }).notNull().default(0),
    totalAmount: bigint('total_amount', { mode: 'number' }).notNull().default(0),
    notes: text('notes'),
    externalOrderId: varchar('external_order_id', { length: 100 }),
    placedAt: timestamp('placed_at', { withTimezone: true }).defaultNow().notNull(),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
    readyAt: timestamp('ready_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    cancellationReason: text('cancellation_reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_orders_org_number').on(table.organizationId, table.orderNumber),
    index('idx_orders_bu').on(table.organizationId, table.businessUnitId),
    index('idx_orders_status').on(table.status),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = current_setting('app.org_id', true)::uuid`,
    }),
    pgPolicy('bu_ancestor_read', {
      for: 'select',
      using: sql`business_unit_id = ANY(current_setting('app.bu_ancestor_ids', true)::uuid[])`,
    }),
    pgPolicy('bu_write', {
      for: 'insert',
      withCheck: sql`business_unit_id = current_setting('app.bu_id', true)::uuid`,
    }),
    pgPolicy('bu_update', {
      for: 'update',
      using: sql`business_unit_id = current_setting('app.bu_id', true)::uuid`,
    }),
    pgPolicy('bu_delete', {
      for: 'delete',
      using: sql`business_unit_id = current_setting('app.bu_id', true)::uuid`,
    }),
  ],
);

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;

export const orderItems = coreSchema.table(
  'order_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql`current_setting('app.org_id')::uuid`),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    itemId: uuid('item_id')
      .notNull()
      .references(() => items.id),
    variantId: uuid('variant_id')
      .notNull()
      .references(() => itemVariants.id),
    itemName: varchar('item_name', { length: 255 }).notNull(),
    variantName: varchar('variant_name', { length: 255 }),
    quantity: integer('quantity').notNull().default(1),
    unitPrice: bigint('unit_price', { mode: 'number' }).notNull(),
    taxRate: decimal('tax_rate', { precision: 5, scale: 2 }).notNull(),
    taxAmount: bigint('tax_amount', { mode: 'number' }).notNull(),
    subtotal: bigint('subtotal', { mode: 'number' }).notNull(),
    total: bigint('total', { mode: 'number' }).notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_order_items_order').on(table.orderId),
  ],
);

export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;

export const orderItemModifiers = coreSchema.table(
  'order_item_modifiers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql`current_setting('app.org_id')::uuid`),
    orderItemId: uuid('order_item_id')
      .notNull()
      .references(() => orderItems.id, { onDelete: 'cascade' }),
    modifierGroupId: uuid('modifier_group_id').notNull(),
    modifierOptionId: uuid('modifier_option_id').notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    additionalPrice: bigint('additional_price', { mode: 'number' }).notNull(),
  },
  (table) => [
    index('idx_order_item_modifiers_item').on(table.orderItemId),
  ],
);

export type OrderItemModifier = typeof orderItemModifiers.$inferSelect;
export type NewOrderItemModifier = typeof orderItemModifiers.$inferInsert;
