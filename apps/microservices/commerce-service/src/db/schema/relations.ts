import { defineRelations } from '@vritti/api-sdk/drizzle-orm';
import * as schema from './index';

export const relations = defineRelations(schema, (r) => ({
  // Category relations
  categories: {
    parent: r.one.categories({
      from: r.categories.parentId,
      to: r.categories.id,
      alias: 'parent',
    }),
    children: r.many.categories({
      alias: 'parent',
    }),
    products: r.many.products(),
  },

  // Product relations
  products: {
    category: r.one.categories({
      from: r.products.categoryId,
      to: r.categories.id,
    }),
    station: r.one.stations({
      from: r.products.stationId,
      to: r.stations.id,
    }),
  },

  // Station relations
  stations: {
    products: r.many.products(),
    orderItems: r.many.orderItems(),
  },

  // Order relations
  orders: {
    items: r.many.orderItems(),
    invoices: r.many.invoices(),
  },

  // Order item relations
  orderItems: {
    order: r.one.orders({
      from: r.orderItems.orderId,
      to: r.orders.id,
    }),
    station: r.one.stations({
      from: r.orderItems.stationId,
      to: r.stations.id,
    }),
  },

  // Invoice relations
  invoices: {
    order: r.one.orders({
      from: r.invoices.orderId,
      to: r.orders.id,
    }),
  },
}));
