import { boolean, integer, numeric, text, timestamp, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { categories } from './category';
import { coreSchema } from './core-schema';
import { stations } from './station';

export const products = coreSchema.table('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull(),
  businessUnitId: uuid('business_unit_id').notNull(),
  categoryId: uuid('category_id').references(() => categories.id),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  image: varchar('image', { length: 255 }),
  price: numeric('price').notNull(),
  stationId: uuid('station_id').references(() => stations.id),
  sku: varchar('sku', { length: 100 }),
  unit: varchar('unit', { length: 50 }),
  isAvailable: boolean('is_available').notNull().default(true),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
