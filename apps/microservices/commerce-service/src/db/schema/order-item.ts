import { integer, numeric, text, timestamp, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { coreSchema } from './core-schema';
import { orderItemStatusEnum } from './enums';
import { orders } from './order';
import { stations } from './station';

export const orderItems = coreSchema.table('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  productId: uuid('product_id'),
  name: varchar('name', { length: 255 }).notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: numeric('unit_price').notNull(),
  total: numeric('total').notNull(),
  notes: text('notes'),
  stationId: uuid('station_id').references(() => stations.id),
  kotNumber: integer('kot_number'),
  status: orderItemStatusEnum('status').notNull().default('PENDING'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
