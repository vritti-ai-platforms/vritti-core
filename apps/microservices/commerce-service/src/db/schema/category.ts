import { boolean, integer, timestamp, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { coreSchema } from './core-schema';

export const categories = coreSchema.table('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull(),
  businessUnitId: uuid('business_unit_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  image: varchar('image', { length: 255 }),
  parentId: uuid('parent_id'),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
